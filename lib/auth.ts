// lib/auth.ts - แก้ไขใช้ Jose แทน jsonwebtoken
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { User, UserStatus } from '@prisma/client';

// ⭐ ใช้ TextEncoder สำหรับ Web Crypto API
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
);

const JWT_EXPIRES_IN = '7d';

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

// Hash password (ยังคงใช้ bcrypt ได้ใน API routes)
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
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