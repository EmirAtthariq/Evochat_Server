import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // pastiin conversation ini emang punya user yang login
  const [conversation] = await sql`
    select id, title from conversations where id = ${id} and user_id = ${user.id}
  `;

  if (!conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await sql`
    select role, content, created_at
    from messages
    where conversation_id = ${id}
    order by created_at asc
  `;

  return Response.json({ conversation, messages });
}