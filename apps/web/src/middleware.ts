import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/dashboard', '/pos', '/orders', '/checkout'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = path === '/login' || path === '/register';

  if (!isProtected && !isAuthPage) return res;

  // Demo session cookie — bypass Supabase entirely
  const demoCookie = req.cookies.get('fs_demo')?.value;
  if (demoCookie) {
    if (isAuthPage) return NextResponse.redirect(new URL('/dashboard', req.url));
    return res;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase configured — allow through (dev/demo mode)
  if (!supabaseUrl || !supabaseKey) return res;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createMiddlewareClient({ req: req as any, res: res as any });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session && isProtected) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (session && isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } catch {
    return res;
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
