import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile] = await sql`select domisili from profiles where id = ${user.id}`;

  if (!profile?.domisili) {
    return Response.json(
      { error: 'Domisili belum di-assign untuk akun ini, hubungi admin.' },
      { status: 404 }
    );
  }

  const contacts = await sql`
    select id, label, whatsapp_number
    from helpdesk_contacts
    where domisili = ${profile.domisili}
    order by label
  `;

  return Response.json({ domisili: profile.domisili, contacts });
}