// app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/utils/auth-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Hospital, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      setError('กรุณากรอกUsernameและรหัสผ่าน');
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน', {
        description: 'Username และรหัสผ่านจำเป็นต้องกรอก',
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 4000,
      });
      return;
    }

    setIsLoading(true);
    setError('');

    // Show loading toast
    const loadingToast = toast.loading('กำลังเข้าสู่ระบบ...', {
      description: 'กรุณารอสักครู่',
    });

    try {
      const result = await login(formData.username, formData.password);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ!', {
          description: `ยินดีต้อนรับเข้าสู่ระบบจัดการสต็อกยา`,
          icon: <CheckCircle2 className="w-4 h-4" />,
          duration: 3000,
        });
        // Navigation จะเกิดขึ้นใน AuthProvider
      } else {
        const errorMsg = result.error || 'เข้าสู่ระบบไม่สำเร็จ';
        setError(errorMsg);
        toast.error('เข้าสู่ระบบไม่สำเร็จ', {
          description: errorMsg === 'เข้าสู่ระบบไม่สำเร็จ' 
            ? 'กรุณาตรวจสอบ Username และรหัสผ่าน' 
            : errorMsg,
          icon: <XCircle className="w-4 h-4" />,
          duration: 5000,
          action: {
            label: "ลองอีกครั้ง",
            onClick: () => {
              setError('');
              setFormData({ username: '', password: '' });
            },
          },
        });
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error('Login error:', error);
      const errorMsg = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setError(errorMsg);
      toast.error('ไม่สามารถเชื่อมต่อได้', {
        description: 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและลองใหม่อีกครั้ง',
        icon: <XCircle className="w-4 h-4" />,
        duration: 6000,
        action: {
          label: "ลองอีกครั้ง",
          onClick: () => {
            setError('');
            handleSubmit(e);
          },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // ล้าง error เมื่อ user เริ่มพิมพ์
    if (error) setError('');
  };

  const handleRegisterClick = () => {
    toast.info('กำลังไปหน้าสมัครสมาชิก', {
      description: 'จะนำไปยังหน้าลงทะเบียนในอีกสักครู่',
      duration: 2000,
    });
    router.push('/register');
  };

  // Loading spinner ขณะตรวจสอบ auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Hospital className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">Hospital Pharmacy</h1>
              <p className="text-sm text-gray-600">Stock Management System V3.0</p>
            </div>
          </div>
          <p className="text-gray-600">
            เข้าสู่ระบบจัดการสต็อกยาโรงพยาบาล
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-center">
              กรอก Username และรหัสผ่านเพื่อเข้าสู่ระบบ
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="กรอก Username"
                  disabled={isLoading}
                  className="h-11"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสผ่าน"
                    disabled={isLoading}
                    className="h-11 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 text-base bg-blue-500 hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </Button>
            </form>

            {/* Registration link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                ยังไม่มีบัญชี?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={handleRegisterClick}
                  disabled={isLoading}
                >
                  สมัครสมาชิก
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Hospital Pharmacy Stock Management System</p>
          <p>© 2025 - Developed by Thanatouch</p>
        </div>
      </div>
    </div>
  );
}