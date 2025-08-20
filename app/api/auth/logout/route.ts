// 📄 File: app/api/auth/logout/route.ts (Fixed ESLint warnings)
import { NextResponse } from 'next/server'; // ✅ ลบ NextRequest ที่ไม่ได้ใช้
import { serialize } from 'cookie';

export async function POST() { // ✅ ลบ req parameter ที่ไม่ได้ใช้
  try {
    // สร้าง cookie ที่หมดอายุเพื่อลบ token
    const expiredCookie = serialize('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // หมดอายุทันที
      path: '/'
    });
    
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    response.headers.set('Set-Cookie', expiredCookie);
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET method สำหรับ logout ผ่าน URL (optional)
export async function GET() { // ✅ ลบ req parameter
  return POST(); // ✅ ไม่ต้องส่ง req parameter
}