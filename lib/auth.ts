// lib/auth.ts - Updated for V3.0 Schema
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
// ⭐ Import from generated Prisma client instead of direct import
import type { User, UserStatus } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 วัน

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

// สร้าง JWT Token
export function createToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

// ตรวจสอบ JWT Token
export function verifyToken(token: string): JWTUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTUser;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // สูงกว่าปกติเพื่อความปลอดภัย
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// สร้าง secure cookie options
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    path: '/'
  };
}

// ⭐ แปลง User model เป็น UserPayload สำหรับ JWT
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

// ตรวจสอบสถานะผู้ใช้
export function isUserActive(user: JWTUser): boolean {
  return user.status === 'APPROVED';
}

// Refresh token logic (optional - สำหรับ extended sessions)
export function shouldRefreshToken(user: JWTUser): boolean {
  if (!user.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  const timeToExpiry = user.exp - now;
  // Refresh ถ้าเหลือเวลาน้อยกว่า 1 วัน
  return timeToExpiry < 24 * 60 * 60;
}

// Error types สำหรับ authentication
export const AuthError = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_NOT_FOUND: 'User not found',
  USER_NOT_APPROVED: 'User account not approved',
  USER_SUSPENDED: 'User account suspended',
  USER_INACTIVE: 'User account inactive',
  INVALID_TOKEN: 'Invalid or expired token'
} as const;

// ⭐ Type guard สำหรับ UserStatus
export function isValidUserStatus(status: string): status is UserStatus {
  return ['UNAPPROVED', 'APPROVED', 'SUSPENDED', 'INACTIVE'].includes(status);
}