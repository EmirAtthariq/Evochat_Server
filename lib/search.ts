import sql from '@/lib/db';

export async function searchRelevantChunks(
  queryEmbedding: number[],
  domisili: string | null,
  limit = 5
) {
  const chunks = await sql`
    select dc.content, dc.heading_path,
           1 - (dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
    from document_chunks dc
    join documents d on d.id = dc.document_id
    where d.domisili is null or d.domisili = ${domisili}
    order by dc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
    limit ${limit}
  `;
  return chunks;
}