// app/api/health/route.ts
import sql from '@/lib/db';

export async function GET() {
  const result = await sql`select now()`;
  return Response.json({ ok: true, time: result[0].now });
}