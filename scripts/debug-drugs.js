// scripts/debug-drugs.js - ตรวจสอบยาที่หายไปใน database
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMissingDrugs() {
  console.log('🔍 Debugging Missing Drugs - Hospital Pharmacy V3.0');
  console.log('==================================================');

  try {
    // 1. อ่านข้อมูลจาก CSV
    console.log('📁 Reading CSV file...');
    const csvData = await loadCSVData();
    console.log(`📊 CSV contains: ${csvData.length} drugs`);

    // 2. ตรวจสอบข้อมูลใน database  
    console.log('\n💾 Checking database...');
    const dbDrugs = await prisma.drug.findMany({
      select: {
        hospitalDrugCode: true,
        name: true,
        isActive: true
      },
      orderBy: {
        hospitalDrugCode: 'asc'
      }
    });
    console.log(`💊 Database contains: ${dbDrugs.length} drugs`);

    // 3. สร้าง Set สำหรับเปรียบเทียบ
    const csvCodes = new Set(csvData.map(drug => drug.hospitalDrugCode));
    const dbCodes = new Set(dbDrugs.map(drug => drug.hospitalDrugCode));

    // 4. หายาที่อยู่ใน CSV แต่ไม่อยู่ใน DB
    const missingInDB = csvData.filter(drug => !dbCodes.has(drug.hospitalDrugCode));
    const extraInDB = dbDrugs.filter(drug => !csvCodes.has(drug.hospitalDrugCode));

    console.log('\n🔍 ANALYSIS RESULTS:');
    console.log('==================');
    
    if (missingInDB.length > 0) {
      console.log(`\n❌ Missing in Database (${missingInDB.length} drugs):`);
      missingInDB.forEach((drug, index) => {
        console.log(`  ${index + 1}. Code: "${drug.hospitalDrugCode}" | Name: "${drug.name}"`);
        console.log(`      Generic: "${drug.genericName}" | Form: "${drug.dosageForm}"`);
        console.log(`      Strength: "${drug.strength}" | Unit: "${drug.unit}"`);
        console.log(`      Package: "${drug.packageSize}" | Price: ${drug.pricePerBox}`);
        console.log(`      Notes: "${drug.notes}"`);
        console.log('      ---');
      });
    }

    if (extraInDB.length > 0) {
      console.log(`\n➕ Extra in Database (${extraInDB.length} drugs):`);
      extraInDB.forEach((drug, index) => {
        console.log(`  ${index + 1}. Code: "${drug.hospitalDrugCode}" | Name: "${drug.name}"`);
      });
    }

    // 5. ตรวจสอบ duplicate codes ใน CSV
    console.log('\n🔄 Checking for duplicates in CSV...');
    const duplicates = findDuplicateCodes(csvData);
    if (duplicates.length > 0) {
      console.log(`❌ Found ${duplicates.length} duplicate codes in CSV:`);
      duplicates.forEach(dup => {
        console.log(`  Code: "${dup.code}" appears ${dup.count} times`);
        dup.entries.forEach((entry, idx) => {
          console.log(`    ${idx + 1}. Name: "${entry.name}" | Line: ${entry.lineNumber}`);
        });
      });
    } else {
      console.log('✅ No duplicates found in CSV');
    }

    // 6. ตรวจสอบ empty/invalid codes
    console.log('\n🔍 Checking for invalid codes in CSV...');
    const invalidCodes = csvData.filter(drug => 
      !drug.hospitalDrugCode || 
      drug.hospitalDrugCode.trim() === '' ||
      drug.hospitalDrugCode.startsWith('AUTO_')
    );
    
    if (invalidCodes.length > 0) {
      console.log(`❌ Found ${invalidCodes.length} invalid codes:`);
      invalidCodes.forEach((drug, index) => {
        console.log(`  ${index + 1}. Code: "${drug.hospitalDrugCode}" | Name: "${drug.name}"`);
      });
    } else {
      console.log('✅ All codes are valid');
    }

    // 7. สรุปผลการวิเคราะห์
    console.log('\n📋 SUMMARY:');
    console.log('==========');
    console.log(`CSV File: ${csvData.length} drugs`);
    console.log(`Database: ${dbDrugs.length} drugs`);
    console.log(`Missing: ${missingInDB.length} drugs`);
    console.log(`Extra: ${extraInDB.length} drugs`);
    console.log(`Duplicates: ${duplicates.length} codes`);
    console.log(`Invalid: ${invalidCodes.length} codes`);

    // 8. แนะนำการแก้ไข
    if (missingInDB.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. Check for data validation errors during import');
      console.log('2. Look for special characters in drug codes');
      console.log('3. Check for transaction rollbacks due to foreign key errors');
      console.log('4. Verify CSV encoding (should be UTF-8)');
      console.log('5. Check for length limits on varchar fields');
      
      console.log('\n🔧 To fix manually, you can run:');
      console.log('1. npm run db:seed (to retry import)');
      console.log('2. Or add missing drugs manually using the codes above');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function loadCSVData() {
  const csvPaths = [
    path.join(process.cwd(), 'data', 'realDrug.csv'),
    path.join(process.cwd(), 'data/realDrug.csv'),
    path.join(process.cwd(), 'รายการยา  CSV export 3.csv'),
  ];

  let csvContent = '';
  for (const csvPath of csvPaths) {
    try {
      if (fs.existsSync(csvPath)) {
        csvContent = fs.readFileSync(csvPath, 'utf8');
        console.log(`📁 Found CSV: ${csvPath}`);
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!csvContent) {
    throw new Error('CSV file not found');
  }

  // Parse CSV
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const drugs = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      
      if (values.length < headers.length) {
        while (values.length < headers.length) {
          values.push('');
        }
      }

      const drugData = {};
      headers.forEach((header, index) => {
        drugData[header] = values[index] || '';
      });

      const drug = {
        hospitalDrugCode: String(drugData.hospitalDrugCode || `AUTO_${i}`),
        name: String(drugData.name || `Drug ${i}`),
        genericName: String(drugData.genericName || drugData.name || `Generic ${i}`),
        dosageForm: String(drugData.dosageForm || 'TAB'),
        strength: String(drugData.strength || ''),
        unit: String(drugData.unit || ''),
        packageSize: String(drugData.packageSize || '100'),
        pricePerBox: Number(drugData.pricePerBox) || 100,
        category: String(drugData.category || 'GENERAL'),
        notes: String(drugData.notes || ''),
        lineNumber: i + 1 // เก็บ line number สำหรับ debug
      };

      drugs.push(drug);
    } catch (error) {
      console.warn(`⚠️  Error parsing line ${i + 1}: ${error.message}`);
    }
  }

  return drugs;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result.map(val => val.replace(/^"|"$/g, ''));
}

function findDuplicateCodes(drugs) {
  const codeCount = {};
  const duplicates = [];

  // นับจำนวนแต่ละ code
  drugs.forEach((drug, index) => {
    const code = drug.hospitalDrugCode;
    if (!codeCount[code]) {
      codeCount[code] = [];
    }
    codeCount[code].push({
      ...drug,
      arrayIndex: index
    });
  });

  // หา codes ที่ซ้ำ
  Object.entries(codeCount).forEach(([code, entries]) => {
    if (entries.length > 1) {
      duplicates.push({
        code,
        count: entries.length,
        entries
      });
    }
  });

  return duplicates;
}

// เรียกใช้งาน
debugMissingDrugs();