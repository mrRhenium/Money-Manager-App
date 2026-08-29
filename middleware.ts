import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 hours

export function middleware(request: NextRequest) {
  const isAuth = request.cookies.has('authjs.session-token') || 
                 request.cookies.has('__Secure-authjs.session-token') || 
                 request.cookies.has('next-auth.session-token') || 
                 request.cookies.has('__Secure-next-auth.session-token');
                 
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register') || 
                     request.nextUrl.pathname.startsWith('/forgot-password');
  
  // If user is authenticated, verify their inactivity timestamp
  if (isAuth && !isAuthPage) {
    const lastActiveCookie = request.cookies.get('money_manager_last_active')?.value;
    if (lastActiveCookie) {
      const lastActive = parseInt(lastActiveCookie, 10);
      if (!isNaN(lastActive) && Date.now() - lastActive > INACTIVITY_LIMIT_MS) {
        // Session expired due to inactivity
        const response = NextResponse.redirect(new URL('/login?reason=inactivity', request.url));
        
        // Clear all auth and activity cookies
        ['authjs.session-token', '__Secure-authjs.session-token', 'next-auth.session-token', '__Secure-next-auth.session-token', 'money_manager_last_active'].forEach(cookieName => {
          response.cookies.delete(cookieName);
        });
        
        return response;
      }
    }
  }

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
