import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversations = await sql`
    select id, title, created_at
    from conversations
    where user_id = ${user.id}
    order by created_at desc
  `;

  return Response.json(conversations);
}