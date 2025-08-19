// hooks/use-auth.ts
'use client';

import { useAuth as useAuthContext } from '@/app/utils/auth-client';

// Re-export the auth hook สำหรับ compatibility
export const useAuth = useAuthContext;

// Export additional auth-related types
export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  position?: string;
  fullName: string;
  department?: 'PHARMACY' | 'OPD'; // Optional เพราะ user สามารถใช้งานได้ทุกแผนก
}

// Helper function to convert User to AuthUser
export function userToAuthUser(user: any): AuthUser {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    position: user.position,
    fullName: user.fullName || `${user.firstName} ${user.lastName}`,
    department: user.department // Optional context
  };
}