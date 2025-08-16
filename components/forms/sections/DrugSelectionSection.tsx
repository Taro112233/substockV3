// components/forms/sections/DrugSelectionSection.tsx
// Dropdown selection with disease/indication selection

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pill, Heart, ArrowLeft, Search, Stethoscope } from 'lucide-react';

import { usePatientForm, type Drug } from '@/components/forms/PatientInputForm';

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

// Mock drug database with indications
const DRUGS_DATABASE: Drug[] = [
  {
    id: 'paracetamol',
    genericName: 'Paracetamol',
    brandNames: ['Tylenol', 'Calpol', 'Panadol'],
    category: 'ยาแก้ปวดลดไข้',
    indications: ['ไข้', 'ปวดหัว', 'ปวดฟัน', 'ปวดกล้ามเนื้อ'],
    dosingRules: [
      {
        indication: 'ไข้',
        minDose: 10,
        maxDose: 15,
        recommendedDose: 12.5,
        unit: 'mg/kg/dose',
        ageMinYears: 0,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      },
      {
        indication: 'ปวดหัว',
        minDose: 10,
        maxDose: 20,
        recommendedDose: 15,
        unit: 'mg/kg/dose',
        ageMinYears: 2,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      }
    ]
  },
  {
    id: 'ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: ['Brufen', 'Nurofen'],
    category: 'ยาแก้ปวดลดไข้',
    indications: ['ไข้', 'ข้ออักเสบ', 'ปวดกล้ามเนื้อ', 'ปวดฟัน'],
    dosingRules: [
      {
        indication: 'ไข้',
        minDose: 5,
        maxDose: 10,
        recommendedDose: 7.5,
        unit: 'mg/kg/dose',
        ageMinYears: 0.5,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      }
    ]
  },
  {
    id: 'cetirizine',
    genericName: 'Cetirizine',
    brandNames: ['Zyrtec', 'Alerid'],
    category: 'ยาแก้แพ้',
    indications: ['แพ้', 'ลมพิษ', 'น้ำมูกไหล', 'คันตา'],
    dosingRules: [
      {
        indication: 'แพ้',
        minDose: 0.25,
        maxDose: 0.5,
        recommendedDose: 0.25,
        unit: 'mg/kg/dose',
        ageMinYears: 0.5,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      }
    ]
  },
  {
    id: 'prednisolone',
    genericName: 'Prednisolone',
    brandNames: ['Prednisolone', 'Solupred'],
    category: 'ยาลดการอักเสบ',
    indications: ['หืด', 'แพ้รุนแรง', 'ข้ออักเสบ', 'โรคผิวหนัง'],
    dosingRules: [
      {
        indication: 'หืด',
        minDose: 1,
        maxDose: 2,
        recommendedDose: 1.5,
        unit: 'mg/kg/dose',
        ageMinYears: 1,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      }
    ]
  },
  {
    id: 'amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: ['Amoxil', 'Augmentin'],
    category: 'ยาปฏิชีวนะ',
    indications: ['ติดเชื้อหู', 'ติดเชื้อคอ', 'ปอดบวม', 'ติดเชื้อทางเดินปัสสาวะ'],
    dosingRules: [
      {
        indication: 'ติดเชื้อหู',
        minDose: 20,
        maxDose: 40,
        recommendedDose: 30,
        unit: 'mg/kg/dose',
        ageMinYears: 0,
        ageMaxYears: 18,
        type: 'weight_based',
        priority: 1
      }
    ]
  }
];

// Get all unique indications from all drugs
const getAllIndications = () => {
  const indicationsSet = new Set<string>();
  DRUGS_DATABASE.forEach(drug => {
    drug.indications.forEach(indication => indicationsSet.add(indication));
  });
  return Array.from(indicationsSet).sort();
};

export function DrugSelectionSection() {
  const { 
    selectedDrug, 
    setSelectedDrug, 
    selectedIndication, 
    setSelectedIndication,
    setCurrentStep 
  } = usePatientForm();

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter drugs based on search term
  const filteredDrugs = useMemo(() => {
    if (!searchTerm) return DRUGS_DATABASE;
    
    return DRUGS_DATABASE.filter(drug => 
      drug.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drug.brandNames.some(brand => brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      drug.category.includes(searchTerm) ||
      drug.indications.some(indication => indication.includes(searchTerm))
    );
  }, [searchTerm]);

  // Get available indications for selected drug
  const availableIndications = selectedDrug ? selectedDrug.indications : [];

  // Get drugs that can treat selected indication
  const drugsForIndication = useMemo(() => {
    if (!selectedIndication) return [];
    return DRUGS_DATABASE.filter(drug => 
      drug.indications.includes(selectedIndication)
    );
  }, [selectedIndication]);

  const handleDrugSelect = (drugId: string) => {
    const drug = DRUGS_DATABASE.find(d => d.id === drugId);
    if (drug) {
      setSelectedDrug(drug);
      // Reset indication when drug changes
      setSelectedIndication('');
    }
  };

  const handleIndicationSelect = (indication: string) => {
    setSelectedIndication(indication);
    
    // If no drug selected, auto-suggest first drug for this indication
    if (!selectedDrug && drugsForIndication.length > 0) {
      setSelectedDrug(drugsForIndication[0]);
    }
  };

  const handleNext = () => {
    if (selectedDrug && selectedIndication) {
      setCurrentStep(3); // Go to dosage recommendation
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const isValid = selectedDrug && selectedIndication;

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
            <Pill className="w-6 h-6 text-blue-600" />
            เลือกยาและโรค/อาการ
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Drug Selection */}
          <div className="space-y-3">
            <label className="text-base font-medium flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              เลือกยา
            </label>
            
            <Select value={selectedDrug?.id || ''} onValueChange={handleDrugSelect}>
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="กรุณาเลือกยา..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {DRUGS_DATABASE.map((drug) => (
                  <SelectItem key={drug.id} value={drug.id} className="py-3">
                    <div className="flex flex-col">
                      <div className="font-medium">{drug.genericName}</div>
                      <div className="text-sm text-gray-500">
                        {drug.brandNames.join(', ')} | {drug.category}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show selected drug info */}
            {selectedDrug && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <div className="text-sm">
                  <div className="font-medium text-blue-800">{selectedDrug.genericName}</div>
                  <div className="text-blue-600">
                    <span className="font-medium">ชื่อการค้า:</span> {selectedDrug.brandNames.join(', ')}
                  </div>
                  <div className="text-blue-600">
                    <span className="font-medium">หมวดหมู่:</span> {selectedDrug.category}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Indication Selection */}
          <div className="space-y-3">
            <label className="text-base font-medium flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-green-600" />
              โรค/อาการที่ต้องการรักษา
            </label>
            
            <Select 
              value={selectedIndication} 
              onValueChange={handleIndicationSelect}
              disabled={!selectedDrug}
            >
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder={selectedDrug ? "เลือกโรค/อาการ..." : "กรุณาเลือกยาก่อน"} />
              </SelectTrigger>
              <SelectContent>
                {availableIndications.map((indication) => (
                  <SelectItem key={indication} value={indication} className="py-2">
                    {indication}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Alternative: Browse by indication first */}
            {!selectedDrug && (
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">หรือเลือกจากอาการก่อน:</div>
                <div className="flex flex-wrap gap-2">
                  {getAllIndications().slice(0, 8).map((indication) => (
                    <Badge
                      key={indication}
                      variant="outline"
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 px-3 py-1"
                      onClick={() => handleIndicationSelect(indication)}
                    >
                      {indication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selected indication - show compatible drugs */}
          {selectedIndication && !selectedDrug && drugsForIndication.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-green-800 mb-2">
                ยาที่ใช้รักษา "{selectedIndication}":
              </h4>
              <div className="space-y-2">
                {drugsForIndication.map((drug) => (
                  <Button
                    key={drug.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDrug(drug)}
                    className="w-full justify-start h-auto p-3 bg-white hover:bg-green-50 border-green-300"
                  >
                    <div className="text-left">
                      <div className="font-medium">{drug.genericName}</div>
                      <div className="text-xs text-gray-500">{drug.brandNames.join(', ')}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Summary */}
          {selectedDrug && selectedIndication && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-purple-50 border border-purple-200 rounded-lg p-4"
            >
              <h4 className="font-medium text-purple-800 mb-2">✅ สรุปการเลือก</h4>
              <div className="text-sm text-purple-700 space-y-1">
                <div><span className="font-medium">ยา:</span> {selectedDrug.genericName}</div>
                <div><span className="font-medium">รักษา:</span> {selectedIndication}</div>
                <div><span className="font-medium">หมวดหมู่:</span> {selectedDrug.category}</div>
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
              ถัดไป: ขนาดยา
              <Heart className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}