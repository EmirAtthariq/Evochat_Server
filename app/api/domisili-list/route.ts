import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`select nama from domisili order by nama`;
  return Response.json(rows.map((r) => r.nama));
}