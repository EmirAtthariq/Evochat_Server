import sql from '@/lib/db';

export async function GET() {
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
    where m.feedback = 'down'
    order by m.created_at desc
    limit 100
  `;
  return Response.json(rows);
}