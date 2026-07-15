import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`select id, nama from domisili order by nama`;
  return Response.json(rows);
}

export async function POST(req: Request) {
  const { nama } = await req.json();

  if (!nama || !nama.trim()) {
    return Response.json({ error: 'Nama domisili wajib diisi' }, { status: 400 });
  }

  try {
    const [row] = await sql`
      insert into domisili (nama) values (${nama.trim()}) returning id
    `;
    return Response.json({ id: row.id });
  } catch (err: any) {
    if (err.message?.includes('unique')) {
      return Response.json({ error: 'Domisili ini sudah ada' }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}