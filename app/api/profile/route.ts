import sql from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
    const user = await getUserFromRequest(req);

    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const [profile] = await sql`
    select nama, domisili from profiles where id = ${user.id}
  `;
    
     return Response.json({
    email: user.email,
    nama: profile?.nama ?? null,
    domisili: profile?.domisili ?? null,
  });
}
