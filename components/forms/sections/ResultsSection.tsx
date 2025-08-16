// components/forms/sections/ResultsSection.tsx
// Enhanced results with multi-drug support and caching

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Save, 
  Printer, 
  User, 
  Copy,
  RefreshCw,
  Calendar,
  Pill
} from 'lucide-react';

import { usePatientForm, type PatientMedication } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

interface ResultsSectionProps {
  resetForNewMedication: () => void;
}

export function ResultsSection({ resetForNewMedication }: ResultsSectionProps) {
  const {
    calculation,
    patientSession,
    addMedicationToSession,
    removeMedicationFromSession,
    resetForm
  } = usePatientForm();

  const [savedToSession, setSavedToSession] = useState(false);
  const [showAllMedications, setShowAllMedications] = useState(false);

  // Save current calculation to patient session
  const handleSaveToSession = () => {
    if (!calculation) return;

    const newMedication: PatientMedication = {
      id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      drug: calculation.drugInfo.drug,
      indication: calculation.drugInfo.indication,
      dosage: calculation.drugInfo.dosage,
      frequency: calculation.drugInfo.frequency,
      concentration: calculation.drugInfo.concentration,
      calculatedDose: {
        doseInMg: calculation.calculation.doseInMg,
        volumeInMl: calculation.calculation.volumeInMl,
        timesPerDay: calculation.calculation.timesPerDay
      },
      calculatedAt: new Date()
    };

    addMedicationToSession(newMedication);
    setSavedToSession(true);

    // Auto-hide success message after 3 seconds
    setTimeout(() => setSavedToSession(false), 3000);
  };

  // Remove medication from session
  const handleRemoveMedication = (medicationId: string) => {
    removeMedicationFromSession(medicationId);
  };

  // Copy prescription text to clipboard
  const handleCopyPrescription = async () => {
    if (!calculation || !patientSession) return;

    const prescriptionText = generatePrescriptionText();
    
    try {
      await navigator.clipboard.writeText(prescriptionText);
      // TODO: Show success toast
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // TODO: Show error toast
    }
  };

  // Generate prescription text for copying/printing
  const generatePrescriptionText = (): string => {
    if (!patientSession) return '';

    const patient = patientSession.patient;
    let text = `=== ใบสั่งยา ===\n`;
    text += `ผู้ป่วย: เด็ก ${patient.ageYears} ปี`;
    if (patient.ageMonths && patient.ageMonths > 0) {
      text += ` ${patient.ageMonths} เดือน`;
    }
    text += ` หนัก ${patient.weight} กก.\n`;
    text += `วันที่: ${new Date().toLocaleDateString('th-TH')}\n\n`;

    patientSession.medications.forEach((med, index) => {
      text += `${index + 1}. ${med.drug.genericName}\n`;
      text += `   รักษา: ${med.indication}\n`;
      text += `   ขนาด: ${med.calculatedDose.volumeInMl.toFixed(2)} mL ต่อครั้ง\n`;
      text += `   ความถี่: ${getFrequencyLabel(med.frequency)}\n`;
      text += `   ความเข้มข้น: ${med.concentration.description}\n\n`;
    });

    return text;
  };

  // Helper function to get frequency label
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

  if (!calculation) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-8">
          <p>ไม่พบผลการคำนวณ</p>
        </CardContent>
      </Card>
    );
  }

  const currentMedication = calculation.drugInfo;
  const result = calculation.calculation;
  const allMedications = patientSession?.medications || [];
  const hasMultipleMedications = allMedications.length > 1;

  return (
    <motion.div
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Main Result Card */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            ผลการคำนวณ
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Current Drug Result - Prominent Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6 text-center">
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900">
                💊 {currentMedication.drug.genericName}
              </div>
              
              <div className="text-3xl font-bold text-green-600">
                📏 {result.volumeInMl.toFixed(2)} mL ต่อครั้ง
              </div>
              
              <div className="text-lg text-gray-700">
                ⏰ {getFrequencyLabel(currentMedication.frequency)}
                {result.timesPerDay > 0 && (
                  <span className="text-blue-600"> ({result.timesPerDay} ครั้ง/วัน)</span>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                🎯 รักษา: {currentMedication.indication}
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📊 รายละเอียดขนาดยา</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>ขนาดต่อครั้ง: {result.doseInMg.toFixed(1)} mg</div>
                <div>ปริมาตรต่อครั้ง: {result.volumeInMl.toFixed(2)} mL</div>
                {result.timesPerDay > 0 && (
                  <>
                    <div>รวมต่อวัน: {result.dailyDoseMg.toFixed(1)} mg</div>
                    <div>ปริมาตรต่อวัน: {result.dailyVolumeMl.toFixed(2)} mL</div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">🧪 ข้อมูลยา</h4>
              <div className="text-sm text-purple-700 space-y-1">
                <div>ความเข้มข้น: {currentMedication.concentration.description}</div>
                <div>เท่ากับ: {currentMedication.concentration.mgPerMl} mg/mL</div>
                <div>หมวดหมู่: {currentMedication.drug.category}</div>
              </div>
            </div>
          </div>

          {/* Calculation Steps */}
          {calculation.steps && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">🔢 ขั้นตอนการคำนวณ</h4>
              <div className="text-sm text-gray-700 space-y-1">
                {calculation.steps.step1 && <div>1. {calculation.steps.step1}</div>}
                {calculation.steps.step2 && <div>2. {calculation.steps.step2}</div>}
                {calculation.steps.step3 && <div>3. {calculation.steps.step3}</div>}
              </div>
            </div>
          )}

          {/* Measurement Guidance */}
          {calculation.measurementGuidance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">💡 คำแนะนำการวัดยา</h4>
              <div className="text-sm text-yellow-700">
                {calculation.measurementGuidance}
              </div>
            </div>
          )}

          {/* Warnings */}
          {calculation.warnings && calculation.warnings.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-1">⚠️ ข้อควรระวัง:</div>
                {calculation.warnings.map((warning: string, index: number) => (
                  <div key={index}>• {warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {!savedToSession ? (
              <Button 
                onClick={handleSaveToSession}
                className="flex-1 h-12"
              >
                <Save className="w-4 h-4 mr-2" />
                เพิ่มยาในรายการ
              </Button>
            ) : (
              <Button 
                variant="outline"
                disabled
                className="flex-1 h-12 bg-green-50 border-green-300 text-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                บันทึกแล้ว
              </Button>
            )}
            
            <Button 
              onClick={resetForNewMedication}
              variant="outline"
              className="flex-1 h-12"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มยาอื่น
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Drug Management */}
      {hasMultipleMedications && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                รายการยาทั้งหมด
                <Badge variant="outline">{allMedications.length} รายการ</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMedications(!showAllMedications)}
              >
                {showAllMedications ? 'ซ่อน' : 'แสดงทั้งหมด'}
              </Button>
            </CardTitle>
            
            {patientSession && (
              <div className="text-sm text-gray-600">
                👶 เด็ก {patientSession.patient.ageYears} ปี หนัก {patientSession.patient.weight} กก.
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <AnimatePresence>
              {showAllMedications && (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-3"
                >
                  {allMedications.map((medication, index) => (
                    <motion.div
                      key={medication.id}
                      variants={itemVariants}
                    >
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{medication.drug.genericName}</span>
                            <Badge variant="outline" className="text-xs">
                              {medication.indication}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>📏 {medication.calculatedDose.volumeInMl.toFixed(2)} mL ต่อครั้ง</div>
                            <div>⏰ {getFrequencyLabel(medication.frequency)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedication(medication.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Print/Export Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button 
                onClick={handleCopyPrescription}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                คัดลอกใบสั่งยา
              </Button>
              
              <Button 
                onClick={() => window.print()}
                variant="outline"
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" />
                พิมพ์รายการ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Patient / Reset Options */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetForm}
              variant="outline"
              className="flex-1 h-12"
            >
              <User className="w-4 h-4 mr-2" />
              ผู้ป่วยใหม่
            </Button>
            
            <Button 
              onClick={resetForNewMedication}
              className="flex-1 h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              คำนวณยาใหม่
            </Button>
          </div>
          
          <div className="text-center mt-4 text-sm text-gray-500">
            <Calendar className="w-4 h-4 inline mr-1" />
            บันทึกเมื่อ: {new Date().toLocaleString('th-TH')}
          </div>
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-area,
          .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Hidden Print Content */}
      <div className="print-area hidden print:block">
        <div className="max-w-2xl mx-auto p-8 bg-white">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">ใบสั่งยาเด็ก</h1>
            <div className="text-sm text-gray-600">
              Pharmacy Assistant Toolkit
            </div>
          </div>
          
          {patientSession && (
            <>
              <div className="mb-6 p-4 border border-gray-300 rounded">
                <h3 className="font-bold mb-2">ข้อมูลผู้ป่วย</h3>
                <div>อายุ: {patientSession.patient.ageYears} ปี {patientSession.patient.ageMonths > 0 ? `${patientSession.patient.ageMonths} เดือน` : ''}</div>
                <div>น้ำหนัก: {patientSession.patient.weight} กิโลกรัม</div>
                <div>วันที่: {new Date().toLocaleDateString('th-TH')}</div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold mb-3">รายการยา</h3>
                {patientSession.medications.map((med, index) => (
                  <div key={med.id} className="mb-4 p-3 border border-gray-200 rounded">
                    <div className="font-medium">{index + 1}. {med.drug.genericName}</div>
                    <div className="text-sm mt-1 space-y-1">
                      <div>รักษา: {med.indication}</div>
                      <div>ขนาด: {med.calculatedDose.volumeInMl.toFixed(2)} mL ต่อครั้ง</div>
                      <div>ความถี่: {getFrequencyLabel(med.frequency)}</div>
                      <div>ความเข้มข้น: {med.concentration.description}</div>
                      {med.calculatedDose.timesPerDay > 0 && (
                        <div>รวมต่อวัน: {(med.calculatedDose.volumeInMl * med.calculatedDose.timesPerDay).toFixed(2)} mL</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
                <div>คำนวณโดย: Pharmacy Assistant Toolkit</div>
                <div>อิงจากแนวทางปฏิบัติ TPPG และกรมการแพทย์</div>
                <div>วันที่พิมพ์: {new Date().toLocaleString('th-TH')}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}