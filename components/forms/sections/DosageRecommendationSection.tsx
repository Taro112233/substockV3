// components/forms/sections/DosageRecommendationSection.tsx
// New section for guideline-based dosage recommendations

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, Info, Calculator } from 'lucide-react';

import { usePatientForm, type DosingRule } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

export function DosageRecommendationSection() {
  const {
    selectedDrug,
    selectedIndication,
    selectedDosage,
    setSelectedDosage,
    customDosage,
    setCustomDosage,
    setCurrentStep,
    form
  } = usePatientForm();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  // Get patient data for calculations
  const patientData = form.getValues();
  const patientWeight = Number(patientData.weight);
  const patientAge = Number(patientData.ageYears);

  // Find applicable dosing rule for current drug and indication
  const applicableRule = useMemo(() => {
    if (!selectedDrug || !selectedIndication) return null;
    
    return selectedDrug.dosingRules.find(rule => 
      rule.indication === selectedIndication &&
      patientAge >= rule.ageMinYears &&
      patientAge <= rule.ageMaxYears
    );
  }, [selectedDrug, selectedIndication, patientAge]);

  // Calculate dose ranges for display
  const doseCalculations = useMemo(() => {
    if (!applicableRule || !patientWeight) return null;

    const minDose = applicableRule.minDose * patientWeight;
    const maxDose = applicableRule.maxDose * patientWeight;
    const recommendedDose = applicableRule.recommendedDose * patientWeight;

    return {
      minDose,
      maxDose,
      recommendedDose,
      perKgMin: applicableRule.minDose,
      perKgMax: applicableRule.maxDose,
      perKgRecommended: applicableRule.recommendedDose,
      unit: applicableRule.unit
    };
  }, [applicableRule, patientWeight]);

  // Dosage options with safety levels
  const dosageOptions = useMemo(() => {
    if (!doseCalculations) return [];

    return [
      {
        id: 'recommended',
        label: 'แนะนำ (มาตรฐาน)',
        dose: doseCalculations.recommendedDose,
        perKgDose: doseCalculations.perKgRecommended,
        level: 'recommended',
        color: 'green',
        icon: CheckCircle,
        description: 'ขนาดที่แนะนำตามแนวทางปฏิบัติ'
      },
      {
        id: 'low',
        label: 'ต่ำสุด (อ่อนโยน)',
        dose: doseCalculations.minDose,
        perKgDose: doseCalculations.perKgMin,
        level: 'low',
        color: 'blue',
        icon: Info,
        description: 'ขนาดต่ำสุดที่มีประสิทธิภาพ'
      },
      {
        id: 'high',
        label: 'สูงสุด (กรณีรุนแรง)',
        dose: doseCalculations.maxDose,
        perKgDose: doseCalculations.perKgMax,
        level: 'high',
        color: 'orange',
        icon: AlertTriangle,
        description: 'ขนาดสูงสุดที่ปลอดภัย - ใช้เมื่อจำเป็น'
      }
    ];
  }, [doseCalculations]);

  const handleDosageSelect = (dosage: number) => {
    setSelectedDosage(dosage);
    setCustomDosage(null);
    setShowCustomInput(false);
  };

  const handleCustomDosage = () => {
    setShowCustomInput(true);
    setSelectedDosage(null);
  };

  const handleCustomInputChange = (value: string) => {
    setCustomInputValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomDosage(numValue);
      setSelectedDosage(null);
    } else {
      setCustomDosage(null);
    }
  };

  const handleNext = () => {
    if (selectedDosage || customDosage) {
      setCurrentStep(4); // Go to concentration selection
    }
  };

  const handleBack = () => {
    setCurrentStep(2);
  };

  const isValid = selectedDosage !== null || customDosage !== null;
  const finalDosage = customDosage || selectedDosage;

  // Safety check for custom dosage
  const customDosageSafety = useMemo(() => {
    if (!customDosage || !doseCalculations) return null;

    if (customDosage < doseCalculations.minDose * 0.5) {
      return { level: 'danger', message: 'ขนาดต่ำเกินไป - อาจไม่มีประสิทธิภาพ' };
    }
    if (customDosage < doseCalculations.minDose) {
      return { level: 'warning', message: 'ขนาดต่ำกว่าที่แนะนำ' };
    }
    if (customDosage > doseCalculations.maxDose * 1.5) {
      return { level: 'danger', message: 'ขนาดสูงเกินไป - อาจไม่ปลอดภัย' };
    }
    if (customDosage > doseCalculations.maxDose) {
      return { level: 'warning', message: 'ขนาดสูงกว่าที่แนะนำ' };
    }
    return { level: 'safe', message: 'ขนาดอยู่ในช่วงที่ปลอดภัย' };
  }, [customDosage, doseCalculations]);

  if (!selectedDrug || !selectedIndication || !applicableRule) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-8">
          <p>ไม่พบข้อมูลขนาดยาสำหรับการเลือกนี้</p>
          <Button onClick={handleBack} className="mt-4">กลับไปเลือกใหม่</Button>
        </CardContent>
      </Card>
    );
  }

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
            <Calculator className="w-6 h-6 text-blue-600" />
            ขนาดยาที่แนะนำ
          </CardTitle>
          <div className="text-sm text-gray-600">
            {selectedDrug.genericName} สำหรับ {selectedIndication}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Patient Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2">ข้อมูลผู้ป่วย</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>👶 อายุ: {patientAge} ปี</div>
              <div>⚖️ น้ำหนัก: {patientWeight} กก.</div>
            </div>
          </div>

          {/* Guideline Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              แนวทางปฏิบัติ
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>📋 {selectedDrug.genericName} สำหรับ {selectedIndication}</div>
              <div>📏 ช่วงขนาด: {applicableRule.minDose}-{applicableRule.maxDose} {applicableRule.unit}</div>
              <div>⭐ แนะนำ: {applicableRule.recommendedDose} {applicableRule.unit}</div>
              <div>🎯 อายุ: {applicableRule.ageMinYears}-{applicableRule.ageMaxYears} ปี</div>
            </div>
          </div>

          {/* Dosage Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">เลือกขนาดยา:</h4>
            
            {dosageOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedDosage === option.dose;
              
              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleDosageSelect(option.dose)}
                    className={`w-full h-auto p-4 justify-start text-left ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className={`w-5 h-5 mt-0.5 text-${option.color}-600`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{option.label}</span>
                          <Badge variant="outline" className={`text-${option.color}-700 border-${option.color}-300`}>
                            {option.perKgDose} mg/kg
                          </Badge>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {option.dose.toFixed(1)} mg ต่อครั้ง
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}

            {/* Custom Dosage Option */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                variant={showCustomInput ? "default" : "outline"}
                onClick={handleCustomDosage}
                className="w-full h-auto p-4 justify-start text-left"
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">กำหนดขนาดเอง</span>
                </div>
              </Button>
            </motion.div>

            {/* Custom Input */}
            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <label className="block text-sm font-medium text-purple-800 mb-2">
                  ระบุขนาดยา (mg ต่อครั้ง):
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 150.0"
                    value={customInputValue}
                    onChange={(e) => handleCustomInputChange(e.target.value)}
                    className="text-lg h-12"
                  />
                  <span className="flex items-center text-purple-700 font-medium px-3">mg</span>
                </div>
                
                {customDosage && (
                  <div className="mt-2 text-sm">
                    <div className="text-purple-700">
                      = {(customDosage / patientWeight).toFixed(2)} mg/kg/dose
                    </div>
                    {customDosageSafety && (
                      <div className={`mt-1 flex items-center gap-1 ${
                        customDosageSafety.level === 'danger' ? 'text-red-600' :
                        customDosageSafety.level === 'warning' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {customDosageSafety.level === 'danger' && <AlertTriangle className="w-4 h-4" />}
                        {customDosageSafety.level === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {customDosageSafety.level === 'safe' && <CheckCircle className="w-4 h-4" />}
                        {customDosageSafety.message}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Final Selection Summary */}
          {finalDosage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ขนาดยาที่เลือก
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <div><span className="font-medium">ขนาด:</span> {finalDosage.toFixed(1)} mg ต่อครั้ง</div>
                <div><span className="font-medium">คิดเป็น:</span> {(finalDosage / patientWeight).toFixed(2)} mg/kg/dose</div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="px-6 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับ
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isValid}
              className="px-8 h-11 text-lg font-medium"
            >
              ถัดไป: ความเข้มข้น
              <Calculator className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}