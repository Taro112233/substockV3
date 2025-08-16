// components/forms/PatientInputForm.tsx
// Enhanced Main component with multi-drug support and patient session cache

'use client';

import React, { useState, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// Import sections
import { PatientFormHeader } from '@/components/forms/sections/PatientFormHeader';
import { PatientProgressIndicator } from '@/components/forms/sections/PatientProgressIndicator';
import { PatientInfoSection } from '@/components/forms/sections/PatientInfoSection';
import { DrugSelectionSection } from '@/components/forms/sections/DrugSelectionSection';
import { DosageRecommendationSection } from '@/components/forms/sections/DosageRecommendationSection';
import { ConcentrationSection } from '@/components/forms/sections/ConcentrationSection';
import { FrequencySection } from '@/components/forms/sections/FrequencySection';
import { ReviewSection } from '@/components/forms/sections/ReviewSection';
import { ResultsSection } from '@/components/forms/sections/ResultsSection';

// Types and validation
import { PatientInputSchema, type PatientInput } from '@/lib/validations/patient';
import { type DrugConcentration, type FrequencyKey } from '@/lib/constants/drugs';

// Enhanced types for multi-drug support
export interface Drug {
  id: string;
  genericName: string;
  brandNames: string[];
  category: string;
  indications: string[];
  dosingRules: DosingRule[];
}

export interface DosingRule {
  indication: string;
  minDose: number;
  maxDose: number;
  recommendedDose: number;
  unit: 'mg/kg/dose' | 'mg/dose';
  ageMinYears: number;
  ageMaxYears: number;
  type: 'weight_based' | 'age_based';
  priority?: number;
}

export interface PatientMedication {
  id: string;
  drug: Drug;
  indication: string;
  dosage: number; // mg/kg/dose or mg/dose
  frequency: FrequencyKey;
  concentration: DrugConcentration;
  calculatedDose: {
    doseInMg: number;
    volumeInMl: number;
    timesPerDay: number;
  };
  calculatedAt: Date;
}

export interface PatientSession {
  id: string;
  patient: {
    ageYears: number;
    ageMonths?: number;
    weight: number;
  };
  medications: PatientMedication[];
  createdAt: Date;
  lastUpdated: Date;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Enhanced Form context
export interface PatientFormContextType {
  // Current step management
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Current drug selection
  selectedDrug: Drug | null;
  setSelectedDrug: (drug: Drug | null) => void;
  selectedIndication: string;
  setSelectedIndication: (indication: string) => void;
  selectedDosage: number | null;
  setSelectedDosage: (dosage: number | null) => void;
  customDosage: number | null;
  setCustomDosage: (dosage: number | null) => void;
  
  // Concentration and frequency
  selectedConcentration: DrugConcentration | null;
  setSelectedConcentration: (concentration: DrugConcentration | null) => void;
  selectedFrequency: FrequencyKey;
  setSelectedFrequency: (frequency: FrequencyKey) => void;
  
  // Current calculation result
  calculation: any;
  setCalculation: (calculation: any) => void;
  
  // Patient session (multi-drug support)
  patientSession: PatientSession | null;
  setPatientSession: (session: PatientSession | null) => void;
  addMedicationToSession: (medication: PatientMedication) => void;
  removeMedicationFromSession: (medicationId: string) => void;
  
  // Loading state
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Form instance
  form: any;
  resetForm: () => void;
}

const PatientFormContext = createContext<PatientFormContextType | undefined>(undefined);

export const usePatientForm = (): PatientFormContextType => {
  const context = useContext(PatientFormContext);
  if (context === undefined) {
    throw new Error('usePatientForm must be used within a PatientFormProvider');
  }
  return context;
};

// Enhanced Patient Input Schema (removed gender)
const EnhancedPatientInputSchema = PatientInputSchema.omit({ gender: true });
type EnhancedPatientInput = Omit<PatientInput, 'gender'>;

export function PatientInputForm() {
  // Form state
  const form = useForm<EnhancedPatientInput>({
    resolver: zodResolver(EnhancedPatientInputSchema),
    defaultValues: {
      ageYears: 0,
      ageMonths: 0,
      weight: 0,
    },
  });

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Current drug selection
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [selectedIndication, setSelectedIndication] = useState('');
  const [selectedDosage, setSelectedDosage] = useState<number | null>(null);
  const [customDosage, setCustomDosage] = useState<number | null>(null);
  
  // Concentration and frequency
  const [selectedConcentration, setSelectedConcentration] = useState<DrugConcentration | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyKey>('');
  
  // Calculation result
  const [calculation, setCalculation] = useState<any>(null);
  
  // Patient session for multi-drug support
  const [patientSession, setPatientSession] = useState<PatientSession | null>(null);
  
  // Loading state
  const [loading, setLoading] = useState(false);

  // Generate session ID
  const generateSessionId = () => {
    return `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add medication to current patient session
  const addMedicationToSession = (medication: PatientMedication) => {
    const formData = form.getValues();
    
    if (!patientSession) {
      // Create new session
      const newSession: PatientSession = {
        id: generateSessionId(),
        patient: {
          ageYears: Number(formData.ageYears),
          ageMonths: Number(formData.ageMonths) || 0,
          weight: Number(formData.weight),
        },
        medications: [medication],
        createdAt: new Date(),
        lastUpdated: new Date(),
      };
      setPatientSession(newSession);
      
      // Cache in localStorage
      localStorage.setItem(`patient_session_${newSession.id}`, JSON.stringify(newSession));
    } else {
      // Add to existing session
      const updatedSession = {
        ...patientSession,
        medications: [...patientSession.medications, medication],
        lastUpdated: new Date(),
      };
      setPatientSession(updatedSession);
      
      // Update cache
      localStorage.setItem(`patient_session_${updatedSession.id}`, JSON.stringify(updatedSession));
    }
  };

  // Remove medication from session
  const removeMedicationFromSession = (medicationId: string) => {
    if (!patientSession) return;
    
    const updatedSession = {
      ...patientSession,
      medications: patientSession.medications.filter(med => med.id !== medicationId),
      lastUpdated: new Date(),
    };
    setPatientSession(updatedSession);
    
    // Update cache
    localStorage.setItem(`patient_session_${updatedSession.id}`, JSON.stringify(updatedSession));
  };

  // Reset form for new patient
  const resetForm = () => {
    setCurrentStep(1);
    form.reset();
    setSelectedDrug(null);
    setSelectedIndication('');
    setSelectedDosage(null);
    setCustomDosage(null);
    setSelectedConcentration(null);
    setSelectedFrequency('');
    setCalculation(null);
    setPatientSession(null);
    
    // Clear cache
    if (patientSession) {
      localStorage.removeItem(`patient_session_${patientSession.id}`);
    }
  };

  // Reset for new medication (same patient)
  const resetForNewMedication = () => {
    setCurrentStep(2); // Go back to drug selection
    setSelectedDrug(null);
    setSelectedIndication('');
    setSelectedDosage(null);
    setCustomDosage(null);
    setSelectedConcentration(null);
    setSelectedFrequency('');
    setCalculation(null);
    // Keep patientSession intact
  };

  // Context value
  const contextValue: PatientFormContextType = {
    currentStep,
    setCurrentStep,
    selectedDrug,
    setSelectedDrug,
    selectedIndication,
    setSelectedIndication,
    selectedDosage,
    setSelectedDosage,
    customDosage,
    setCustomDosage,
    selectedConcentration,
    setSelectedConcentration,
    selectedFrequency,
    setSelectedFrequency,
    calculation,
    setCalculation,
    patientSession,
    setPatientSession,
    addMedicationToSession,
    removeMedicationFromSession,
    loading,
    setLoading,
    form,
    resetForm,
  };

  return (
    <PatientFormContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <PatientFormHeader />

          {/* Progress Indicator */}
          <PatientProgressIndicator />

          {/* Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Form Sections */}
            {currentStep === 1 && <PatientInfoSection />}
            {currentStep === 2 && <DrugSelectionSection />}
            {currentStep === 3 && <DosageRecommendationSection />}
            {currentStep === 4 && <ConcentrationSection />}
            {currentStep === 5 && <FrequencySection />}
            {currentStep === 6 && <ReviewSection />}
            {currentStep === 7 && <ResultsSection resetForNewMedication={resetForNewMedication} />}
          </motion.div>
        </div>
      </div>
    </PatientFormContext.Provider>
  );
}

export default PatientInputForm;