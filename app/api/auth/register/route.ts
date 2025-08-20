// 📄 File: app/api/auth/register/route.ts (Fixed TypeScript errors)
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  hashPassword, 
  createToken, 
  userToPayload,
} from '@/lib/auth';

const prisma = new PrismaClient();

// ✅ Fixed: Type-safe error details interface
interface ZodErrorDetail {
  field: string;
  message: string;
}

// Validation schema
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  position: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // ตรวจสอบว่า username ซ้ำหรือไม่
    const existingUser = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' }, 
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // สร้าง user ใหม่
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        position: validatedData.position,
        status: 'UNAPPROVED',
        isActive: true,
      },
    });
    
    // ตรวจสอบว่าควร auto-approve หรือไม่
    const userCount = await prisma.user.count();
    const shouldAutoApprove = process.env.NODE_ENV === 'development' || userCount === 1;
    
    if (shouldAutoApprove) {
      const approvedUser = await prisma.user.update({
        where: { id: user.id },
        data: { status: 'APPROVED' },
      });
      
      // ⭐ สร้าง token และ login ทันที (async)
      const userPayload = userToPayload(approvedUser);
      const token = await createToken(userPayload);
      
      const response = NextResponse.json({
        success: true,
        message: 'Registration successful',
        user: {
          id: approvedUser.id,
          username: approvedUser.username,
          firstName: approvedUser.firstName,
          lastName: approvedUser.lastName,
          position: approvedUser.position,
          status: approvedUser.status,
          fullName: `${approvedUser.firstName} ${approvedUser.lastName}`
        },
        token,
        autoApproved: true,
      });
      
      // Set cookie
      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
      
      return response;
    }
    
    // ต้องรออนุมัติ
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please wait for admin approval.',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        status: user.status,
        fullName: `${user.firstName} ${user.lastName}`
      },
      requiresApproval: true,
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: error.issues.map((e): ZodErrorDetail => ({ // ✅ Fixed: Type-safe mapping
            field: e.path.join('.'),
            message: e.message
          }))
        }, 
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