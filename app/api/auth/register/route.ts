// 📄 File: app/api/auth/register/route.ts (Always UNAPPROVED - No Auto Login)
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';

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
    
    // ⭐ สร้าง user ใหม่ โดยให้เป็น UNAPPROVED เสมอ (ไม่ auto approve)
    const user = await prisma.user.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        position: validatedData.position,
        status: 'UNAPPROVED', // ⭐ บังคับให้เป็น UNAPPROVED เสมอ
        isActive: true,
      },
    });
    
    console.log('🎯 [REGISTER] New user created:', {
      id: user.id,
      username: user.username,
      status: user.status,
      name: `${user.firstName} ${user.lastName}`
    });
    
    // ⭐ ส่ง response โดยไม่มี token (ไม่ auto login)
    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ',
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        status: user.status,
        fullName: `${user.firstName} ${user.lastName}`
      },
      requiresApproval: true, // ⭐ บอกว่าต้องรออนุมัติเสมอ
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid input data', 
          details: error.issues.map((e): ZodErrorDetail => ({
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