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
  const user = await getUserFromRequest(req);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages, conversationId: incomingId } = await req.json();
  const question = messages[messages.length - 1].content;

  let conversationId = incomingId;

  if (!conversationId) {
    const [newConv] = await sql`
      insert into conversations (title, user_id)
      values (${question.slice(0, 50)}, ${user.id})
      returning id
    `;
    conversationId = newConv.id;
  } else {
    const [conv] = await sql`
      select id from conversations where id = ${conversationId} and user_id = ${user.id}
    `;
    if (!conv) {
      return Response.json({ error: 'Conversation not found or not yours' }, { status: 403 });
    }
  }

  await sql`
    insert into messages (conversation_id, role, content)
    values (${conversationId}, 'user', ${question})
  `;

  // ambil domisili user buat scoping knowledge base
  const [profile] = await sql`select domisili from profiles where id = ${user.id}`;
  const userDomisili = profile?.domisili ?? null;

  const [queryEmbedding] = await embedTexts([question], 'query');
  const chunks = await searchRelevantChunks(queryEmbedding, userDomisili, 5);
  const context = chunks.map((c: any) => `[${c.heading_path}]\n${c.content}`).join('\n\n---\n\n');

  const result = streamText({
    model: google('gemma-4-31b-it'),
    system: `Kamu adalah asisten ramah aplikasi EvoChat yang menjawab pertanyaan
     HANYA berdasarkan konteks di bawah ini. 
     Konteks ini SUDAH VALID dan TERKINI — JANGAN menambahkan disclaimer
      soal "tidak punya akses real-time" atau "informasi bisa berubah",
       karena konteks ini sudah pasti benar. 
       Jika informasi yang ditanya ADA di konteks,
        jawab langsung dan lengkap secara formal.
         Jika informasi yang ditanyakan BENAR-BENAR tidak ada di konteks, 
         baru bilang tidak menemukan informasinya.
        dan hindari kata-kata yang bersifat spekulatif serta terlalu teknis.
        Jika input bukanlah sebuah kalimat yang jelas, jawab dengan sopan bahwa kamu tidak dapat menjawab.

        Jika dapat menjawab pertanyaan, tambahkan di akhir kalimat jawabanmu dengan jarak satu baris: "Apakah ada lagi yang bisa saya bantu?".
        Jika tidak dapat menjawab pertanyaan, tambahkan di akhir jawabanmu dengan jarak satu baris:
         "Silahkan untuk menghubungi Helpdesk yang tersedia jika membutuhkan bantuan lebih lanjut" di akhir pesan 
         HANYA JIKA TIDAK DAPAT MENJAWAB PERTANYAANNYA.

         \n\nKonteks:\n${context}`,
    messages,
    maxOutputTokens: 2048,
    temperature: 0.2,
    onFinish: async ({ text }) => {
      await sql`
        insert into messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${text})
      `;
    },
  });

  const response = result.toTextStreamResponse();
  response.headers.set('X-Conversation-Id', conversationId);
  return response;
}