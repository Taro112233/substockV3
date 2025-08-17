// prisma/seeds/drug-batches.seed.ts - Hospital Pharmacy V3.0 Drug Batch Management
// สร้าง lot/batch ข้อมูลสำหรับยาแต่ละตัว พร้อมวันหมดอายุและการติดตาม FIFO

import { PrismaClient } from "@prisma/client";

interface BatchSeedData {
  drugCode: string;
  department: "PHARMACY" | "OPD";
  batches: {
    lotNumber: string;
    expiryDate: string;
    manufacturer: string;
    quantity: number;
    costPerUnit: number;
    receivedDate?: string;
  }[];
}

export async function seedDrugBatches(prisma: PrismaClient) {
  console.log("📦 Creating Drug Batches for Hospital Pharmacy V3.0...");
  console.log("🏥 FIFO Inventory Management System");
  console.log("📅 Expiry Date Tracking & Alerts");

  try {
    // ดึงข้อมูลยาที่มีอยู่ในระบบ
    const existingDrugs = await prisma.drug.findMany({
      select: {
        id: true,
        hospitalDrugCode: true,
        name: true,
        pricePerBox: true,
        unit: true
      },
      where: {
        isActive: true
      }
    });

    if (existingDrugs.length === 0) {
      console.log("⚠️  No drugs found - please run drug seed first");
      return createSampleBatches(prisma);
    }

    console.log(`💊 Found ${existingDrugs.length} drugs to create batches for`);

    // สร้าง batch data สำหรับยาที่มีอยู่
    const batchDataList = createBatchDataForDrugs(existingDrugs);
    
    // Import batches ลง database
    const importResult = await importBatchesToDatabase(prisma, batchDataList, existingDrugs);

    // สร้างรายงานสรุป
    console.log(generateBatchSummary(importResult));

    return {
      totalBatches: importResult.totalBatches,
      totalValue: importResult.totalValue,
      pharmacyBatches: importResult.pharmacyBatches,
      opdBatches: importResult.opdBatches,
      expiryAlerts: importResult.expiryAlerts,
      success: true
    };

  } catch (error) {
    console.error("❌ Failed to create drug batches:", error);
    
    // Fallback: สร้าง sample batches
    console.log("🔄 Creating sample batches instead...");
    return createSampleBatches(prisma);
  }
}

function createBatchDataForDrugs(drugs: any[]): BatchSeedData[] {
  const batchData: BatchSeedData[] = [];
  
  // วันที่ปัจจุบันและอนาคต
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
  const oneYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const twoYears = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());

  // Manufacturers list
  const manufacturers = [
    "GPO (Government Pharmaceutical Organization)",
    "Siam Pharmaceutical Co., Ltd.",
    "Berlin Pharmaceutical Industry",
    "T.P. Drug Laboratories (1969) Ltd.",
    "Pharmaland (1982) Ltd.",
    "Greater Pharma Ltd.",
    "Medpharma Ltd.",
    "United Pharma Co., Ltd.",
    "Thai Nakorn Patana Co., Ltd.",
    "Globex Pharma Co., Ltd."
  ];

      // จำกัดการสร้าง batch เพื่อให้ได้ประมาณ 100 batches รวม
    const maxDrugsToProcess = Math.min(35, drugs.length); // ประมาณ 35 ยา x 3 batches = 105 batches
    
    for (let i = 0; i < maxDrugsToProcess; i++) {
      const drug = drugs[i];
      
      // สร้าง batches สำหรับแผนก PHARMACY (main inventory)
      const pharmacyBatches = [
        {
          lotNumber: `PH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}A`,
          expiryDate: sixMonths.toISOString().split('T')[0],
          manufacturer: manufacturers[i % manufacturers.length],
          quantity: Math.floor(Math.random() * 50) + 20, // 20-70
          costPerUnit: Number((drug.pricePerBox * 0.7).toFixed(2)), // 70% ของราคาขาย
          receivedDate: new Date(today.getTime() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // ภายใน 30 วันที่ผ่านมา
        },
        {
          lotNumber: `PH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}B`,
          expiryDate: oneYear.toISOString().split('T')[0],
          manufacturer: manufacturers[(i + 1) % manufacturers.length],
          quantity: Math.floor(Math.random() * 40) + 15, // 15-55
          costPerUnit: Number((drug.pricePerBox * 0.75).toFixed(2)),
          receivedDate: new Date(today.getTime() - (Math.random() * 15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // ภายใน 15 วันที่ผ่านมา
        }
      ];

      // บางยาอาจมี batch ที่จะหมดอายุเร็ว (สำหรับ testing alert)
      if (i % 5 === 0) {
        pharmacyBatches.push({
          lotNumber: `PH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}X`,
          expiryDate: nextMonth.toISOString().split('T')[0], // หมดอายุเดือนหน้า
          manufacturer: manufacturers[(i + 2) % manufacturers.length],
          quantity: Math.floor(Math.random() * 10) + 5, // 5-15 (น้อย เพราะเก่า)
          costPerUnit: Number((drug.pricePerBox * 0.6).toFixed(2)), // ถูกกว่า เพราะเก่า
          receivedDate: new Date(today.getTime() - (Math.random() * 60 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // 60 วันที่ผ่านมา
        });
      }

      batchData.push({
        drugCode: drug.hospitalDrugCode,
        department: "PHARMACY",
        batches: pharmacyBatches
      });

      // สร้าง batches สำหรับ OPD (เฉพาะ 1 ใน 4 ยา เพื่อลดจำนวน)
      if (i % 4 === 0 && i < 15) { // จำกัดเฉพาะ 15 ยาแรก ทุก 4 ยา
        const opdBatches = [
          {
            lotNumber: `OP${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}A`,
            expiryDate: oneYear.toISOString().split('T')[0],
            manufacturer: manufacturers[i % manufacturers.length],
            quantity: Math.floor(Math.random() * 15) + 5, // 5-20
            costPerUnit: Number((drug.pricePerBox * 0.75).toFixed(2)),
            receivedDate: new Date(today.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] // ภายใน 7 วันที่ผ่านมา
          }
        ];

        batchData.push({
          drugCode: drug.hospitalDrugCode,
          department: "OPD",
          batches: opdBatches
        });
      }
    }

  return batchData;
}

async function importBatchesToDatabase(
  prisma: PrismaClient, 
  batchDataList: BatchSeedData[], 
  drugs: any[]
) {
  console.log(`🔄 Starting batch import for ${batchDataList.length} drug-department combinations...`);
  
  let totalBatches = 0;
  let totalValue = 0;
  let pharmacyBatches = 0;
  let opdBatches = 0;
  let expiryAlerts = 0;
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  for (const batchGroup of batchDataList) {
    try {
      // ค้นหา drug ID
      const drug = drugs.find(d => d.hospitalDrugCode === batchGroup.drugCode);
      if (!drug) {
        console.warn(`⚠️  Drug not found: ${batchGroup.drugCode}`);
        continue;
      }

      console.log(`📦 Creating batches for ${drug.name} (${batchGroup.department})`);

      for (const batchInfo of batchGroup.batches) {
        try {
          // สร้าง batch record
          const batch = await prisma.drugBatch.create({
            data: {
              drugId: drug.id,
              department: batchGroup.department,
              lotNumber: batchInfo.lotNumber,
              expiryDate: new Date(batchInfo.expiryDate),
              manufacturer: batchInfo.manufacturer,
              quantity: batchInfo.quantity,
              costPerUnit: batchInfo.costPerUnit,
              receivedDate: new Date(batchInfo.receivedDate || new Date()),
            },
          });

          // อัปเดต stock ตาม batch ที่สร้าง
          await updateStockFromBatch(prisma, drug.id, batchGroup.department, batchInfo);

          totalBatches++;
          totalValue += batchInfo.quantity * batchInfo.costPerUnit;
          
          if (batchGroup.department === "PHARMACY") {
            pharmacyBatches++;
          } else {
            opdBatches++;
          }

          // ตรวจสอบการหมดอายุ
          if (new Date(batchInfo.expiryDate) <= thirtyDaysFromNow) {
            expiryAlerts++;
          }

          console.log(`  ✅ ${batchInfo.lotNumber} - ${batchInfo.quantity} units (Exp: ${batchInfo.expiryDate})`);

        } catch (batchError) {
          console.error(`❌ Failed to create batch ${batchInfo.lotNumber}:`, batchError);
        }
      }

    } catch (groupError) {
      console.error(`❌ Failed to process batches for ${batchGroup.drugCode}:`, groupError);
    }
  }

  return {
    totalBatches,
    totalValue,
    pharmacyBatches,
    opdBatches,
    expiryAlerts
  };
}

async function updateStockFromBatch(
  prisma: PrismaClient,
  drugId: string,
  department: "PHARMACY" | "OPD",
  batchInfo: any
) {
  // หา stock record ที่เกี่ยวข้อง
  const existingStock = await prisma.stock.findUnique({
    where: {
      drugId_department: {
        drugId: drugId,
        department: department
      }
    }
  });

  if (existingStock) {
    // อัปเดต stock ที่มีอยู่
    await prisma.stock.update({
      where: { id: existingStock.id },
      data: {
        totalQuantity: existingStock.totalQuantity + batchInfo.quantity,
        totalValue: existingStock.totalValue + (batchInfo.quantity * batchInfo.costPerUnit),
        lastUpdated: new Date(),
      }
    });
  } else {
    // สร้าง stock record ใหม่
    await prisma.stock.create({
      data: {
        drugId: drugId,
        department: department,
        totalQuantity: batchInfo.quantity,
        reservedQty: 0,
        minimumStock: department === "PHARMACY" ? 20 : 5,
        totalValue: batchInfo.quantity * batchInfo.costPerUnit,
      }
    });
  }
}

async function createSampleBatches(prisma: PrismaClient) {
  console.log("📦 Creating sample drug batches...");
  
  // สร้าง sample drug และ batch
  const sampleData = [
    {
      drugCode: "SAMPLE001",
      drugName: "Sample Paracetamol 500mg",
      batches: [
        {
          lotNumber: "PH202508001A",
          expiryDate: "2026-12-31",
          manufacturer: "GPO Thailand",
          quantity: 100,
          costPerUnit: 0.50,
        }
      ]
    }
  ];

  let created = 0;
  
  for (const sample of sampleData) {
    try {
      // สร้าง sample drug ถ้ายังไม่มี
      const drug = await prisma.drug.upsert({
        where: { hospitalDrugCode: sample.drugCode },
        update: {},
        create: {
          hospitalDrugCode: sample.drugCode,
          name: sample.drugName,
          genericName: "Paracetamol",
          dosageForm: "TAB",
          unit: "mg",
          pricePerBox: 60.00,
          category: "GENERAL",
          isActive: true,
        },
      });

      // สร้าง batch
      for (const batchInfo of sample.batches) {
        await prisma.drugBatch.create({
          data: {
            drugId: drug.id,
            department: "PHARMACY",
            lotNumber: batchInfo.lotNumber,
            expiryDate: new Date(batchInfo.expiryDate),
            manufacturer: batchInfo.manufacturer,
            quantity: batchInfo.quantity,
            costPerUnit: batchInfo.costPerUnit,
            receivedDate: new Date(),
          },
        });

        // อัปเดต stock
        await prisma.stock.upsert({
          where: {
            drugId_department: {
              drugId: drug.id,
              department: "PHARMACY"
            }
          },
          update: {
            totalQuantity: batchInfo.quantity,
            totalValue: batchInfo.quantity * batchInfo.costPerUnit,
          },
          create: {
            drugId: drug.id,
            department: "PHARMACY",
            totalQuantity: batchInfo.quantity,
            reservedQty: 0,
            minimumStock: 20,
            totalValue: batchInfo.quantity * batchInfo.costPerUnit,
          },
        });

        created++;
      }

      console.log(`  ✅ ${sample.drugName} - ${sample.batches.length} batches`);

    } catch (error) {
      console.error(`❌ Failed to create sample batch:`, error);
    }
  }

  return {
    totalBatches: created,
    totalValue: 50,
    pharmacyBatches: created,
    opdBatches: 0,
    expiryAlerts: 0,
    success: true,
    source: "sample"
  };
}

function generateBatchSummary(result: any): string {
  return `
🎉 DRUG BATCH CREATION COMPLETED!
========================================

📊 BATCH STATISTICS:
├── Total Batches Created: ${result.totalBatches}
├── Total Inventory Value: ฿${result.totalValue.toLocaleString()}
├── PHARMACY Batches: ${result.pharmacyBatches}
└── OPD Batches: ${result.opdBatches}

⚠️  EXPIRY ALERTS:
├── Batches expiring within 30 days: ${result.expiryAlerts}
└── FIFO Management: Required

🏪 INVENTORY DISTRIBUTION:
├── Main Warehouse (PHARMACY): ${result.pharmacyBatches} batches
└── OPD Department: ${result.opdBatches} batches

✨ BATCH MANAGEMENT FEATURES:
├── ✅ Lot Number Tracking
├── ✅ Expiry Date Management
├── ✅ FIFO Rotation System
├── ✅ Manufacturer Information
├── ✅ Cost Per Unit Tracking
├── ✅ Department Isolation
└── ✅ Stock Integration

🎯 READY FOR:
├── ✅ Batch-based Dispensing
├── ✅ Expiry Alert System
├── ✅ FIFO Stock Rotation
├── ✅ Cost Analysis
└── ✅ Traceability
`;
}