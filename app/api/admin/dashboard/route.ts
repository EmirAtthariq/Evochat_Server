import sql from '@/lib/db';

export async function GET() {
  const [
    documentsTotal,
    documentsByStatus,
    conversationsTotal,
    conversationsThisWeek,
    feedbackDown,
    feedbackUp,
    usersTotal,
    domisiliTotal,
    helpdeskContactsTotal,
  ] = await Promise.all([
    sql`select count(*)::int as count from documents`,
    sql`select status, count(*)::int as count from documents group by status`,
    sql`select count(*)::int as count from conversations`,
    sql`select count(*)::int as count from conversations where created_at >= now() - interval '7 days'`,
    sql`select count(*)::int as count from messages where feedback = 'down'`,
    sql`select count(*)::int as count from messages where feedback = 'up'`,
    sql`select count(*)::int as count from auth.users`,
    sql`select count(*)::int as count from domisili`,
    sql`select count(*)::int as count from helpdesk_contacts`,
  ]);

  const statusMap: Record<string, number> = { ready: 0, processing: 0, failed: 0 };
  for (const row of documentsByStatus) {
    statusMap[row.status] = row.count;
  }

  return Response.json({
    documents: {
      total: documentsTotal[0].count,
      ready: statusMap.ready,
      processing: statusMap.processing,
      failed: statusMap.failed,
    },
    conversations: {
      total: conversationsTotal[0].count,
      thisWeek: conversationsThisWeek[0].count,
    },
    feedback: {
      up: feedbackUp[0].count,
      down: feedbackDown[0].count,
    },
    users: usersTotal[0].count,
    domisili: domisiliTotal[0].count,
    helpdeskContacts: helpdeskContactsTotal[0].count,
  });
}