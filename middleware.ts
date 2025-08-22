// 📄 File: middleware.ts
// ✅ Updated to exclude /api/transactions/* from authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, isUserActive } from './lib/auth';

// Routes ที่ไม่ต้อง authenticate
const publicRoutes = ['/login', '/register', '/'];
const publicApiRoutes = [
  '/api/auth/login', 
  '/api/auth/register', 
  '/api/health',
  '/api/transactions/pharmacy',  // ✅ เพิ่ม transaction APIs
  '/api/transactions/opd'        // ✅ เพิ่ม transaction APIs
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`🔍 Middleware: ${pathname}`);

  // ✅ ข้าม static files, public routes และ transaction APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    publicRoutes.includes(pathname) ||
    publicApiRoutes.some(route => pathname.startsWith(route)) || // ✅ ใช้ startsWith เพื่อครอบคลุม sub-paths
    pathname.startsWith('/api/transactions') // ✅ exclude ทั้ง /api/transactions/* 
  ) {
    console.log(`✅ Public route, bypassing auth: ${pathname}`);
    return NextResponse.next();
  }

  // ดึง token จาก cookie
  const token = request.cookies.get('auth-token')?.value;

  console.log(`🍪 Token exists: ${!!token}`);
  if (token) {
    console.log(`🍪 Token preview: ${token.substring(0, 20)}...`);
  }

  // ไม่มี token -> redirect ไป login
  if (!token) {
    console.log(`❌ No token, redirecting to login`);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ตรวจสอบ token
  try {
    const user = await verifyToken(token);

    if (!user || !isUserActive(user)) {
      console.log(`❌ Invalid token or inactive user`);

      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));

      response.cookies.delete('auth-token');
      return response;
    }

    console.log(`✅ User authenticated: ${user.username}`);
    console.log(`📤 Middleware passed successfully`);
    return NextResponse.next();

  } catch (error) {
    console.error('❌ Token verification failed:', error);

    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));

    response.cookies.delete('auth-token');
    return response;
  }
}

// ✅ Updated config matcher: ไม่ต้อง exclude ใน matcher เพราะเรา handle ใน logic แล้ว
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)',
  ],
};