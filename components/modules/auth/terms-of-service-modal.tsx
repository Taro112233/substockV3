// 📄 File: components/modules/auth/terms-of-service-modal.tsx
// ระบบ Modal แสดงเงื่อนไขการใช้งาน Hospital Pharmacy System V3.0
// =====================================================

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Lock,
  Database,
  Users,
  AlertTriangle,
  CheckCircle2,
  Eye,
  UserCheck,
  Clock,
  FileText,
  Hospital,
  Smartphone,
  Package,
  Pill,
  X
} from 'lucide-react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline?: () => void;
}

export function TermsOfServiceModal({
  isOpen,
  onClose,
  onAccept,
  onDecline
}: TermsOfServiceModalProps) {
  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const handleDecline = () => {
    if (onDecline) {
      onDecline();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                เงื่อนไขการใช้งานระบบ
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Hospital Pharmacy Stock Management System V3.0
              </DialogDescription>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit">
            <Clock className="w-3 h-3 mr-1" />
            มีผลตั้งแต่ 24 สิงหาคม 2025
          </Badge>
        </DialogHeader>

        {/* Content - Direct Content */}
        <div className="space-y-6">
            {/* บทนำ */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">ขอบเขตการใช้งาน</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      ระบบนี้ออกแบบมาเฉพาะสำหรับการจัดการสต็อกยาในโรงพยาบาล โดยมุ่งเน้นความปลอดภัย 
                      ความแม่นยำของข้อมูล และการปฏิบัติตามมาตรฐานเภสัชกรรม
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 1. การยอมรับเงื่อนไข */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                1. การยอมรับเงื่อนไข
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  การใช้งานระบบ Hospital Pharmacy Stock Management System V3.0 ถือว่าท่านได้อ่าน
                  ทำความเข้าใจ และยอมรับเงื่อนไขการใช้งานทั้งหมดแล้ว
                </p>
                <p>
                  ระบบนี้เป็นส่วนหนึ่งของระบบสารสนเทศโรงพยาบาล และอยู่ภายใต้นโยบายความปลอดภัย
                  ทางสารสนเทศของโรงพยาบาล
                </p>
              </div>
            </div>

            <Separator />

            {/* 2. การใช้งานที่เหมาะสม */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                2. การใช้งานที่เหมาะสม
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="font-medium text-green-800 mb-2">✅ การใช้งานที่ถูกต้อง</h4>
                  <ul className="space-y-1 text-green-700">
                    <li>• จัดการสต็อกยาภายในแผนกที่ได้รับมอบหมาย</li>
                    <li>• เบิกจ่ายยาระหว่างแผนกตามขั้นตอนที่กำหนด</li>
                    <li>• บันทึกข้อมูลการเคลื่อนไหวยาที่แม่นยำ</li>
                    <li>• ใช้งานเพื่อวัตถุประสงค์ทางการแพทย์เท่านั้น</li>
                    <li>• ปฏิบัติตามมาตรฐานเภสัชกรรม</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800 mb-2">❌ การใช้งานที่ต้องห้าม</h4>
                  <ul className="space-y-1 text-red-700">
                    <li>• แชร์บัญชีผู้ใช้กับบุคคลอื่น</li>
                    <li>• เข้าถึงข้อมูลนอกเหนือสิทธิ์ที่ได้รับ</li>
                    <li>• แก้ไขข้อมูลโดยไม่มีสิทธิ์</li>
                    <li>• ใช้งานเพื่อวัตถุประสงค์ส่วนตัว</li>
                    <li>• เปิดเผยข้อมูลสต็อกยาแก่บุคคลภายนอก</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 3. ความปลอดภัยของข้อมูล */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                3. ความปลอดภัยของข้อมูล
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>การเก็บรักษาข้อมูล:</strong> ข้อมูลทั้งหมดถูกเข้ารหัสและเก็บไว้ในฐานข้อมูลที่ปลอดภัย
                  ระบบบันทึก audit trail ของการดำเนินการทั้งหมด
                </p>
                <p>
                  <strong>การเข้าถึงข้อมูล:</strong> แต่ละแผนกสามารถเข้าถึงได้เฉพาะข้อมูลของแผนกตนเอง
                  ยกเว้นผู้ดูแลระบบที่มีสิทธิ์ดูข้อมูลทุกแผนก
                </p>
                <p>
                  <strong>ความรับผิดชอบของผู้ใช้:</strong> ท่านมีหน้าที่รักษาความลับของรหัสผ่าน
                  และใช้งานระบบตามสิทธิ์ที่ได้รับเท่านั้น
                </p>
              </div>
            </div>

            <Separator />

            {/* 4. การจัดการข้อมูลส่วนบุคคล */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                4. การจัดการข้อมูลส่วนบุคคล
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2">ข้อมูลที่เก็บรวบรวม</h4>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• ชื่อ-นามสกุล และตำแหน่งงาน</li>
                        <li>• Username และรหัสผ่าน (เข้ารหัส)</li>
                        <li>• แผนกและสิทธิ์การใช้งาน</li>
                        <li>• ประวัติการใช้งานระบบ</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2">วัตถุประสงค์การใช้งาน</h4>
                      <ul className="space-y-1 text-xs text-gray-600">
                        <li>• การระบุตัวตนและการยืนยันสิทธิ์</li>
                        <li>• การติดตามการดำเนินการ</li>
                        <li>• การตรวจสอบและการควบคุม</li>
                        <li>• การรายงานและการวิเคราะห์</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>หมายเหตุ:</strong> ข้อมูลส่วนบุคคลจะไม่ถูกเปิดเผยแก่บุคคลภายนอกโรงพยาบาล
                  และจะถูกลบออกเมื่อบัญชีผู้ใช้ถูกยกเลิก
                </p>
              </div>
            </div>

            <Separator />

            {/* 5. ข้อกำหนดทางเทคนิค */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange-600" />
                5. ข้อกำหนดทางเทคนิค
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">การเข้าถึงระบบ</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• รองรับ Mobile และ Desktop</li>
                      <li>• ใช้งานเป็น PWA (Progressive Web App)</li>
                      <li>• รองรับการใช้งานออฟไลน์บางส่วน</li>
                      <li>• ต้องการการเชื่อมต่ออินเทอร์เน็ต</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">ความปลอดภัย</h4>
                    <ul className="space-y-1 text-xs text-gray-600">
                      <li>• การพิสูจน์ตัวตนด้วย JWT Token</li>
                      <li>• การเข้ารหัสข้อมูลด้วย HTTPS</li>
                      <li>• Session timeout อัตโนมัติ</li>
                      <li>• การบันทึก audit log ครบถ้วน</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 6. ความรับผิดชอบของผู้ใช้ */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                6. ความรับผิดชอบของผู้ใช้
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    การใช้งานที่ถูกต้องและปลอดภัย
                  </h4>
                  <ul className="space-y-1 text-amber-700 text-xs">
                    <li>• ผู้ใช้ต้องรับผิดชอบในการรักษาความลับของรหัสผ่าน</li>
                    <li>• ไม่แชร์บัญชีผู้ใช้หรือข้อมูลการเข้าถึงกับผู้อื่น</li>
                    <li>• บันทึกข้อมูลการเคลื่อนไหวยาให้ถูกต้องและครบถ้วน</li>
                    <li>• ปฏิบัติตามกระบวนการเบิกจ่ายยาที่กำหนด</li>
                    <li>• รายงานการใช้งานที่ผิดปกติหรือน่าสงสัย</li>
                    <li>• Logout จากระบบเมื่อใช้งานเสร็จสิ้น</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 7. การแบ่งแผนกและสิทธิ์ */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-600" />
                7. การแบ่งแผนกและสิทธิ์การเข้าถึง
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>ระบบแบ่งผู้ใช้เป็น 2 แผนกหลัก:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        <Package className="w-4 h-4 inline mr-1" />
                        คลังยา (PHARMACY)
                      </h4>
                      <ul className="space-y-1 text-xs text-blue-700">
                        <li>• จัดการสต็อกยาหลักของโรงพยาบาล</li>
                        <li>• อนุมัติและจ่ายยาให้แผนก OPD</li>
                        <li>• ควบคุมระดับสต็อกขั้นต่ำ</li>
                        <li>• Import ข้อมูลยาใหม่</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        <Pill className="w-4 h-4 inline mr-1" />
                        แผนกผู้ป่วยนอก (OPD)
                      </h4>
                      <ul className="space-y-1 text-xs text-green-700">
                        <li>• จัดการสต็อกยาสำหรับผู้ป่วยนอก</li>
                        <li>• ขอเบิกยาจากคลังยาหลัก</li>
                        <li>• ติดตามการใช้ยาและสต็อกคงเหลือ</li>
                        <li>• รายงานความต้องการยา</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <h4 className="font-medium text-purple-800 mb-1">
                    สิทธิ์พิเศษสำหรับผู้ดูแลระบบ (MANAGER)
                  </h4>
                  <p className="text-xs text-purple-700">
                    สามารถเข้าถึงข้อมูลทุกแผนก จัดการผู้ใช้ และดูรายงานภาพรวม
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 8. การบันทึกและตรวจสอบ */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                8. การบันทึกและตรวจสอบ
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  ระบบจะบันทึกการดำเนินการทั้งหมดเพื่อการตรวจสอบและรายงาน
                  รวมถึงการเข้าใช้งาน การแก้ไขข้อมูล และการเบิกจ่ายยา
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-800 mb-2">ข้อมูลที่บันทึก</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li>• เวลาและผู้ดำเนินการในทุก transaction</li>
                    <li>• การเข้าถึงระบบและการ logout</li>
                    <li>• การแก้ไขข้อมูลสต็อกและยา</li>
                    <li>• การเบิกจ่ายและรับยาระหว่างแผนก</li>
                    <li>• การ import ข้อมูลยาใหม่</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 9. ข้อจำกัดความรับผิดชอบ */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                9. ข้อจำกัดความรับผิดชอบ
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium mb-2">คำเตือนสำคัญ</p>
                  <ul className="space-y-1 text-red-700 text-xs">
                    <li>• ระบบนี้เป็นเครื่องมือช่วยในการจัดการสต็อก ไม่ใช่การวินิจฉัยทางการแพทย์</li>
                    <li>• ผู้ใช้ต้องตรวจสอบความถูกต้องของข้อมูลยาก่อนการใช้งานจริง</li>
                    <li>• โรงพยาบาลไม่รับผิดชอบต่อความเสียหายจากการใช้งานที่ผิดวิธี</li>
                    <li>• ในกรณีฉุกเฉิน ให้ปฏิบัติตามขั้นตอนฉุกเฉินของโรงพยาบาล</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* 10. การแก้ไขเงื่อนไข */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                10. การแก้ไขเงื่อนไข
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  โรงพยาบาลสงวนสิทธิ์ในการแก้ไขเงื่อนไขการใช้งานได้ตลอดเวลา
                  โดยจะแจ้งให้ผู้ใช้ทราบล่วงหน้าผ่านระบบ
                </p>
                <p>
                  การใช้งานระบบต่อไปหลังจากการแก้ไขเงื่อนไข ถือว่าท่านยอมรับเงื่อนไขใหม่
                </p>
              </div>
            </div>

            <Separator />

            {/* Contact & Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">ติดต่อและสนับสนุน</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>
                  <strong>ผู้พัฒนาระบบ:</strong> นสภ.ธนธัช ธำรงโสตถิสกุล - Pharmacy Student & Developer
                </p>
                <p>
                  <strong>เวอร์ชันระบบ:</strong> Hospital Pharmacy Stock Management V3.0
                </p>
                <p>
                  <strong>สำหรับการสนับสนุน:</strong> ติดต่อแผนกเทคโนโลยีสารสนเทศ
                </p>
              </div>
            </div>
          </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 p-6 space-y-4 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 text-center">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              การกดปุ่ม &quot;ยอมรับเงื่อนไข&quot; ถือว่าท่านได้อ่านและเข้าใจเงื่อนไขการใช้งานทั้งหมดแล้ว
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <X className="w-4 h-4 mr-2" />
              ไม่ยอมรับ
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 order-1 sm:order-2"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              ยอมรับเงื่อนไข
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}