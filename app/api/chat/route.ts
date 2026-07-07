import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { embedTexts } from '@/lib/embeddings';
import { searchRelevantChunks } from '@/lib/search';

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });

export async function POST(req: Request) {
  const { messages } = await req.json();
  const question = messages[messages.length - 1].content;

  // 1. embed pertanyaan user
  const [queryEmbedding] = await embedTexts([question], 'query');

  // 2. cari chunk paling relevan
  const chunks = await searchRelevantChunks(queryEmbedding, 5);

  const context = chunks
    .map((c: any) => `[${c.heading_path}]\n${c.content}`)
    .join('\n\n---\n\n');

  // 3. compose prompt + panggil Gemini via OpenRouter, stream jawaban
const result = streamText({
  model: openrouter('google/gemini-2.5-flash'),
  system: `Kamu adalah asisten yang menjawab pertanyaan HANYA berdasarkan konteks berikut. Kalau informasinya tidak ada di konteks, jawab dengan jujur bahwa kamu tidak menemukan informasi tersebut.\n\nKonteks:\n${context}`,
  messages,
  maxOutputTokens: 2048, // batasi biar gak minta kredit segede itu
});

  return result.toTextStreamResponse();
}