import sql from '@/lib/db';

export async function searchRelevantChunks(queryEmbedding: number[], limit = 5) {
  const chunks = await sql`
    select content, heading_path,
           1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    from document_chunks
    order by embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    limit ${limit}
  `;
  return chunks;
}