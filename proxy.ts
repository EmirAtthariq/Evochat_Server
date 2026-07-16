import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() memverifikasi JWT dan mengembalikan seluruh claims,
  // termasuk custom claim "user_role" yang ditambahkan lewat Auth Hook
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = !error && !!claims;
  const userRole = claims?.user_role; // 'admin' | 'user' | undefined

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isApiRoute =
      request.nextUrl.pathname.startsWith('/api/documents') ||
      request.nextUrl.pathname.startsWith('/api/admin');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // belum login sama sekali -> tolak
  if (!isAuthenticated && (isAdminRoute || isApiRoute)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // sudah login TAPI bukan admin -> tolak akses /admin dan /api/documents
  if (isAuthenticated && userRole !== 'admin' && (isAdminRoute || isApiRoute)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/unauthorized', request.url));
    // atau redirect ke '/' kalau mau lebih halus, tergantung UX yang kamu mau
  }

  // sudah login sebagai admin tapi masih buka /login -> lempar ke /admin
  if (isAuthenticated && userRole === 'admin' && isLoginPage) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/documents/:path*', '/login', '/api/admin/:path*'],
};