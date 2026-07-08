import sql from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // ambil file_path dulu sebelum record-nya kehapus
  const [doc] = await sql`select file_path from documents where id = ${id}`;

  if (!doc) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  // hapus file dari storage (kalau ada)
  if (doc.file_path) {
    await supabase.storage.from('documents').remove([doc.file_path]);
  }

  // hapus record dari database
  // document_chunks otomatis ikut kehapus kalau schema-nya "on delete cascade"
  await sql`delete from documents where id = ${id}`;

  return Response.json({ success: true });
}