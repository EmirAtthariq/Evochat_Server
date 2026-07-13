import sql from '@/lib/db';

export async function GET() {
  const rows = await sql`
    select distinct domisili from helpdesk_contacts order by domisili
  `;
  return Response.json(rows.map((r) => r.domisili));
}