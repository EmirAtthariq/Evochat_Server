import sql from '@/lib/db';

export async function GET() {
  // join auth.users (email, dari Supabase Auth) dengan profiles (nama, domisili)
  const users = await sql`
    select
      u.id,
      u.email,
      u.created_at as registered_at,
      p.nama,
      p.domisili
    from auth.users u
    left join profiles p on p.id = u.id
    order by u.created_at desc
  `;
  return Response.json(users);
}