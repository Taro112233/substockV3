// middleware.ts (Root level - Next.js middleware)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, isUserActive, JWTUser } from './lib/auth';

// Routes ที่ไม่ต้อง authenticate
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

// API routes ที่ไม่ต้อง authenticate
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // ข้าม static files และ API routes ที่ public
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname) ||
    publicApiRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // ดึง token จาก cookie
  const token = request.cookies.get('auth-token')?.value;

  // ไม่มี token -> redirect ไป login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ตรวจสอบ token
  const user = verifyToken(token);
  if (!user || !isUserActive(user)) {
    // Token ไม่ถูกต้องหรือ user ไม่ active
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    
    // ลบ cookie ที่ไม่ถูกต้อง
    response.cookies.delete('auth-token');
    return response;
  }

  // เพิ่ม user info ใน headers สำหรับ API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-username', user.username);
  requestHeaders.set('x-user-data', JSON.stringify(user));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)',
  ],
};