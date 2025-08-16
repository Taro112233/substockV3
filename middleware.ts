// middleware.ts - ทางเลือก: ไม่ส่ง user data ใน headers
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, isUserActive } from './lib/auth';

// Routes ที่ไม่ต้อง authenticate
const publicRoutes = ['/login', '/register'];
const publicApiRoutes = ['/api/auth/login', '/api/auth/register', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log(`🔍 Middleware: ${pathname}`);
  
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

  // ตรวจสอบ token ด้วย Jose (async)
  try {
    const user = await verifyToken(token);
    
    if (!user || !isUserActive(user)) {
      console.log(`❌ Invalid token or inactive user`);
      
      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
        : NextResponse.redirect(new URL('/login', request.url));
      
      // ลบ cookie ที่ไม่ถูกต้อง
      response.cookies.delete('auth-token');
      return response;
    }

    console.log(`✅ User authenticated: ${user.username}`);

    // ⭐ ไม่ส่ง user data ใน headers เพื่อหลีกเลี่ยงปัญหา Unicode
    // API routes จะต้องดึงข้อมูล user จาก token ใน cookie เอง
    
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

export const config = {
  matcher: [
    // Match all request paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)',
  ],
};