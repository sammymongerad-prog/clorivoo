import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting on API routes (simple header pass-through).
  // In production replace with Upstash Redis rate limiting.
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', '100');
    return response;
  }

  const response = await updateSession(request);

  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/unauthorized'];
  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/dashboard') || pathname === '/') {
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_active) {
      return NextResponse.redirect(new URL('/login?error=compte_suspendu', request.url));
    }

    const validRoles = ['admin', 'super_admin', 'employee'];
    if (!profile || !validRoles.includes(profile.role)) {
      console.warn(
        `Unauthorized access attempt by ${session.user.email} with role ${profile?.role}`
      );
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
