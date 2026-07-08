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
  console.log('=== REQUEST MASUK ===', new Date().toISOString());
  
  const user = await getUserFromRequest(req);
  console.log('User:', user?.id ?? 'NULL - unauthorized');
  
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

  const [queryEmbedding] = await embedTexts([question], 'query');
  const chunks = await searchRelevantChunks(queryEmbedding, 5);
  const context = chunks.map((c: any) => `[${c.heading_path}]\n${c.content}`).join('\n\n---\n\n');

  const result = streamText({
    model: google('gemma-4-31b-it'),
    system: `Kamu adalah asisten yang menjawab pertanyaan HANYA berdasarkan konteks berikut. Jawab se MANUSIA mungkin. Kalau informasinya tidak ada di konteks, jawab dengan jujur bahwa kamu tidak menemukan informasi tersebut.\n\nKonteks:\n${context}`,
    messages,
    maxOutputTokens: 2048,
    onFinish: async ({ text }) => {
      await sql`
        insert into messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${text})
      `;
    },
  });

const response = result.toTextStreamResponse();
response.headers.set('X-Conversation-Id', conversationId);
console.log('=== RESPONSE DIKIRIM ===', new Date().toISOString());
return response;
  return response;
}