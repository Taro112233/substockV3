// app/api/auth/register/route.ts - Fixed for V3.0 Schema
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  hashPassword, 
  createToken, 
  userToPayload, 
  getCookieOptions 
} from '@/lib/auth';
import { serialize } from 'cookie';

const prisma = new PrismaClient();

// Validation schema - Simplified
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  position: z.string().optional(), // Optional position
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // ⭐ ตรวจสอบว่า username ซ้ำหรือไม่ (corrected field)
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
    
    // ⭐ สร้าง user ใหม่ (using correct field names)
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        position: validatedData.position,
        status: 'UNAPPROVED', // ต้องรออนุมัติ
        isActive: true,
      },
    });
    
    // ใน development mode หรือถ้าเป็นผู้ใช้คนแรก สามารถ auto-approve ได้
    const userCount = await prisma.user.count();
    const shouldAutoApprove = process.env.NODE_ENV === 'development' || userCount === 1;
    
    if (shouldAutoApprove) {
      const approvedUser = await prisma.user.update({
        where: { id: user.id },
        data: { status: 'APPROVED' },
      });
      
      // สร้าง token และ login ทันที
      const userPayload = userToPayload(approvedUser);
      const token = createToken(userPayload);
      const cookieOptions = getCookieOptions();
      const cookie = serialize('auth-token', token, cookieOptions);
      
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
      
      response.headers.set('Set-Cookie', cookie);
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
          details: error.issues.map((e: any) => ({
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