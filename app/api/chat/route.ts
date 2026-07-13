import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embedTexts } from '@/lib/embeddings';
import { searchRelevantChunks } from '@/lib/search';
import { getUserFromRequest } from '@/lib/auth';
import sql from '@/lib/db';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(req: Request) {
  // console.log('=== DEBUG: REQUEST MASUK ===', new Date().toISOString()); // DEBUG

  const user = await getUserFromRequest(req);
  // console.log('DEBUG: User:', user?.id ?? 'NULL - unauthorized'); // DEBUG

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, conversationId: incomingId } = await req.json();

  // console.log('DEBUG: Raw messages diterima:', JSON.stringify(messages, null, 2)); // DEBUG
  // console.log('DEBUG: incomingId (conversationId dari client):', incomingId); // DEBUG

  const question = messages[messages.length - 1].content;

  // console.log('DEBUG: Question yang dipakai buat embed:', question); // DEBUG

  let conversationId = incomingId;

  if (!conversationId) {
    const [newConv] = await sql`
      insert into conversations (title, user_id)
      values (${question.slice(0, 50)}, ${user.id})
      returning id
    `;
    conversationId = newConv.id;
    // console.log('DEBUG: Conversation baru dibuat:', conversationId); // DEBUG
  } else {
    const [conv] = await sql`
      select id from conversations where id = ${conversationId} and user_id = ${user.id}
    `;
    // console.log('DEBUG: Conversation existing ditemukan?', !!conv); // DEBUG
    if (!conv) {
      return Response.json({ error: 'Conversation not found or not yours' }, { status: 403 });
    }
  }

  await sql`
    insert into messages (conversation_id, role, content)
    values (${conversationId}, 'user', ${question})
  `;

  const [queryEmbedding] = await embedTexts([question], 'query');

  // console.log('DEBUG: Embedding berhasil dibuat, length:', queryEmbedding?.length); // DEBUG

  const chunks = await searchRelevantChunks(queryEmbedding, 5);

  // console.log('DEBUG: Jumlah chunk ditemukan:', chunks.length); // DEBUG
  // console.log('DEBUG: Isi chunks:', JSON.stringify(chunks, null, 2)); // DEBUG

  const context = chunks.map((c: any) => `[${c.heading_path}]\n${c.content}`).join('\n\n---\n\n');

  // console.log('DEBUG: Context final yang dikirim ke AI:', context); // DEBUG

  const result = streamText({
    model: google('gemma-4-31b-it'),
    system: `Kamu adalah asisten aplikasi EvoChat yang menjawab
     HANYA berdasarkan konteks di bawah ini. 
     Konteks ini SUDAH VALID dan TERKINI — JANGAN menambahkan disclaimer
      soal "tidak punya akses real-time" atau "informasi bisa berubah",
       karena konteks ini sudah pasti benar. 
       Jika informasi yang ditanya ADA di konteks,
        jawab langsung dan lengkap.
         Jika BENAR-BENAR tidak ada di konteks, baru bilang tidak menemukan informasinya dan tambahkan
         "Silahkan untuk menghubungi Helpdesk yang tersedia jika membutuhkan bantuan lebih lanjut" di akhir pesan.\n\nKonteks:\n${context}`,
    messages,
    maxOutputTokens: 2048,
     temperature: 0.2,
    onFinish: async ({ text }) => {
      // console.log('DEBUG: Jawaban AI final:', text); // DEBUG
      await sql`
        insert into messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${text})
      `;
    },
  });

  const response = result.toTextStreamResponse();
  response.headers.set('X-Conversation-Id', conversationId);
  // console.log('=== DEBUG: RESPONSE DIKIRIM ===', new Date().toISOString()); // DEBUG
  return response;
}