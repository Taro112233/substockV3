// 📄 File: hooks/use-drug-code-validation.ts
// Custom hook สำหรับ real-time validation รหัสยา

import { useState, useEffect, useCallback } from 'react';

interface DrugInfo {
  id: string;
  hospitalDrugCode: string;
  name: string;
  genericName: string | null;
  dosageForm: string;
  strength: string | null;
  unit: string;
  category: string;
  createdAt: string;
  stocks: {
    department: string;
    totalQuantity: number;
  }[];
}

interface ValidationResult {
  available: boolean;
  exists: boolean;
  drug?: DrugInfo;
  suggestions?: { hospitalDrugCode: string; name: string }[];
  message: string;
}

interface ValidationState {
  isChecking: boolean;
  result: ValidationResult | null;
  error: string | null;
}

export function useDrugCodeValidation(initialCode = '') {
  const [code, setCode] = useState(initialCode);
  const [state, setState] = useState<ValidationState>({
    isChecking: false,
    result: null,
    error: null
  });

  // Debounce การพิมพ์ 500ms เพื่อลด API calls
  const debouncedCode = useDebounce(code.trim(), 500);

  // ฟังก์ชันตรวจสอบรหัส
  const checkCode = useCallback(async (codeToCheck: string) => {
    if (!codeToCheck) {
      setState({
        isChecking: false,
        result: null,
        error: null
      });
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const response = await fetch(
        `/api/drugs/check-code?code=${encodeURIComponent(codeToCheck)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ValidationResult = await response.json();
      
      setState({
        isChecking: false,
        result,
        error: null
      });

    } catch (error) {
      console.error('Code validation error:', error);
      setState({
        isChecking: false,
        result: null,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      });
    }
  }, []);

  // Auto-check เมื่อ debounced code เปลี่ยน
  useEffect(() => {
    checkCode(debouncedCode);
  }, [debouncedCode, checkCode]);

  // Manual check (สำหรับการ retry)
  const manualCheck = useCallback(() => {
    checkCode(code.trim());
  }, [code, checkCode]);

  // Reset state
  const reset = useCallback(() => {
    setCode('');
    setState({
      isChecking: false,
      result: null,
      error: null
    });
  }, []);

  // Update code
  const updateCode = useCallback((newCode: string) => {
    setCode(newCode);
    
    // Clear previous result immediately when typing
    if (newCode.trim() !== debouncedCode) {
      setState(prev => ({
        ...prev,
        result: null,
        error: null
      }));
    }
  }, [debouncedCode]);

  return {
    // State
    code,
    isChecking: state.isChecking,
    result: state.result,
    error: state.error,
    
    // Computed states
    isAvailable: state.result?.available === true,
    isDuplicate: state.result?.exists === true,
    hasResult: state.result !== null,
    existingDrug: state.result?.drug || null,
    suggestions: state.result?.suggestions || [],
    
    // Actions
    updateCode,
    manualCheck,
    reset,
    
    // Validation status helpers
    getValidationStatus: () => {
      if (!code.trim()) return 'empty';
      if (state.isChecking) return 'checking';
      if (state.error) return 'error';
      if (state.result?.available) return 'available';
      if (state.result?.exists) return 'duplicate';
      return 'unknown';
    },
    
    // Get appropriate message
    getMessage: () => {
      const status = state.isChecking ? 'checking' : 
                    state.error ? 'error' :
                    state.result?.available ? 'available' :
                    state.result?.exists ? 'duplicate' :
                    'empty';
      
      switch (status) {
        case 'checking':
          return 'กำลังตรวจสอบ...';
        case 'error':
          return state.error || 'เกิดข้อผิดพลาด';
        case 'available':
          return `รหัส "${code.trim()}" ใช้ได้`;
        case 'duplicate':
          return `รหัส "${code.trim()}" มีอยู่แล้ว`;
        case 'empty':
        default:
          return '';
      }
    }
  };
}

// Debounce hook (ถ้ายังไม่มี)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}