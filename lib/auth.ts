// lib/auth.ts - แก้ไขใช้ Jose แทน jsonwebtoken (Extended + Aliases)
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { User, UserStatus } from '@prisma/client';

// ⭐ ใช้ TextEncoder สำหรับ Web Crypto API
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

const JWT_EXPIRES_IN = '7d';

// ===== EXISTING INTERFACES (คงไว้) =====
export interface UserPayload {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  position?: string;
  status: UserStatus;
}

export interface JWTUser extends UserPayload {
  iat?: number;
  exp?: number;
}

// ===== EXISTING FUNCTIONS (คงไว้) =====

// ⭐ สร้าง JWT Token ด้วย Jose
export async function createToken(user: UserPayload): Promise<string> {
  return await new SignJWT({
    userId: user.userId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    position: user.position,
    status: user.status
  })
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(JWT_EXPIRES_IN)
  .setIssuedAt()
  .sign(JWT_SECRET);
}

// ⭐ ตรวจสอบ JWT Token ด้วย Jose (รองรับ Edge Runtime)
export async function verifyToken(token: string): Promise<JWTUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // แปลง payload เป็น JWTUser
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      position: payload.position as string | undefined,
      status: payload.status as UserStatus,
      iat: payload.iat,
      exp: payload.exp
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// ===== ALIAS FUNCTIONS FOR BACKWARD COMPATIBILITY =====

/**
 * Alias สำหรับ verifyToken เพื่อ compatibility กับโค้ดที่ใช้ verifyJWT
 */
export async function verifyJWT(token: string): Promise<JWTUser | null> {
  return verifyToken(token);
}

/**
 * Alias สำหรับ createToken เพื่อ compatibility กับโค้ดที่ใช้ signJWT
 */
export async function signJWT(payload: UserPayload): Promise<string> {
  return createToken(payload);
}

// Hash password (ยังคงใช้ bcrypt ได้ใน API routes)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Alias สำหรับ comparePassword เพื่อ compatibility
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return comparePassword(password, hashedPassword);
}

// ⭐ Cookie options สำหรับ development
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    path: '/',
  };
}

export function userToPayload(user: User): UserPayload {
  return {
    userId: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    position: user.position || undefined,
    status: user.status
  };
}

export function isUserActive(user: JWTUser): boolean {
  return user.status === 'APPROVED';
}

export function shouldRefreshToken(user: JWTUser): boolean {
  if (!user.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  const timeToExpiry = user.exp - now;
  return timeToExpiry < 24 * 60 * 60;
}

export const AuthError = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_NOT_FOUND: 'User not found',
  USER_NOT_APPROVED: 'User account not approved',
  USER_SUSPENDED: 'User account suspended',
  USER_INACTIVE: 'User account inactive',
  INVALID_TOKEN: 'Invalid or expired token'
} as const;

export function isValidUserStatus(status: string): status is UserStatus {
  return ['UNAPPROVED', 'APPROVED', 'SUSPENDED', 'INACTIVE'].includes(status);
}

// ===== NEW UTILITY FUNCTIONS =====

/**
 * สร้าง refresh token
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  return await new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

/**
 * ตรวจสอบ refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.type !== 'refresh') {
      return null;
    }
    return { userId: payload.userId as string };
  } catch (error) {
    console.error('Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Extract token จาก Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // รองรับ "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // รองรับ token โดยตรง
  return authHeader;
}

/**
 * ตรวจสอบความแรงของ password
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * สร้าง random password
 */
export function generateRandomPassword(length = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // ให้แน่ใจว่ามีตัวอักษรแต่ละประเภท
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // สร้างส่วนที่เหลือ
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // สับเปลี่ยนตำแหน่ง
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return 0;
    
    return Math.max(0, record.resetTime - Date.now());
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instance
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// ===== DEPARTMENT & ROLE UTILITIES (เพิ่มใหม่) =====

// เพิ่ม type definitions สำหรับ role และ department ถ้าต้องการใช้ในอนาคต
export type UserRole = 'PHARMACIST' | 'NURSE' | 'MANAGER';
export type Department = 'PHARMACY' | 'OPD';

/**
 * ตรวจสอบสิทธิ์การเข้าถึงแผนก (สำหรับใช้ในอนาคต)
 */
export function canAccessDepartment(
  userRole: UserRole, 
  userDepartment: Department, 
  targetDepartment: Department
): boolean {
  // Manager สามารถเข้าถึงทุกแผนกได้
  if (userRole === 'MANAGER') {
    return true;
  }
  
  // ผู้ใช้ทั่วไปเข้าถึงได้เฉพาะแผนกของตนเอง
  return userDepartment === targetDepartment;
}

/**
 * ตรวจสอบสิทธิ์การดำเนินการ (สำหรับใช้ในอนาคต)
 */
export function canPerformAction(
  userRole: UserRole,
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'APPROVE'
): boolean {
  switch (action) {
    case 'CREATE':
    case 'READ':
    case 'UPDATE':
      // ทุกคนสามารถ CRUD ได้
      return true;
      
    case 'DELETE':
      // เฉพาะ Manager ลบได้
      return userRole === 'MANAGER';
      
    case 'APPROVE':
      // เฉพาะ Manager และ Senior Pharmacist อนุมัติได้
      return userRole === 'MANAGER' || userRole === 'PHARMACIST';
      
    default:
      return false;
  }
}