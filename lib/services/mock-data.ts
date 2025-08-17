// 📄 File: lib/services/mock-data.ts

import { Stock, Transfer, Transaction } from '@/types/dashboard'

export const getMockPharmacyStocks = (): Stock[] => [
  {
    id: '1',
    drugId: 'drug1',
    department: 'PHARMACY',
    totalQuantity: 150,
    reservedQty: 20,
    minimumStock: 50,
    totalValue: 7500,
    drug: {
      hospitalDrugCode: 'PAR001',
      name: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      dosageForm: 'TAB',
      strength: '500mg',
      unit: 'เม็ด',
      category: 'GENERAL'
    }
  },
  {
    id: '2',
    drugId: 'drug2',
    department: 'PHARMACY',
    totalQuantity: 25,
    reservedQty: 5,
    minimumStock: 30,
    totalValue: 12500,
    drug: {
      hospitalDrugCode: 'AMX001',
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin',
      dosageForm: 'CAP',
      strength: '250mg',
      unit: 'แคปซูล',
      category: 'REFER'
    }
  },
  {
    id: '3',
    drugId: 'drug3',
    department: 'PHARMACY',
    totalQuantity: 80,
    reservedQty: 0,
    minimumStock: 20,
    totalValue: 4000,
    drug: {
      hospitalDrugCode: 'IBU001',
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      dosageForm: 'TAB',
      strength: '400mg',
      unit: 'เม็ด',
      category: 'GENERAL'
    }
  }
]

export const getMockOPDStocks = (): Stock[] => [
  {
    id: '4',
    drugId: 'drug1',
    department: 'OPD',
    totalQuantity: 50,
    reservedQty: 10,
    minimumStock: 20,
    totalValue: 2500,
    drug: {
      hospitalDrugCode: 'PAR001',
      name: 'Paracetamol 500mg',
      genericName: 'Paracetamol',
      dosageForm: 'TAB',
      strength: '500mg',
      unit: 'เม็ด',
      category: 'GENERAL'
    }
  },
  {
    id: '5',
    drugId: 'drug3',
    department: 'OPD',
    totalQuantity: 15,
    reservedQty: 5,
    minimumStock: 20,
    totalValue: 750,
    drug: {
      hospitalDrugCode: 'IBU001',
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      dosageForm: 'TAB',
      strength: '400mg',
      unit: 'เม็ด',
      category: 'GENERAL'
    }
  }
]

export const getMockTransfers = (): Transfer[] => [
  {
    id: 'TR001',
    transferNumber: 'TR-2024-001',
    fromDept: 'PHARMACY',
    toDept: 'OPD',
    status: 'PENDING',
    totalItems: 2,
    totalValue: 1500,
    requestedAt: '2024-01-20T10:30:00',
    requestedBy: 'สมหญิง พยาบาล',
    items: [
      {
        id: 'TI001',
        drugCode: 'PAR001',
        drugName: 'Paracetamol 500mg',
        requestedQty: 50,
        unit: 'เม็ด'
      },
      {
        id: 'TI002',
        drugCode: 'IBU001',
        drugName: 'Ibuprofen 400mg',
        requestedQty: 30,
        unit: 'เม็ด'
      }
    ]
  },
  {
    id: 'TR002',
    transferNumber: 'TR-2024-002',
    fromDept: 'PHARMACY',
    toDept: 'OPD',
    status: 'SENT',
    totalItems: 1,
    totalValue: 800,
    requestedAt: '2024-01-19T14:15:00',
    requestedBy: 'สมหญิง พยาบาล',
    approvedAt: '2024-01-19T15:00:00',
    sentAt: '2024-01-19T16:30:00',
    items: [
      {
        id: 'TI003',
        drugCode: 'AMX001',
        drugName: 'Amoxicillin 250mg',
        requestedQty: 20,
        approvedQty: 20,
        sentQty: 20,
        unit: 'แคปซูล'
      }
    ]
  },
  {
    id: 'TR003',
    transferNumber: 'TR-2024-003',
    fromDept: 'PHARMACY',
    toDept: 'OPD',
    status: 'RECEIVED',
    totalItems: 1,
    totalValue: 600,
    requestedAt: '2024-01-18T09:00:00',
    requestedBy: 'สมหญิง พยาบาล',
    approvedAt: '2024-01-18T10:00:00',
    sentAt: '2024-01-18T11:00:00',
    receivedAt: '2024-01-18T14:00:00',
    items: [
      {
        id: 'TI004',
        drugCode: 'PAR001',
        drugName: 'Paracetamol 500mg',
        requestedQty: 100,
        approvedQty: 100,
        sentQty: 100,
        receivedQty: 100,
        unit: 'เม็ด'
      }
    ]
  }
]

export const getMockPharmacyTransactions = (): Transaction[] => [
  {
    id: 'TX001',
    type: 'TRANSFER_OUT',
    drugCode: 'PAR001',
    drugName: 'Paracetamol 500mg',
    quantity: -50,
    unit: 'เม็ด',
    reference: 'TR-2024-001',
    createdAt: '2024-01-20T10:30:00',
    createdBy: 'สมชาย เภสัชกร'
  },
  {
    id: 'TX002',
    type: 'ADJUSTMENT',
    drugCode: 'AMX001',
    drugName: 'Amoxicillin 250mg',
    quantity: 100,
    unit: 'แคปซูล',
    reference: 'รับยาใหม่',
    createdAt: '2024-01-19T09:15:00',
    createdBy: 'สมชาย เภสัชกร'
  },
  {
    id: 'TX003',
    type: 'TRANSFER_OUT',
    drugCode: 'AMX001',
    drugName: 'Amoxicillin 250mg',
    quantity: -20,
    unit: 'แคปซูล',
    reference: 'TR-2024-002',
    createdAt: '2024-01-19T16:30:00',
    createdBy: 'สมชาย เภสัชกร'
  },
  {
    id: 'TX004',
    type: 'TRANSFER_OUT',
    drugCode: 'PAR001',
    drugName: 'Paracetamol 500mg',
    quantity: -100,
    unit: 'เม็ด',
    reference: 'TR-2024-003',
    createdAt: '2024-01-18T11:00:00',
    createdBy: 'สมชาย เภสัชกร'
  }
]

export const getMockOPDTransactions = (): Transaction[] => [
  {
    id: 'TX005',
    type: 'TRANSFER_IN',
    drugCode: 'PAR001',
    drugName: 'Paracetamol 500mg',
    quantity: 100,
    unit: 'เม็ด',
    reference: 'TR-2024-003',
    createdAt: '2024-01-18T14:00:00',
    createdBy: 'สมหญิง พยาบาล'
  },
  {
    id: 'TX006',
    type: 'DISPENSING',
    drugCode: 'IBU001',
    drugName: 'Ibuprofen 400mg',
    quantity: -10,
    unit: 'เม็ด',
    reference: 'จ่ายให้ผู้ป่วย HN12345',
    createdAt: '2024-01-19T14:30:00',
    createdBy: 'สมหญิง พยาบาล'
  },
  {
    id: 'TX007',
    type: 'DISPENSING',
    drugCode: 'PAR001',
    drugName: 'Paracetamol 500mg',
    quantity: -20,
    unit: 'เม็ด',
    reference: 'จ่ายให้ผู้ป่วย HN67890',
    createdAt: '2024-01-19T15:00:00',
    createdBy: 'สมหญิง พยาบาล'
  },
  {
    id: 'TX008',
    type: 'ADJUSTMENT',
    drugCode: 'IBU001',
    drugName: 'Ibuprofen 400mg',
    quantity: -5,
    unit: 'เม็ด',
    reference: 'ยาหมดอายุ',
    createdAt: '2024-01-18T16:00:00',
    createdBy: 'สมหญิง พยาบาล'
  }
]

// API-like functions
export const fetchDashboardData = async (department: 'PHARMACY' | 'OPD') => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  if (department === 'PHARMACY') {
    return {
      stocks: getMockPharmacyStocks(),
      transfers: getMockTransfers(),
      transactions: getMockPharmacyTransactions()
    }
  } else {
    return {
      stocks: getMockOPDStocks(),
      transfers: getMockTransfers(),
      transactions: getMockOPDTransactions()
    }
  }
}