import sql from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`delete from domisili where id = ${id}`;
  return Response.json({ success: true });
}