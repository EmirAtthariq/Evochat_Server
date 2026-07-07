import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { embedTexts } from '@/lib/embeddings';
import { searchRelevantChunks } from '@/lib/search';
import sql from '@/lib/db';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

export async function POST(req: Request) {
  const { messages, conversationId: incomingId } = await req.json();
  const question = messages[messages.length - 1].content;

  let conversationId = incomingId;
  if (!conversationId) {
    const [newConv] = await sql`
      insert into conversations (title)
      values (${question.slice(0, 50)})
      returning id
    `;
    conversationId = newConv.id;
  }

  await sql`
    insert into messages (conversation_id, role, content)
    values (${conversationId}, 'user', ${question})
  `;

  const [queryEmbedding] = await embedTexts([question], 'query');
  const chunks = await searchRelevantChunks(queryEmbedding, 5);
  const context = chunks.map((c: any) => `[${c.heading_path}]\n${c.content}`).join('\n\n---\n\n');

  const result = streamText({
    model: google('gemini-2.5-flash'),
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
  return response;
}