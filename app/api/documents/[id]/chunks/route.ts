import sql from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const document = await sql`
    select id, title, status, error_message, created_at
    from documents where id = ${id}
  `;

  if (document.length === 0) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  const chunks = await sql`
    select id, content, heading_path, chunk_index
    from document_chunks
    where document_id = ${id}
    order by chunk_index
  `;

  return Response.json({ document: document[0], chunks });
}