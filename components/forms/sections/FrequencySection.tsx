// components/forms/sections/FrequencySection.tsx
// Complete frequency options with drug-specific recommendations

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Star, Moon, Sun, Zap, Calendar, CheckCircle } from 'lucide-react';

import { usePatientForm, type FrequencyKey } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

// Frequency options with comprehensive coverage
interface FrequencyOption {
  key: FrequencyKey;
  label: string;
  description: string;
  timesPerDay: number;
  interval: string;
  icon: any;
  color: string;
  examples: string[];
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    key: 'q4h',
    label: 'ทุก 4 ชั่วโมง',
    description: '6 ครั้งต่อวัน',
    timesPerDay: 6,
    interval: '4 ชั่วโมง',
    icon: Zap,
    color: 'red',
    examples: ['06:00', '10:00', '14:00', '18:00', '22:00', '02:00']
  },
  {
    key: 'q6h',
    label: 'ทุก 6 ชั่วโมง',
    description: '4 ครั้งต่อวัน',
    timesPerDay: 4,
    interval: '6 ชั่วโมง',
    icon: Clock,
    color: 'orange',
    examples: ['06:00', '12:00', '18:00', '24:00']
  },
  {
    key: 'q8h',
    label: 'ทุก 8 ชั่วโมง',
    description: '3 ครั้งต่อวัน',
    timesPerDay: 3,
    interval: '8 ชั่วโมง',
    icon: Sun,
    color: 'yellow',
    examples: ['08:00', '16:00', '24:00']
  },
  {
    key: 'q12h',
    label: 'ทุก 12 ชั่วโมง',
    description: '2 ครั้งต่อวัน',
    timesPerDay: 2,
    interval: '12 ชั่วโมง',
    icon: Moon,
    color: 'blue',
    examples: ['08:00', '20:00']
  },
  {
    key: 'daily',
    label: 'วันละครั้ง',
    description: '1 ครั้งต่อวัน',
    timesPerDay: 1,
    interval: '24 ชั่วโมง',
    icon: Calendar,
    color: 'green',
    examples: ['08:00']
  },
  {
    key: 'prn',
    label: 'เมื่อจำเป็น (PRN)',
    description: 'ตามอาการ',
    timesPerDay: 0,
    interval: 'ตามอาการ',
    icon: Star,
    color: 'purple',
    examples: ['เมื่อมีอาการ']
  }
];

// Drug-specific frequency recommendations
const DRUG_FREQUENCY_RECOMMENDATIONS: Record<string, Record<string, FrequencyKey[]>> = {
  'paracetamol': {
    'ไข้': ['q6h', 'q4h'],
    'ปวดหัว': ['q6h', 'prn'],
    'ปวดฟัน': ['q6h', 'prn'],
    'ปวดกล้ามเนื้อ': ['q8h', 'prn']
  },
  'ibuprofen': {
    'ไข้': ['q8h', 'q6h'],
    'ข้ออักเสบ': ['q8h', 'q12h'],
    'ปวดกล้ามเนื้อ': ['q8h', 'prn'],
    'ปวดฟัน': ['q8h', 'prn']
  },
  'cetirizine': {
    'แพ้': ['daily', 'q12h'],
    'ลมพิษ': ['daily', 'q12h'],
    'น้ำมูกไหล': ['daily'],
    'คันตา': ['daily', 'prn']
  },
  'prednisolone': {
    'หืด': ['daily', 'q12h'],
    'แพ้รุนแรง': ['daily'],
    'ข้ออักเสบ': ['daily'],
    'โรคผิวหนัง': ['daily']
  },
  'amoxicillin': {
    'ติดเชื้อหู': ['q8h', 'q12h'],
    'ติดเชื้อคอ': ['q8h', 'q12h'],
    'ปอดบวม': ['q8h'],
    'ติดเชื้อทางเดินปัสสาวะ': ['q8h', 'q12h']
  }
};

export function FrequencySection() {
  const {
    selectedDrug,
    selectedIndication,
    selectedFrequency,
    setSelectedFrequency,
    selectedConcentration,
    selectedDosage,
    customDosage,
    setCurrentStep
  } = usePatientForm();

  // Get recommendations for current drug and indication
  const recommendations = useMemo(() => {
    if (!selectedDrug || !selectedIndication) return [];
    
    const drugRecs = DRUG_FREQUENCY_RECOMMENDATIONS[selectedDrug.id];
    if (!drugRecs) return [];
    
    return drugRecs[selectedIndication] || [];
  }, [selectedDrug, selectedIndication]);

  // Calculate daily dose for each frequency option
  const finalDosage = customDosage || selectedDosage;
  
  const frequencyWithDailyDose = useMemo(() => {
    if (!finalDosage || !selectedConcentration) return [];
    
    return FREQUENCY_OPTIONS.map(freq => {
      const dailyDoseMg = freq.timesPerDay > 0 ? finalDosage * freq.timesPerDay : finalDosage;
      const dailyVolumeMl = freq.timesPerDay > 0 ? 
        (finalDosage / selectedConcentration.mgPerMl) * freq.timesPerDay : 
        (finalDosage / selectedConcentration.mgPerMl);
      
      return {
        ...freq,
        dailyDoseMg,
        dailyVolumeMl,
        isRecommended: recommendations.includes(freq.key),
        isPrimary: recommendations[0] === freq.key
      };
    });
  }, [finalDosage, selectedConcentration, recommendations]);

  const handleFrequencySelect = (frequency: FrequencyKey) => {
    setSelectedFrequency(frequency);
  };

  const handleNext = () => {
    if (selectedFrequency) {
      setCurrentStep(6); // Go to review
    }
  };

  const handleBack = () => {
    setCurrentStep(4);
  };

  const isValid = selectedFrequency !== '';

  if (!selectedDrug || !selectedIndication || !finalDosage || !selectedConcentration) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-8">
          <p>ไม่พบข้อมูลที่จำเป็น</p>
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
            <Clock className="w-6 h-6 text-blue-600" />
            ความถี่การให้ยา
          </CardTitle>
          <div className="text-sm text-gray-600">
            {selectedDrug.genericName} สำหรับ {selectedIndication}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Current Selection Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2">สรุปข้อมูล</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>💊 ขนาดต่อครั้ง: {finalDosage.toFixed(1)} mg = {(finalDosage / selectedConcentration.mgPerMl).toFixed(2)} mL</div>
              <div>🧪 ความเข้มข้น: {selectedConcentration.description}</div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                แนวทางแนะนำสำหรับ {selectedDrug.genericName} รักษา {selectedIndication}
              </h4>
              <div className="text-sm text-blue-700">
                <div className="font-medium">ความถี่ที่แนะนำ:</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {recommendations.map((recFreq, index) => {
                    const freqOption = FREQUENCY_OPTIONS.find(f => f.key === recFreq);
                    return (
                      <Badge 
                        key={recFreq}
                        variant="outline" 
                        className={`${index === 0 ? 'bg-blue-100 border-blue-500 text-blue-800' : 'border-blue-300 text-blue-700'}`}
                      >
                        {index === 0 && '⭐ '}{freqOption?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Frequency Options */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">เลือกความถี่การให้ยา:</h4>
            
            {frequencyWithDailyDose.map((freq) => {
              const Icon = freq.icon;
              const isSelected = selectedFrequency === freq.key;
              
              return (
                <motion.div
                  key={freq.key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleFrequencySelect(freq.key)}
                    className={`w-full h-auto p-4 justify-start text-left relative ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    } ${freq.isRecommended ? 'border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className={`w-5 h-5 mt-0.5 text-${freq.color}-600`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{freq.label}</span>
                          {freq.isPrimary && (
                            <Badge className="bg-blue-500 text-white">
                              ⭐ แนะนำ
                            </Badge>
                          )}
                          {freq.isRecommended && !freq.isPrimary && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              เหมาะสม
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {freq.description} • ห่างกัน {freq.interval}
                        </div>

                        {/* Daily totals */}
                        {freq.timesPerDay > 0 && (
                          <div className="text-sm space-y-1">
                            <div className="text-gray-700">
                              📊 รวมต่อวัน: <span className="font-medium">{freq.dailyDoseMg.toFixed(1)} mg</span> = <span className="font-medium">{freq.dailyVolumeMl.toFixed(2)} mL</span>
                            </div>
                          </div>
                        )}

                        {/* Example times */}
                        <div className="text-xs text-gray-500 mt-1">
                          ⏰ เวลาแนะนำ: {freq.examples.join(' → ')}
                        </div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Daily Dose Comparison */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              เปรียบเทียบปริมาณยาต่อวัน
            </h4>
            <div className="space-y-2">
              {frequencyWithDailyDose
                .filter(f => f.timesPerDay > 0)
                .sort((a, b) => a.dailyDoseMg - b.dailyDoseMg)
                .map((freq, index) => (
                  <div key={freq.key} className="flex justify-between items-center text-sm">
                    <span className="text-yellow-700">{freq.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{freq.dailyDoseMg.toFixed(1)} mg ({freq.dailyVolumeMl.toFixed(2)} mL)</span>
                      {index === 0 && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          น้อยที่สุด
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Frequency Summary */}
          {selectedFrequency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ความถี่ที่เลือก
              </h4>
              {(() => {
                const selectedFreqData = frequencyWithDailyDose.find(f => f.key === selectedFrequency);
                return selectedFreqData ? (
                  <div className="text-sm text-green-700 space-y-1">
                    <div><span className="font-medium">ความถี่:</span> {selectedFreqData.label}</div>
                    <div><span className="font-medium">ห่วงเวลา:</span> {selectedFreqData.interval}</div>
                    <div><span className="font-medium">ครั้งต่อวัน:</span> {selectedFreqData.timesPerDay > 0 ? `${selectedFreqData.timesPerDay} ครั้ง` : 'ตามอาการ'}</div>
                    {selectedFreqData.timesPerDay > 0 && (
                      <div><span className="font-medium">รวมต่อวัน:</span> {selectedFreqData.dailyDoseMg.toFixed(1)} mg = {selectedFreqData.dailyVolumeMl.toFixed(2)} mL</div>
                    )}
                  </div>
                ) : null;
              })()}
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
              ถัดไป: ตรวจสอบ
              <Clock className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}