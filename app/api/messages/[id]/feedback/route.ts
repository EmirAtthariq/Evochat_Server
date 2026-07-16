import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { feedback } = await req.json();

  if (feedback !== 'up' && feedback !== 'down' && feedback !== null) {
    return Response.json({ error: 'Feedback harus "up", "down", atau null' }, { status: 400 });
  }

  // pastiin pesan ini emang punya user yang login (lewat join ke conversations)
  const [message] = await sql`
    select m.id
    from messages m
    join conversations c on c.id = m.conversation_id
    where m.id = ${id} and c.user_id = ${user.id} and m.role = 'assistant'
  `;

  if (!message) {
    return Response.json({ error: 'Pesan tidak ditemukan' }, { status: 404 });
  }

  await sql`update messages set feedback = ${feedback} where id = ${id}`;

  return Response.json({ success: true });
}