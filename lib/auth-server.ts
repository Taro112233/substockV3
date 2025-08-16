// lib/auth-server.ts - แบบง่าย: ดึง user จาก cookie โดยตรง
import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export interface JWTUser {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  position?: string;
  status: string;
}

// ดึงข้อมูล user จาก cookie โดยตรง (ไม่ผ่าน middleware headers)
export async function getServerUser(): Promise<JWTUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify token และดึงข้อมูล user
    const user = await verifyToken(token);
    return user;
  } catch (error) {
    console.error('Error getting server user:', error);
    return null;
  }
}

// ตรวจสอบว่าเป็น authenticated request หรือไม่
export async function requireAuth(): Promise<JWTUser> {
  const user = await getServerUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}