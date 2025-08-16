// app/api/auth/login/route.ts - Updated to use Jose
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  comparePassword, 
  createToken, 
  userToPayload,
  AuthError 
} from '@/lib/auth';

const prisma = new PrismaClient();

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔍 [DEBUG] Login request:', {
      username: body.username,
      hasPassword: !!body.password
    });
    
    // Validate input
    const { username, password } = loginSchema.parse(body);
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    console.log('🔍 [DEBUG] Found user:', user ? {
      id: user.id,
      username: user.username,
      status: user.status,
      hasPassword: !!user.password
    } : 'not found');
    
    if (!user) {
      return NextResponse.json(
        { error: AuthError.INVALID_CREDENTIALS }, 
        { status: 401 }
      );
    }
    
    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: AuthError.INVALID_CREDENTIALS }, 
        { status: 401 }
      );
    }
    
    // Check user status
    if (user.status !== 'APPROVED') {
      let errorMessage: string;
      
      if (user.status === 'SUSPENDED') {
        errorMessage = AuthError.USER_SUSPENDED;
      } else if (user.status === 'INACTIVE') {
        errorMessage = AuthError.USER_INACTIVE;
      } else {
        errorMessage = AuthError.USER_NOT_APPROVED;
      }
      
      return NextResponse.json(
        { error: errorMessage }, 
        { status: 403 }
      );
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    
    // ⭐ Create token with Jose (async)
    const userPayload = userToPayload(user);
    const token = await createToken(userPayload);
    
    console.log('🔍 [DEBUG] JWT Token created:', token.substring(0, 50) + '...');
    
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        fullName: `${user.firstName} ${user.lastName}`
      },
      token,
    });
    
    // ⭐ Set cookie with NextResponse.cookies (recommended approach)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    });
    
    console.log('🔍 [DEBUG] Login successful for user:', user.id);
    console.log('🔍 [DEBUG] Cookie set successfully');
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}