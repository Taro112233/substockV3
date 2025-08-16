// components/forms/sections/ReviewSection.tsx
// Streamlined review section - focused on key information only

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, Loader2, ArrowLeft, CheckCircle, User, Pill, Beaker, Clock } from 'lucide-react';

import { usePatientForm } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

export function ReviewSection() {
  const { 
    form,
    selectedDrug,
    selectedIndication,
    selectedDosage,
    customDosage,
    selectedConcentration,
    selectedFrequency,
    setCurrentStep,
    setCalculation,
    loading,
    setLoading
  } = usePatientForm();

  // Mock calculation function - replace with actual API call
  const handleCalculate = async () => {
    if (!selectedDrug || !selectedConcentration || !selectedFrequency) {
      return;
    }

    try {
      setLoading(true);
      
      const formData = form.getValues();
      const finalDosage = customDosage || selectedDosage;
      
      // Mock calculation result
      const mockCalculation = {
        patientData: {
          ageYears: Number(formData.ageYears),
          ageMonths: Number(formData.ageMonths) || 0,
          weight: Number(formData.weight),
        },
        drugInfo: {
          drug: selectedDrug,
          indication: selectedIndication,
          dosage: finalDosage,
          concentration: selectedConcentration,
          frequency: selectedFrequency
        },
        calculation: {
          doseInMg: finalDosage,
          volumeInMl: finalDosage / selectedConcentration.mgPerMl,
          frequency: selectedFrequency,
          timesPerDay: getTimesPerDay(selectedFrequency),
          dailyDoseMg: finalDosage * getTimesPerDay(selectedFrequency),
          dailyVolumeMl: (finalDosage / selectedConcentration.mgPerMl) * getTimesPerDay(selectedFrequency)
        },
        warnings: generateWarnings(formData, selectedDrug, finalDosage),
        steps: {
          step1: `ขนาดยาต่อครั้ง: ${finalDosage.toFixed(1)} mg`,
          step2: `แปลงเป็นปริมาตร: ${finalDosage.toFixed(1)} mg ÷ ${selectedConcentration.mgPerMl} mg/mL = ${(finalDosage / selectedConcentration.mgPerMl).toFixed(2)} mL`,
          step3: `ความถี่: ${getFrequencyLabel(selectedFrequency)} (${getTimesPerDay(selectedFrequency)} ครั้ง/วัน)`
        },
        measurementGuidance: generateMeasurementGuidance(finalDosage / selectedConcentration.mgPerMl)
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCalculation(mockCalculation);
      setCurrentStep(7); // Show results
    } catch (error) {
      console.error('Calculation failed:', error);
      // TODO: Show error toast/alert
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(5);
  };

  // Helper functions
  const getTimesPerDay = (frequency: string): number => {
    const freqMap: Record<string, number> = {
      'q4h': 6,
      'q6h': 4,
      'q8h': 3,
      'q12h': 2,
      'daily': 1,
      'prn': 0
    };
    return freqMap[frequency] || 0;
  };

  const getFrequencyLabel = (frequency: string): string => {
    const labelMap: Record<string, string> = {
      'q4h': 'ทุก 4 ชั่วโมง',
      'q6h': 'ทุก 6 ชั่วโมง',
      'q8h': 'ทุก 8 ชั่วโมง',
      'q12h': 'ทุก 12 ชั่วโมง',
      'daily': 'วันละครั้ง',
      'prn': 'เมื่อจำเป็น'
    };
    return labelMap[frequency] || frequency;
  };

  const generateWarnings = (patientData: any, drug: any, dosage: number): string[] => {
    const warnings: string[] = [];
    const age = Number(patientData.ageYears);
    
    if (age < 1 && drug.id === 'ibuprofen') {
      warnings.push('Ibuprofen ไม่แนะนำให้ใช้ในเด็กอายุต่ำกว่า 6 เดือน');
    }
    
    if (dosage > 500 && drug.id === 'paracetamol') {
      warnings.push('ขนาดยา Paracetamol สูง - ติดตามอาการข้างเคียง');
    }
    
    return warnings;
  };

  const generateMeasurementGuidance = (volumeMl: number): string => {
    if (volumeMl < 1) {
      return 'ใช้หลอดฉีดยาขนาดเล็ก (1 mL) เพื่อความแม่นยำ';
    } else if (volumeMl < 5) {
      return 'ใช้หลอดฉีดยาขนาด 5 mL หรือช้อนยาที่มีมาตรการวัด';
    } else {
      return 'ใช้ถ้วยยาที่มีมาตรการวัดหรือหลอดฉีดยาขนาดใหญ่';
    }
  };

  // Get patient data
  const patientData = form.getValues();
  const finalDosage = customDosage || selectedDosage;

  if (!selectedDrug || !selectedConcentration || !selectedFrequency || !finalDosage) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-8">
          <p>ข้อมูลไม่ครบถ้วน</p>
          <Button onClick={handleBack} className="mt-4">กลับไปแก้ไข</Button>
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
            <CheckCircle className="w-6 h-6 text-green-600" />
            ตรวจสอบข้อมูลสุดท้าย
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Patient Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              ข้อมูลผู้ป่วย
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>👶 อายุ: {patientData.ageYears} ปี {patientData.ageMonths > 0 ? `${patientData.ageMonths} เดือน` : ''}</div>
              <div>⚖️ น้ำหนัก: {patientData.weight} กิโลกรัม</div>
            </div>
          </div>

          {/* Drug Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4" />
              ข้อมูลยา
            </h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>💊 ยา: <span className="font-medium">{selectedDrug.genericName}</span></div>
              <div>🏥 รักษา: <span className="font-medium">{selectedIndication}</span></div>
              <div>📏 ขนาด: <span className="font-medium">{finalDosage.toFixed(1)} mg ต่อครั้ง</span></div>
            </div>
          </div>

          {/* Concentration & Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                ความเข้มข้น
              </h4>
              <div className="text-sm text-purple-700">
                <div>{selectedConcentration.description}</div>
                <div className="font-medium">{selectedConcentration.mgPerMl} mg/mL</div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                ความถี่
              </h4>
              <div className="text-sm text-orange-700">
                <div>{getFrequencyLabel(selectedFrequency)}</div>
                <div className="font-medium">{getTimesPerDay(selectedFrequency) > 0 ? `${getTimesPerDay(selectedFrequency)} ครั้ง/วัน` : 'ตามอาการ'}</div>
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              ผลการคำนวณ
            </h4>
            <div className="text-lg font-bold text-center py-2">
              <div className="text-blue-600">
                📏 {(finalDosage / selectedConcentration.mgPerMl).toFixed(2)} mL ต่อครั้ง
              </div>
              {getTimesPerDay(selectedFrequency) > 0 && (
                <div className="text-green-600 text-sm mt-1">
                  รวมต่อวัน: {((finalDosage / selectedConcentration.mgPerMl) * getTimesPerDay(selectedFrequency)).toFixed(2)} mL
                </div>
              )}
            </div>
          </div>

          {/* Key Information Highlight */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">📋 สรุปสำคัญ</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <div>• เด็ก {patientData.ageYears} ปี หนัก {patientData.weight} กก.</div>
              <div>• {selectedDrug.genericName} {finalDosage.toFixed(1)} mg ({(finalDosage / selectedConcentration.mgPerMl).toFixed(2)} mL)</div>
              <div>• {getFrequencyLabel(selectedFrequency)} สำหรับ {selectedIndication}</div>
              <div>• ความเข้มข้น: {selectedConcentration.description}</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="px-6 h-11"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              แก้ไข
            </Button>
            
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="px-8 h-11 text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  คำนวณ...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 mr-2" />
                  คำนวณขนาดยา
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}