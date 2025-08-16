// components/forms/sections/PatientInfoSection.tsx
// Single column design without gender selection

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Weight, Calculator, Baby } from 'lucide-react';

import { usePatientForm } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

// Weight estimation based on age (Thai pediatric standards)
const estimateWeight = (ageYears: number, ageMonths: number = 0) => {
  const totalMonths = ageYears * 12 + ageMonths;
  
  if (totalMonths <= 6) return 3 + (totalMonths * 0.7); // 0-6 months
  if (totalMonths <= 12) return 7 + ((totalMonths - 6) * 0.3); // 6-12 months
  if (totalMonths <= 24) return 9 + ((totalMonths - 12) * 0.2); // 1-2 years
  if (ageYears <= 8) return 10 + (ageYears * 2); // 2-8 years
  return 22 + ((ageYears - 8) * 3); // 8+ years
};

export function PatientInfoSection() {
  const { form, setCurrentStep, patientSession } = usePatientForm();
  
  const watchedAgeYears = form.watch('ageYears');
  const watchedAgeMonths = form.watch('ageMonths');
  const watchedWeight = form.watch('weight');

  // Auto-estimate weight when age changes
  const handleAutoEstimate = () => {
    const estimatedWeight = estimateWeight(Number(watchedAgeYears), Number(watchedAgeMonths));
    form.setValue('weight', Math.round(estimatedWeight * 10) / 10); // Round to 1 decimal
  };

  // Quick age buttons
  const quickAgeButtons = [
    { label: '< 1 ปี', years: 0, months: 6 },
    { label: '1-5 ปี', years: 3, months: 0 },
    { label: '6-12 ปี', years: 9, months: 0 },
    { label: '> 12 ปี', years: 15, months: 0 },
  ];

  const handleQuickAge = (years: number, months: number) => {
    form.setValue('ageYears', years);
    form.setValue('ageMonths', months);
    // Auto-estimate weight
    const estimatedWeight = estimateWeight(years, months);
    form.setValue('weight', Math.round(estimatedWeight * 10) / 10);
  };

  const handleNext = () => {
    const values = form.getValues();
    if (values.ageYears >= 0 && values.weight > 0) {
      // If returning to existing patient session, go directly to drug selection
      setCurrentStep(2);
    }
  };

  const isValid = watchedAgeYears >= 0 && watchedWeight > 0;
  const showMonthsInput = Number(watchedAgeYears) < 2;

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            <User className="w-6 h-6 text-blue-600" />
            ข้อมูลผู้ป่วยเด็ก
          </CardTitle>
          {patientSession && (
            <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              💾 มีข้อมูลผู้ป่วยอยู่แล้ว - สามารถเพิ่มยาได้
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Age Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="ageYears" className="text-base font-medium flex items-center gap-2">
                <Baby className="w-4 h-4 text-blue-600" />
                อายุ (ปี)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="ageYears"
                  type="number"
                  min="0"
                  max="18"
                  step="1"
                  placeholder="0"
                  className="text-lg h-12 text-center font-medium"
                  {...form.register('ageYears', { valueAsNumber: true })}
                />
                <span className="flex items-center text-gray-500 font-medium">ปี</span>
              </div>
            </div>

            {/* Months input - show only for children under 2 years */}
            {showMonthsInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Label htmlFor="ageMonths" className="text-base font-medium flex items-center gap-2">
                  <Baby className="w-4 h-4 text-orange-600" />
                  อายุ (เดือน)
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="ageMonths"
                    type="number"
                    min="0"
                    max="24"
                    step="1"
                    placeholder="0"
                    className="text-lg h-12 text-center font-medium"
                    {...form.register('ageMonths', { valueAsNumber: true })}
                  />
                  <span className="flex items-center text-gray-500 font-medium">เดือน</span>
                </div>
              </motion.div>
            )}

            {/* Quick Age Buttons */}
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">เลือกช่วงอายุ (คร่าวๆ)</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickAgeButtons.map((btn) => (
                  <Button
                    key={btn.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAge(btn.years, btn.months)}
                    className="h-10 text-sm hover:bg-blue-50 hover:border-blue-300"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Weight Input Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="weight" className="text-base font-medium flex items-center gap-2">
                <Weight className="w-4 h-4 text-green-600" />
                น้ำหนัก (กิโลกรัม)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0.0"
                  className="text-lg h-12 text-center font-medium"
                  {...form.register('weight', { valueAsNumber: true })}
                />
                <span className="flex items-center text-gray-500 font-medium">กก.</span>
              </div>
            </div>

            {/* Auto-estimate button */}
            {(watchedAgeYears > 0 || watchedAgeMonths > 0) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAutoEstimate}
                className="w-full h-10 text-sm bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <Calculator className="w-4 h-4 mr-2" />
                ประมาณน้ำหนักจากอายุ
                {watchedAgeYears > 0 && (
                  <span className="ml-2 text-xs">
                    (~{Math.round(estimateWeight(Number(watchedAgeYears), Number(watchedAgeMonths)) * 10) / 10} กก.)
                  </span>
                )}
              </Button>
            )}
          </div>

          {/* Current Values Display */}
          {(watchedAgeYears > 0 || watchedWeight > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">ข้อมูลปัจจุบัน</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>👶 อายุ: {watchedAgeYears} ปี {showMonthsInput && watchedAgeMonths > 0 ? `${watchedAgeMonths} เดือน` : ''}</div>
                <div>⚖️ น้ำหนัก: {watchedWeight} กิโลกรัม</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNext}
              disabled={!isValid}
              className="px-8 h-12 text-lg font-medium"
            >
              ถัดไป: เลือกยา
              <User className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}