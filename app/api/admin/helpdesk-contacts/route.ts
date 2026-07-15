import sql from '@/lib/db';

export async function GET() {
  const contacts = await sql`
    select id, domisili, label, pic_name, whatsapp_number, created_at
    from helpdesk_contacts
    order by domisili, label
  `;
  return Response.json(contacts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { domisili, label, pic_name, whatsapp_number } = body;

  if (!domisili || !label || !whatsapp_number) {
    return Response.json({ error: 'Domisili, label, dan nomor WA wajib diisi' }, { status: 400 });
  }

  const [contact] = await sql`
    insert into helpdesk_contacts (domisili, label, pic_name, whatsapp_number)
    values (${domisili}, ${label}, ${pic_name || null}, ${whatsapp_number})
    returning id
  `;

  return Response.json({ id: contact.id });
}