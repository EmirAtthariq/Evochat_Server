import sql from '@/lib/db';
import { uploadFile, downloadFile } from '@/lib/storage';
import { extractText } from '@/lib/extract';
import { chunkMarkdown } from '@/lib/chunk';
import { embedTexts } from '@/lib/embeddings';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const domisili = formData.get('domisili') as string | null; // null/kosong = umum

  if (!file) return Response.json({ error: 'no file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const [doc] = await sql`
    insert into documents (title, mime_type, status, domisili)
    values (${file.name}, ${file.type}, 'processing', ${domisili || null})
    returning id
  `;

  const filePath = `${doc.id}/${file.name}`;

  try {
    await uploadFile(buffer, filePath, file.type);
    await sql`update documents set file_path = ${filePath} where id = ${doc.id}`;

    const markdown = await extractText(buffer, file.type, file.name);
    const chunks = chunkMarkdown(markdown);

    if (chunks.length === 0) {
      throw new Error('No content extracted from document');
    }

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

    await sql`update documents set status = 'ready' where id = ${doc.id}`;
    return Response.json({ id: doc.id, chunks: chunks.length, status: 'ready' });

  } catch (err: any) {
    await sql`update documents set status = 'failed', error_message = ${err.message} where id = ${doc.id}`;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const docs = await sql`
    select id, title, status, error_message, domisili, created_at
    from documents order by created_at desc
  `;
  return Response.json(docs);
}