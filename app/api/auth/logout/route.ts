// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST(req: NextRequest) {
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
export async function GET(req: NextRequest) {
  return POST(req);
}