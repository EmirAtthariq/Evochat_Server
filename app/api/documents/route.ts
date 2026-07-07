import sql from '@/lib/db';
import { uploadFile, downloadFile } from '@/lib/storage';
import { extractText } from '@/lib/extract';
import { chunkMarkdown } from '@/lib/chunk';
import { embedTexts } from '@/lib/embeddings';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) return Response.json({ error: 'no file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. simpan record dulu, status processing
  const [doc] = await sql`
    insert into documents (title, mime_type, status)
    values (${file.name}, ${file.type}, 'processing')
    returning id
  `;

  const filePath = `${doc.id}/${file.name}`;

  try {
    // 2. upload file mentah ke storage
    await uploadFile(buffer, filePath, file.type);
    await sql`update documents set file_path = ${filePath} where id = ${doc.id}`;

    // 3. extract -> markdown -> chunk
    const markdown = await extractText(buffer, file.type);
    const chunks = chunkMarkdown(markdown);

    if (chunks.length === 0) {
      throw new Error('No content extracted from document');
    }

    // 4. embed per batch (voyage max ~128 input per request, aman pake 50)
    const BATCH_SIZE = 50;
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const textsToEmbed = batch.map(c => `${c.headingPath}\n\n${c.content}`);
      const embeddings = await embedTexts(textsToEmbed, 'document');

      for (let j = 0; j < batch.length; j++) {
        await sql`
          insert into document_chunks (document_id, content, heading_path, embedding, chunk_index)
          values (${doc.id}, ${batch[j].content}, ${batch[j].headingPath},
                  ${JSON.stringify(embeddings[j])}, ${i + j})
        `;
      }
    }

    // 5. selesai
    await sql`update documents set status = 'ready' where id = ${doc.id}`;
    return Response.json({ id: doc.id, chunks: chunks.length, status: 'ready' });

  } catch (err: any) {
    console.error('Document processing failed:', err);
    console.error('cause:', err.cause);
    await sql`update documents set status = 'failed', error_message = ${err.message} where id = ${doc.id}`;
    return Response.json({ error: err.message, cause: err.cause?.message }, { status: 500 });
  }
}

export async function GET() {
  const docs = await sql`select id, title, status, created_at from documents order by created_at desc`;
  return Response.json(docs);
}