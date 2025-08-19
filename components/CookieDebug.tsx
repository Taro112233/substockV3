// 📄 File: components/CookieDebug.tsx (Fixed)

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CookieInfo {
  name: string;
  value: string;
  exists: boolean;
}

interface AuthStatusData {
  status: number | string;
  success: boolean;
  data?: {
    user?: {
      fullName: string;
      username: string;
    }
  };
  error?: string;
}

export function CookieDebug() {
  const [cookies, setCookies] = useState<CookieInfo[]>([]);
  const [authStatus, setAuthStatus] = useState<AuthStatusData | null>(null);
  
  const checkCookies = () => {
    if (typeof document !== 'undefined') {
      const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          acc[name] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const cookieList: CookieInfo[] = [
        {
          name: 'auth-token',
          value: allCookies['auth-token'] || 'Not found',
          exists: !!allCookies['auth-token']
        }
      ];
      
      setCookies(cookieList);
    }
  };
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      setAuthStatus({
        status: response.status,
        success: response.ok,
        data: data
      });
    } catch (error) {
      setAuthStatus({
        status: 'Error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  const clearCookies = () => {
    if (typeof document !== 'undefined') {
      // ลบ auth-token cookie
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      checkCookies();
    }
  };
  
  useEffect(() => {
    checkCookies();
    checkAuthStatus();
  }, []);
  
  // ⚠️ แสดงเฉพาะใน development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <Card className="mt-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 text-sm">
          🔧 Cookie Debug (Development Only)
        </CardTitle>
        <CardDescription>
          ตรวจสอบสถานะ cookies และ authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cookie Status */}
        <div>
          <h4 className="font-medium mb-2">Cookies:</h4>
          {cookies.map((cookie) => (
            <div key={cookie.name} className="flex items-center gap-2 mb-1">
              <Badge variant={cookie.exists ? 'default' : 'destructive'}>
                {cookie.name}
              </Badge>
              <span className="text-sm font-mono">
                {cookie.exists ? 
                  `${cookie.value.substring(0, 20)}${cookie.value.length > 20 ? '...' : ''}` : 
                  'Not found'
                }
              </span>
            </div>
          ))}
        </div>
        
        {/* Auth Status */}
        <div>
          <h4 className="font-medium mb-2">Auth Status:</h4>
          {authStatus && (
            <div className="text-sm">
              <Badge variant={authStatus.success ? 'default' : 'destructive'}>
                Status: {authStatus.status}
              </Badge>
              {authStatus.data && authStatus.data.user && (
                <div className="mt-2 text-xs text-gray-600">
                  User: {authStatus.data.user.fullName} ({authStatus.data.user.username})
                </div>
              )}
              {authStatus.error && (
                <div className="mt-2 text-xs text-red-600">
                  Error: {authStatus.error}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={checkCookies} size="sm" variant="outline">
            🔄 Refresh Cookies
          </Button>
          <Button onClick={checkAuthStatus} size="sm" variant="outline">
            🔍 Check Auth
          </Button>
          <Button onClick={clearCookies} size="sm" variant="destructive">
            🗑️ Clear Cookies
          </Button>
        </div>
        
        {/* Browser Info */}
        <div className="text-xs text-gray-500 mt-4">
          <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) + '...' : 'N/A'}</div>
          <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          <div>Secure Context: {typeof window !== 'undefined' ? window.isSecureContext.toString() : 'N/A'}</div>
        </div>
      </CardContent>
    </Card>
  );
}