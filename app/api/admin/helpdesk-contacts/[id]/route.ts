import sql from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { domisili, label, pic_name, whatsapp_number } = body;

  if (!domisili || !label || !whatsapp_number) {
    return Response.json({ error: 'Domisili, label, dan nomor WA wajib diisi' }, { status: 400 });
  }

  await sql`
    update helpdesk_contacts
    set domisili = ${domisili}, label = ${label}, pic_name = ${pic_name || null}, whatsapp_number = ${whatsapp_number}
    where id = ${id}
  `;

  return Response.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sql`delete from helpdesk_contacts where id = ${id}`;
  return Response.json({ success: true });
}