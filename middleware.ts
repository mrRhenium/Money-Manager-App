import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.has('authjs.session-token') || request.cookies.has('__Secure-authjs.session-token') || request.cookies.has('next-auth.session-token') || request.cookies.has('__Secure-next-auth.session-token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  
  if (!isAuth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.png|icon.png|icon-192x192.png|icon-512x512.png|manifest.json).*)'],
};
