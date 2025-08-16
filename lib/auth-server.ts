// lib/auth-server.ts - Server-side auth utilities
import { headers } from 'next/headers';
import { JWTUser } from './auth';

// ดึงข้อมูล user จาก middleware headers
export async function getServerUser(): Promise<JWTUser | null> {
  try {
    const headersList = await headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return null;
    }

    return JSON.parse(userData) as JWTUser;
  } catch {
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