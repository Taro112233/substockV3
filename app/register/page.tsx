'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/utils/auth-client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Hospital, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  UserPlus,
  FileText,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { TermsOfServiceModal } from '@/components/modules/auth/terms-of-service-modal';
import { Separator } from '@/components/ui/separator';

type RegisterFormData = {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  position: string;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    position: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    show: boolean;
    requiresApproval: boolean;
    message: string;
  }>({ show: false, requiresApproval: false, message: '' });
  
  // ⭐ States สำหรับ Terms of Service
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const { register, loading } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      const errorMsg = 'Username ต้องมีอย่างน้อย 3 ตัวอักษร';
      setError(errorMsg);
      toast.error('ข้อมูลไม่ถูกต้อง', {
        description: errorMsg,
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 4000,
      });
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      const errorMsg = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      setError(errorMsg);
      toast.error('รหัสผ่านไม่ถูกต้อง', {
        description: errorMsg,
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 4000,
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'รหัสผ่านไม่ตรงกัน';
      setError(errorMsg);
      toast.error('รหัสผ่านไม่ตรงกัน', {
        description: 'กรุณาตรวจสอบรหัสผ่านและการยืนยันรหัสผ่าน',
        icon: <XCircle className="w-4 h-4" />,
        duration: 4000,
      });
      return false;
    }

    if (!formData.firstName || !formData.lastName) {
      const errorMsg = 'กรุณากรอกชื่อ-นามสกุล';
      setError(errorMsg);
      toast.error('ข้อมูลไม่ครบถ้วน', {
        description: errorMsg,
        icon: <AlertTriangle className="w-4 h-4" />,
        duration: 4000,
      });
      return false;
    }

    // ⭐ ตรวจสอบการยอมรับเงื่อนไข
    if (!acceptedTerms) {
      const errorMsg = 'กรุณายอมรับเงื่อนไขการใช้งาน';
      setError(errorMsg);
      toast.error('ยังไม่ได้ยอมรับเงื่อนไข', {
        description: 'กรุณาอ่านและยอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก',
        icon: <Shield className="w-4 h-4" />,
        duration: 5000,
        action: {
          label: "อ่านเงื่อนไข",
          onClick: () => {
            setShowTermsModal(true);
          },
        },
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    // Show loading toast
    const loadingToast = toast.loading('กำลังสร้างบัญชีผู้ใช้', {
      description: 'กรุณารอสักครู่...',
    });

    try {
      const result = await register({
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position || undefined,
      });
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        // ⭐ ทุกกรณีจะเป็น UNAPPROVED และต้องรออนุมัติ
        setSuccess({
          show: true,
          requiresApproval: true,
          message: 'สมัครสมาชิกสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบ'
        });
        
        toast.success('สมัครสมาชิกสำเร็จ!', {
          description: 'บัญชีของคุณได้รับการสร้างแล้ว กรุณารอการอนุมัติจากผู้ดูแลระบบ',
          icon: <UserPlus className="w-4 h-4" />,
          duration: 5000,
        });
        
        // ⭐ Auto redirect ไป /login หลัง 3 วินาทีเสมอ
        setTimeout(() => {
          router.push('/login');
        }, 30000);
      } else {
        const errorMsg = result.error || 'สมัครสมาชิกไม่สำเร็จ';
        setError(errorMsg);
        
        // Show specific error messages
        if (errorMsg.includes('username')) {
          toast.error('Username นี้มีคนใช้แล้ว', {
            description: 'กรุณาเลือก Username อื่น',
            icon: <XCircle className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "แก้ไข",
              onClick: () => {
                setError('');
                document.getElementById('username')?.focus();
              },
            },
          });
        } else {
          toast.error('สมัครสมาชิกไม่สำเร็จ', {
            description: errorMsg,
            icon: <XCircle className="w-4 h-4" />,
            duration: 5000,
            action: {
              label: "ลองอีกครั้ง",
              onClick: () => {
                setError('');
              },
            },
          });
        }
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      console.error('Registration error:', error);
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
    
    if (error) setError('');
  };

  const handleLoginClick = () => {
    toast.info('กำลังไปหน้าเข้าสู่ระบบ', {
      description: 'จะนำไปยังหน้าเข้าสู่ระบบในอีกสักครู่',
      duration: 2000,
    });
    router.push('/login');
  };

  // ⭐ Handle Terms of Service
  const handleTermsAccept = () => {
    setAcceptedTerms(true);
    setShowTermsModal(false);
    
    toast.success('ยอมรับเงื่อนไขแล้ว', {
      description: 'คุณได้ยอมรับเงื่อนไขการใช้งานเรียบร้อยแล้ว',
      icon: <CheckCircle2 className="w-4 h-4" />,
      duration: 3000,
    });
  };

  const handleTermsDecline = () => {
    setAcceptedTerms(false);
    setShowTermsModal(false);
    
    toast.warning('ยกเลิกการยอมรับ', {
      description: 'คุณต้องยอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก',
      icon: <AlertTriangle className="w-4 h-4" />,
      duration: 4000,
    });
  };

  const handleShowTerms = () => {
    setShowTermsModal(true);
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

  // Success screen
  if (success.show) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">รอการอนุมัติ</h3>
            
            <p className="text-gray-600 mb-4">{success.message}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                บัญชีของคุณได้รับการสร้างเรียบร้อยแล้ว
              </p>
              <p className="text-sm text-blue-600 mt-1">
                ติดต่อผู้ดูแลระบบเพื่อขออนุมัติการใช้งาน
              </p>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </p>
            
            <Button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              ไปหน้าเข้าสู่ระบบ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-lg">
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
        </div>

        {/* Register Form */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">สมัครสมาชิก</CardTitle>
            <CardDescription className="text-center">
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username (อย่างน้อย 3 ตัวอักษร)"
                  disabled={isLoading}
                  className="h-11"
                  autoComplete="username"
                  required
                />
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">ชื่อ *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="ชื่อ"
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">นามสกุล *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="นามสกุล"
                    disabled={isLoading}
                    className="h-11"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              {/* Position (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="position">ตำแหน่งงาน</Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="เช่น เภสัชกร, พยาบาล, แพทย์ (ไม่บังคับ)"
                  disabled={isLoading}
                  className="h-11"
                  autoComplete="organization-title"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    disabled={isLoading}
                    className="h-11 pr-10"
                    autoComplete="new-password"
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="ยืนยันรหัสผ่าน"
                    disabled={isLoading}
                    className="h-11 pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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

              {/* ⭐ Terms of Service Section */}
              <div className="space-y-4 pt-2">
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="terms"
                      checked={acceptedTerms}
                      onCheckedChange={(checked) => {
                        setAcceptedTerms(checked as boolean);
                        if (error && checked) {
                          setError('');
                        }
                      }}
                      disabled={isLoading}
                      className="h-4 w-4"
                    />
                    <Label 
                      htmlFor="terms" 
                      className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                    >
                      ข้าพเจ้าได้อ่านและยอมรับ{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium underline"
                        onClick={handleShowTerms}
                        disabled={isLoading}
                      >
                        เงื่อนไขการใช้งาน
                      </Button>
                      {' '}แล้ว *
                    </Label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className={`w-full h-11 text-base transition-colors duration-200 ${
                  acceptedTerms 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
                disabled={isLoading || !acceptedTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้างบัญชี...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    สมัครสมาชิก
                  </>
                )}
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                มีบัญชีอยู่แล้ว?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={handleLoginClick}
                  disabled={isLoading}
                >
                  เข้าสู่ระบบ
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

        {/* ⭐ Terms of Service Modal */}
        <TermsOfServiceModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
        />
      </div>
    </div>
  );
}