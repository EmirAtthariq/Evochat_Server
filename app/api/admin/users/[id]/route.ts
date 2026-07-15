import sql from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { nama, domisili } = body;

  // upsert: kalau profile belum ada buat user ini, bikin baru; kalau udah ada, update
  await sql`
    insert into profiles (id, nama, domisili)
    values (${id}, ${nama || null}, ${domisili || null})
    on conflict (id) do update
    set nama = ${nama || null}, domisili = ${domisili || null}
  `;

  return Response.json({ success: true });
}