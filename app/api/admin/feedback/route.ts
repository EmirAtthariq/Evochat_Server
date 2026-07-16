import sql from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get('type') ?? 'all'; // 'up' | 'down' | 'all'
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);
  const offset = Number(searchParams.get('offset')) || 0;

  if (!['up', 'down', 'all'].includes(type)) {
    return Response.json({ error: 'type harus "up", "down", atau "all"' }, { status: 400 });
  }

  const feedbackFilter = type === 'all' ? sql`m.feedback in ('up', 'down')` : sql`m.feedback = ${type}`;

  const rows = await sql`
    select
      m.id,
      m.content as answer,
      m.feedback,
      m.created_at,
      (
        select content from messages
        where conversation_id = m.conversation_id
          and role = 'user'
          and created_at < m.created_at
        order by created_at desc
        limit 1
      ) as question
    from messages m
    where ${feedbackFilter}
    order by m.created_at desc
    limit ${limit}
    offset ${offset}
  `;

  const [{ count }] = await sql`
    select count(*)::int as count
    from messages m
    where ${feedbackFilter}
  `;

  return Response.json({ items: rows, total: count, limit, offset });
}