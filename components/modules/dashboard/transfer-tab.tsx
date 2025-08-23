// 📄 File: components/modules/dashboard/transfer-tab.tsx (Under Construction)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Construction, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  FileText,
  Wrench,
  Calendar,
  CheckSquare
} from 'lucide-react'

interface TransferTabProps {
  department: 'PHARMACY' | 'OPD'
}

export function TransferTab({ department }: TransferTabProps) {
  const departmentName = department === 'PHARMACY' ? 'แผนกคลังยา' : 'แผนก OPD'


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <Construction className="h-16 w-16 text-amber-500" />
            <div className="absolute -top-2 -right-2 bg-amber-100 rounded-full p-1">
              <Wrench className="h-6 w-6 text-amber-600 animate-bounce" />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            ระบบการเบิกจ่ายยา
          </h2>
          <p className="text-lg text-gray-600 mt-1">
            {departmentName}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-amber-700 font-medium">
              กำลังพัฒนาระบบ - เร็วๆ นี้
            </span>
          </div>
        </div>
      </div>

      {/* Construction Notice */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-full">
              <Construction className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-2">
                ระบบกำลังอยู่ในระหว่างการพัฒนา
              </h3>
              <p className="text-amber-800 mb-4">
                เราเร่งทำงานเพื่อให้คุณได้ใช้ระบบการเบิกจ่ายยาที่ทันสมัยและใช้งานง่าย 
                พร้อมฟีเจอร์ครบครันสำหรับการจัดการสต็อกยาระหว่างแผนก
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">เปิดใช้งาน: ไม่มีกำหนด</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-gray-700">Progress: 10%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            ฟีเจอร์ที่จะมีใน Transfer System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                title: 'สร้างใบเบิกยา',
                description: 'สร้างใบขอเบิกยาระหว่างแผนกด้วย interface ที่ใช้งานง่าย',
                icon: FileText,
                color: 'blue'
              },
              {
                title: 'ระบบอนุมัติ',
                description: 'ระบบอนุมัติแบบ multi-step พร้อมการแจ้งเตือนแบบเรียลไทม์',
                icon: CheckSquare,
                color: 'green'
              },
              {
                title: 'ติดตามสถานะ',
                description: 'ติดตามสถานะใบเบิกจาก Request ถึง Delivered แบบเรียลไทม์',
                icon: Clock,
                color: 'amber'
              },
              {
                title: 'Mobile Friendly',
                description: 'ใช้งานได้บนมือถือ รองรับการทำงานแบบ offline',
                icon: ArrowRight,
                color: 'purple'
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg bg-${feature.color}-100`}>
                  <feature.icon className={`h-5 w-5 text-${feature.color}-600`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}