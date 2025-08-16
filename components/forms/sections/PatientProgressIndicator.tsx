// components/forms/sections/PatientProgressIndicator.tsx
// Enhanced progress indicator for 7-step flow

import React from 'react';
import { motion } from 'framer-motion';
import { User, Pill, Target, Beaker, Clock, CheckCircle, Calculator } from 'lucide-react';

import { usePatientForm } from '@/components/forms/PatientInputForm';

const steps = [
  {
    number: 1,
    title: 'ข้อมูลผู้ป่วย',
    icon: User,
    description: 'อายุ น้ำหนัก'
  },
  {
    number: 2,
    title: 'เลือกยา',
    icon: Pill,
    description: 'ยาและโรค'
  },
  {
    number: 3,
    title: 'ขนาดยา',
    icon: Target,
    description: 'แนวทางแนะนำ'
  },
  {
    number: 4,
    title: 'ความเข้มข้น',
    icon: Beaker,
    description: 'เลือกรูปแบบ'
  },
  {
    number: 5,
    title: 'ความถี่',
    icon: Clock,
    description: 'ช่วงเวลา'
  },
  {
    number: 6,
    title: 'ตรวจสอบ',
    icon: CheckCircle,
    description: 'ทบทวนข้อมูล'
  },
  {
    number: 7,
    title: 'ผลลัพธ์',
    icon: Calculator,
    description: 'ขนาดยาแนะนำ'
  }
];

export function PatientProgressIndicator() {
  const { currentStep } = usePatientForm();

  return (
    <div className="mb-8">
      {/* Mobile Progress Bar */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            ขั้นตอน {currentStep} จาก {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-800">
            {steps[currentStep - 1]?.title}
          </span>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <div key={step.number} className="flex flex-col items-center relative flex-1">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 z-0">
                    <motion.div
                      className="h-full bg-blue-600 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ 
                        scaleX: isCompleted ? 1 : 0 
                      }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  </div>
                )}

                {/* Step Circle */}
                <motion.div
                  className={`relative z-10 w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 ${
                    isCompleted
                      ? 'bg-green-500 border-green-500 text-white'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isActive ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: isActive ? 2 : 0.2,
                    repeat: isActive ? Infinity : 0,
                    repeatType: "reverse",
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>

                {/* Step Info */}
                <div className="text-center">
                  <div
                    className={`text-xs font-medium mb-1 ${
                      isActive || isCompleted
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div
                    className={`text-xs ${
                      isActive || isCompleted
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Navigation Hints */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500">
          {currentStep > 1 && (
            <span>← ย้อนกลับได้</span>
          )}
          {currentStep < steps.length && (
            <span>กรอกข้อมูลเพื่อดำเนินการต่อ →</span>
          )}
        </div>
      </div>
    </div>
  );
}