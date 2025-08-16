// app/api/auth/login/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { z } from 'zod';
import { 
  comparePassword, 
  createToken, 
  userToPayload, 
  getCookieOptions,
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
    
    // Validate input
    const { username, password } = loginSchema.parse(body);
    
    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
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
      let errorMessage = AuthError.USER_NOT_APPROVED;
      if (user.status === 'SUSPENDED') errorMessage = AuthError.USER_SUSPENDED;
      if (user.status === 'INACTIVE') errorMessage = AuthError.USER_INACTIVE;
      
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
    
    // Create token
    const userPayload = userToPayload(user);
    const token = createToken(userPayload);
    
    // Set cookie
    const cookieOptions = getCookieOptions();
    const cookie = serialize('auth-token', token, cookieOptions);
    
    // Return success response
    const response = NextResponse.json({
      success: true,
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
    
    response.headers.set('Set-Cookie', cookie);
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
  }
}