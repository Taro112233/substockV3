// 📄 File: app/api/auth/me/route.ts (Fixed ESLint warnings)
import { NextResponse } from 'next/server'; // ✅ ลบ NextRequest ที่ไม่ได้ใช้
import { getServerUser } from '@/lib/auth-server';

export async function GET() { // ✅ ลบ req parameter ที่ไม่ได้ใช้
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        fullName: `${user.firstName} ${user.lastName}`
      }
    });
    
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}