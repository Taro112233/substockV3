// components/forms/sections/ConcentrationSection.tsx
// Enhanced concentration selection with custom input matching existing UI

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Beaker, Calculator, CheckCircle, Plus } from 'lucide-react';

import { usePatientForm, type DrugConcentration } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

// Mock concentration database for different drugs
const CONCENTRATION_DATABASE: Record<string, DrugConcentration[]> = {
  'paracetamol': [
    { mgPerMl: 24, description: '120 mg/5mL', commonName: 'Syrup เด็ก' },
    { mgPerMl: 50, description: '250 mg/5mL', commonName: 'Syrup ผู้ใหญ่' },
    { mgPerMl: 100, description: '500 mg/5mL', commonName: 'Syrup เข้มข้น' },
    { mgPerMl: 80, description: '160 mg/2mL', commonName: 'Drops' }
  ],
  'ibuprofen': [
    { mgPerMl: 20, description: '100 mg/5mL', commonName: 'Syrup เด็ก' },
    { mgPerMl: 40, description: '200 mg/5mL', commonName: 'Syrup ผู้ใหญ่' },
    { mgPerMl: 100, description: '100 mg/mL', commonName: 'Drops' }
  ],
  'cetirizine': [
    { mgPerMl: 1, description: '5 mg/5mL', commonName: 'Syrup' },
    { mgPerMl: 10, description: '10 mg/mL', commonName: 'Drops' }
  ],
  'prednisolone': [
    { mgPerMl: 1, description: '5 mg/5mL', commonName: 'Syrup' },
    { mgPerMl: 3, description: '15 mg/5mL', commonName: 'Forte' }
  ],
  'amoxicillin': [
    { mgPerMl: 25, description: '125 mg/5mL', commonName: 'Suspension' },
    { mgPerMl: 50, description: '250 mg/5mL', commonName: 'Forte' },
    { mgPerMl: 100, description: '500 mg/5mL', commonName: 'Double Forte' }
  ]
};

export function ConcentrationSection() {
  const {
    selectedDrug,
    selectedConcentration,
    setSelectedConcentration,
    selectedDosage,
    customDosage,
    setCurrentStep,
    form
  } = usePatientForm();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customMg, setCustomMg] = useState('');
  const [customMl, setCustomMl] = useState('');

  // Get available concentrations for selected drug
  const availableConcentrations = useMemo(() => {
    if (!selectedDrug) return [];
    return CONCENTRATION_DATABASE[selectedDrug.id] || [];
  }, [selectedDrug]);

  // Get final dosage (custom or selected)
  const finalDosage = customDosage || selectedDosage;

  // Calculate volume needed for each concentration
  const concentrationWithVolumes = useMemo(() => {
    if (!finalDosage) return [];
    
    return availableConcentrations.map(conc => ({
      ...conc,
      volumeNeeded: finalDosage / conc.mgPerMl
    }));
  }, [availableConcentrations, finalDosage]);

  // Custom concentration calculation
  const customConcentration = useMemo(() => {
    const mg = parseFloat(customMg);
    const ml = parseFloat(customMl);
    
    if (isNaN(mg) || isNaN(ml) || ml === 0) return null;
    
    return {
      mgPerMl: mg / ml,
      description: `${mg} mg/${ml}mL`,
      commonName: 'กำหนดเอง',
      volumeNeeded: finalDosage ? finalDosage / (mg / ml) : 0
    };
  }, [customMg, customMl, finalDosage]);

  const handleConcentrationSelect = (concentration: DrugConcentration) => {
    setSelectedConcentration(concentration);
    setShowCustomInput(false);
  };

  const handleCustomConcentrationSelect = () => {
    setShowCustomInput(true);
    setSelectedConcentration(null);
  };

  const handleCustomConcentrationConfirm = () => {
    if (customConcentration) {
      setSelectedConcentration({
        mgPerMl: customConcentration.mgPerMl,
        description: customConcentration.description,
        commonName: customConcentration.commonName
      });
    }
  };

  const handleNext = () => {
    if (selectedConcentration) {
      setCurrentStep(5); // Go to frequency selection
    }
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  const isValid = selectedConcentration !== null;

  if (!selectedDrug || !finalDosage) {
    return (
      <Card className="shadow-lg">
        <CardContent className="text-center py-8">
          <p>ไม่พบข้อมูลยาหรือขนาดยา</p>
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
            <Beaker className="w-6 h-6 text-blue-600" />
            เลือกความเข้มข้นยา
          </CardTitle>
          <div className="text-sm text-gray-600">
            {selectedDrug.genericName} - ขนาด {finalDosage.toFixed(1)} mg ต่อครั้ง
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Available Concentrations */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">ความเข้มข้นที่มีจำหน่าย:</h4>
            
            {concentrationWithVolumes.map((concentration, index) => {
              const isSelected = selectedConcentration?.mgPerMl === concentration.mgPerMl && 
                                selectedConcentration?.description === concentration.description;
              
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleConcentrationSelect(concentration)}
                    className={`w-full h-auto p-4 justify-start text-left ${
                      isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Beaker className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{concentration.description}</div>
                          <div className="text-sm text-gray-600">
                            {concentration.commonName} • {concentration.mgPerMl} mg/mL
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {concentration.volumeNeeded.toFixed(2)} mL
                        </div>
                        <div className="text-xs text-gray-500">ต่อครั้ง</div>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}

            {/* Custom Concentration Option */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                variant={showCustomInput ? "default" : "outline"}
                onClick={handleCustomConcentrationSelect}
                className={`w-full h-auto p-4 justify-start text-left ${
                  showCustomInput ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium">กำหนดความเข้มข้นเอง</div>
                    <div className="text-sm text-gray-600">สำหรับยาที่ไม่มีในรายการ</div>
                  </div>
                </div>
              </Button>
            </motion.div>

            {/* Custom Input Form */}
            {showCustomInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4"
              >
                <h5 className="font-medium text-purple-800">กำหนดความเข้มข้นเอง:</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      ขนาดยา (mg):
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 250"
                      value={customMg}
                      onChange={(e) => setCustomMg(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">
                      ปริมาตร (mL):
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 5"
                      value={customMl}
                      onChange={(e) => setCustomMl(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>

                {customConcentration && (
                  <div className="bg-white border border-purple-300 rounded p-3">
                    <div className="text-sm space-y-1">
                      <div className="font-medium text-purple-800">
                        ความเข้มข้น: {customConcentration.mgPerMl.toFixed(2)} mg/mL
                      </div>
                      <div className="text-purple-700">
                        ปริมาตรที่ต้องให้: <span className="font-bold text-green-600">
                          {customConcentration.volumeNeeded.toFixed(2)} mL
                        </span> ต่อครั้ง
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleCustomConcentrationConfirm}
                  disabled={!customConcentration}
                  className="w-full h-10"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ใช้ความเข้มข้นนี้
                </Button>
              </motion.div>
            )}
          </div>

          {/* Volume Comparison */}
          {concentrationWithVolumes.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                เปรียบเทียบปริมาตรยา
              </h4>
              <div className="space-y-2">
                {concentrationWithVolumes
                  .sort((a, b) => a.volumeNeeded - b.volumeNeeded)
                  .map((conc, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">{conc.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conc.volumeNeeded.toFixed(2)} mL</span>
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
          )}

          {/* Selected Concentration Summary */}
          {selectedConcentration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ความเข้มข้นที่เลือก
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <div><span className="font-medium">ความเข้มข้น:</span> {selectedConcentration.description}</div>
                <div><span className="font-medium">เท่ากับ:</span> {selectedConcentration.mgPerMl} mg/mL</div>
                <div><span className="font-medium">ปริมาตรต่อครั้ง:</span> {(finalDosage / selectedConcentration.mgPerMl).toFixed(2)} mL</div>
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
              ถัดไป: ความถี่
              <Beaker className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}