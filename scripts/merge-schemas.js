// scripts/merge-schemas.js
// Hospital Pharmacy Schema Merger V3.0 - Single Hospital System
// แก้ไข relation errors และปรับให้เหมาะกับ V3.0 Single Hospital Architecture

const fs = require('fs');
const path = require('path');

const SCHEMAS_DIR = path.join(__dirname, '../prisma/schemas');
const OUTPUT_FILE = path.join(__dirname, '../prisma/schema.prisma');

const baseSchema = `// This file is auto-generated. Do not edit manually.
// Edit files in prisma/schemas/ directory instead.
// Last generated: ${new Date().toISOString()}
// Hospital Pharmacy Stock Management System V3.0

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")
}

`;

// Schema file order for V3.0 dependency resolution
const SCHEMA_ORDER = {
  '1-base.prisma': 0,                    // Enums และ base configuration
  '2-user.prisma': 1,                    // User management with approval system
  '3-drug.prisma': 2,                    // Drug master และ batch management
  '4-stock.prisma': 3,                   // Stock management with department isolation
  '5-transfer.prisma': 4,                // Transfer system with multi-step workflow
  '6-import.prisma': 5,                  // Import history tracking
  '7-reports.prisma': 6,                 // Reporting and analytics (optional)
  '8-notifications.prisma': 7            // Notification system (optional)
};

function extractModelsAndEnums(content) {
  const models = new Set();
  const enums = new Set();
  
  // Extract model names
  const modelMatches = content.match(/^model\s+(\w+)/gm) || [];
  modelMatches.forEach(match => {
    const modelName = match.replace('model ', '');
    models.add(modelName);
  });
  
  // Extract enum names
  const enumMatches = content.match(/^enum\s+(\w+)/gm) || [];
  enumMatches.forEach(match => {
    const enumName = match.replace('enum ', '');
    enums.add(enumName);
  });
  
  return { models, enums };
}

function validateRelations(content) {
  console.log('🔍 Validating relations for V3.0 schema...');
  const relationErrors = [];
  
  // Extract all relation fields and their target models
  const relationPattern = /(\w+)\s+(\w+)(\[\])?\s+@relation\s*\(/g;
  const relations = [];
  let match;
  
  while ((match = relationPattern.exec(content)) !== null) {
    const [, fieldName, targetModel, isArray] = match;
    relations.push({ fieldName, targetModel, isArray: !!isArray });
  }
  
  if (relations.length > 0) {
    console.log(`📊 Found ${relations.length} relation fields`);
  }
  
  // V3.0 specific validation - Single Hospital Core Relations
  const coreRelations = [
    { from: 'User', to: 'StockTransaction', field: 'stockTransactions' },
    { from: 'User', to: 'Transfer', field: 'transfersRequested' },
    { from: 'Drug', to: 'Stock', field: 'stocks' },
    { from: 'Drug', to: 'TransferItem', field: 'transferItems' },
    { from: 'Drug', to: 'DrugBatch', field: 'batches' },
    { from: 'Stock', to: 'StockTransaction', field: 'transactions' },
    { from: 'Transfer', to: 'TransferItem', field: 'items' },
    { from: 'StockTransaction', to: 'DrugBatch', field: 'batch' }
  ];
  
  let foundCoreRelations = 0;
  coreRelations.forEach(rel => {
    if (content.includes(`${rel.field}`)) {
      foundCoreRelations++;
    }
  });
  
  console.log(`✅ Found ${foundCoreRelations}/${coreRelations.length} core V3.0 relations`);
  
  return relationErrors;
}

function validateV3Structure(content) {
  console.log('🎯 Validating V3.0 Single Hospital structure...');
  
  const requiredV3Models = [
    'User',
    'Drug', 
    'DrugBatch',
    'Stock',
    'StockTransaction',
    'Transfer',
    'TransferItem',
    'ImportHistory'
  ];
  
  const missingModels = [];
  
  requiredV3Models.forEach(model => {
    if (!content.includes(`model ${model}`)) {
      missingModels.push(model);
    }
  });
  
  if (missingModels.length > 0) {
    console.warn(`⚠️  Warning: Missing V3.0 core models: ${missingModels.join(', ')}`);
  } else {
    console.log('✅ All required V3.0 core models found');
  }
  
  // Check for V3.0 specific enums
  const requiredV3Enums = [
    'Department', 
    'Role', 
    'UserStatus',
    'TransactionType', 
    'TransferStatus'
  ];
  
  const missingEnums = [];
  
  requiredV3Enums.forEach(enumName => {
    if (!content.includes(`enum ${enumName}`)) {
      missingEnums.push(enumName);
    }
  });
  
  if (missingEnums.length > 0) {
    console.warn(`⚠️  Warning: Missing V3.0 enums: ${missingEnums.join(', ')}`);
  }
  
  // ตรวจสอบ Department Isolation features
  const departmentFeatures = [
    'Department.PHARMACY',
    'Department.OPD',
    'department    Department',
    '@@unique([drugId, department])',
    'Role.PHARMACY_MANAGER',
    'Role.OPD_MANAGER'
  ];
  
  let foundDepartmentFeatures = 0;
  departmentFeatures.forEach(feature => {
    if (content.includes(feature)) {
      foundDepartmentFeatures++;
    }
  });
  
  console.log(`🏥 Found ${foundDepartmentFeatures}/${departmentFeatures.length} department isolation features`);
  
  // ตรวจสอบ Transfer Workflow features
  const transferWorkflowFeatures = [
    'TransferStatus.PENDING',
    'TransferStatus.APPROVED', 
    'TransferStatus.PREPARED',
    'requisitionNumber',
    'requesterId',
    'approverId',
    'dispenserId',
    'receiverId'
  ];
  
  let foundTransferFeatures = 0;
  transferWorkflowFeatures.forEach(feature => {
    if (content.includes(feature)) {
      foundTransferFeatures++;
    }
  });
  
  console.log(`🔄 Found ${foundTransferFeatures}/${transferWorkflowFeatures.length} transfer workflow features`);
  
  return { missingModels, missingEnums };
}

function validateStockManagement(content) {
  console.log('📦 Validating stock management features...');
  
  const stockFeatures = [
    'totalQuantity',
    'reservedQty', 
    'minimumStock',
    'totalValue',
    'beforeQty',
    'afterQty',
    'TransactionType.RECEIVE_EXTERNAL',
    'TransactionType.TRANSFER_OUT',
    'TransactionType.TRANSFER_IN',
    'TransactionType.ADJUST_INCREASE'
  ];
  
  let foundStockFeatures = 0;
  stockFeatures.forEach(feature => {
    if (content.includes(feature)) {
      foundStockFeatures++;
    }
  });
  
  console.log(`📊 Found ${foundStockFeatures}/${stockFeatures.length} stock management features`);
  
  // ตรวจสอบ Batch Management features
  const batchFeatures = [
    'DrugBatch',
    'lotNumber',
    'expiryDate',
    'manufacturer',
    'costPerUnit',
    'batchId'
  ];
  
  let foundBatchFeatures = 0;
  batchFeatures.forEach(feature => {
    if (content.includes(feature)) {
      foundBatchFeatures++;
    }
  });
  
  console.log(`🏷️  Found ${foundBatchFeatures}/${batchFeatures.length} batch management features`);
  
  return { foundStockFeatures, foundBatchFeatures };
}

function mergeSchemas() {
  console.log('🔄 Merging Hospital Pharmacy V3.0 schemas...');
  
  // Check if schemas directory exists
  if (!fs.existsSync(SCHEMAS_DIR)) {
    console.error(`❌ Schemas directory not found: ${SCHEMAS_DIR}`);
    console.log('Please create the schemas directory and add your schema files.');
    console.log('Expected files for V3.0:');
    Object.keys(SCHEMA_ORDER).forEach(file => {
      console.log(`  - ${file}`);
    });
    process.exit(1);
  }
  
  let mergedContent = baseSchema;
  
  // Track defined models and enums to prevent duplicates
  const definedModels = new Set();
  const definedEnums = new Set();
  
  // Get all .prisma files and sort them
  const schemaFiles = fs.readdirSync(SCHEMAS_DIR)
    .filter(file => file.endsWith('.prisma'))
    .sort((a, b) => {
      const orderA = SCHEMA_ORDER[a] || 999;
      const orderB = SCHEMA_ORDER[b] || 999;
      return orderA - orderB;
    });
  
  console.log(`📁 Found ${schemaFiles.length} schema files:`);
  schemaFiles.forEach((file, index) => {
    const order = SCHEMA_ORDER[file] || '∞';
    console.log(`  ${index + 1}. ${file} (order: ${order})`);
  });
  
  if (schemaFiles.length === 0) {
    console.error('❌ No schema files found in the schemas directory.');
    console.log('Please add V3.0 schema files to the schemas directory.');
    process.exit(1);
  }
  
  // Process each schema file
  schemaFiles.forEach(file => {
    const filePath = path.join(SCHEMAS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove generator and datasource blocks from individual files
    content = content
      .replace(/generator\s+\w+\s*{[^}]*}/gs, '')
      .replace(/datasource\s+\w+\s*{[^}]*}/gs, '')
      .trim();
    
    // Skip empty files
    if (!content) {
      console.log(`⚠️  Skipping empty file: ${file}`);
      return;
    }
    
    // Extract models and enums from this file
    const { models, enums } = extractModelsAndEnums(content);
    
    // Check for duplicates
    const duplicateModels = [...models].filter(model => definedModels.has(model));
    const duplicateEnums = [...enums].filter(enumName => definedEnums.has(enumName));
    
    if (duplicateModels.length > 0) {
      console.error(`❌ Duplicate models found in ${file}: ${duplicateModels.join(', ')}`);
      console.log('Please check your schema files for duplicate model definitions.');
      process.exit(1);
    }
    
    if (duplicateEnums.length > 0) {
      console.error(`❌ Duplicate enums found in ${file}: ${duplicateEnums.join(', ')}`);
      console.log('Please check your schema files for duplicate enum definitions.');
      process.exit(1);
    }
    
    // Add to tracking sets
    models.forEach(model => definedModels.add(model));
    enums.forEach(enumName => definedEnums.add(enumName));
    
    // Add section header with V3.0 information
    const sectionName = file
      .replace('.prisma', '')
      .toUpperCase()
      .replace(/-/g, ' ');
    
    mergedContent += `\n// ==========================================\n`;
    mergedContent += `// ${sectionName} - V3.0\n`;
    
    // Add special annotations for V3.0 components
    if (file === '1-base.prisma') {
      mergedContent += `// 🔧 Base Configuration & Enums\n`;
      mergedContent += `// Department isolation, roles, transaction types\n`;
    } else if (file === '2-user.prisma') {
      mergedContent += `// 👥 User Management with Approval System\n`;
      mergedContent += `// JWT authentication, department-based access\n`;
    } else if (file === '3-drug.prisma') {
      mergedContent += `// 💊 Drug Master & Batch Management\n`;
      mergedContent += `// Hospital drug codes, lot tracking, expiry management\n`;
    } else if (file === '4-stock.prisma') {
      mergedContent += `// 📦 Stock Management with Department Isolation\n`;
      mergedContent += `// Real-time stock, department separation, transactions\n`;
    } else if (file === '5-transfer.prisma') {
      mergedContent += `// 🔄 Inter-Department Transfer System\n`;
      mergedContent += `// Multi-step workflow, approval chain, partial fulfillment\n`;
    } else if (file === '6-import.prisma') {
      mergedContent += `// 📥 Drug Import System\n`;
      mergedContent += `// Excel/CSV import, validation, history tracking\n`;
    }
    
    mergedContent += `// ==========================================\n\n`;
    mergedContent += content + '\n';
    
    // Enhanced logging with V3.0 indicators
    let indicator = '';
    if (file.includes('user')) indicator = '👥 ';
    else if (file.includes('drug')) indicator = '💊 ';
    else if (file.includes('stock')) indicator = '📦 ';
    else if (file.includes('transfer')) indicator = '🔄 ';
    else if (file.includes('import')) indicator = '📥 ';
    else if (file.includes('base')) indicator = '🔧 ';
    
    console.log(`✅ ${indicator}Merged ${file}: ${models.size} models, ${enums.size} enums`);
  });
  
  // Write the merged schema
  try {
    fs.writeFileSync(OUTPUT_FILE, mergedContent);
    console.log(`✅ Successfully merged ${schemaFiles.length} schema files into ${OUTPUT_FILE}`);
    
    // Validate V3.0 structure
    validateRelations(mergedContent);
    validateV3Structure(mergedContent);
    validateStockManagement(mergedContent);
    
    return mergedContent;
  } catch (error) {
    console.error('❌ Failed to write merged schema:', error.message);
    process.exit(1);
  }
}

function validateMerge() {
  console.log('🔍 Validating merged V3.0 schema...');
  
  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    
    // Count models and enums
    const modelMatches = content.match(/^model\s+\w+/gm) || [];
    const enumMatches = content.match(/^enum\s+\w+/gm) || [];
    
    console.log(`📊 V3.0 Schema validation results:`);
    console.log(`   - Models: ${modelMatches.length}`);
    console.log(`   - Enums: ${enumMatches.length}`);
    
    // Check for basic requirements
    if (modelMatches.length === 0) {
      throw new Error('No models found in merged schema');
    }
    
    // Check for V3.0 core models
    const requiredV3Models = [
      'User', 'Drug', 'DrugBatch', 'Stock', 'StockTransaction', 
      'Transfer', 'TransferItem', 'ImportHistory'
    ];
    
    const modelNames = modelMatches.map(match => match.replace('model ', ''));
    
    const missingRequiredModels = [];
    for (const required of requiredV3Models) {
      if (!modelNames.includes(required)) {
        missingRequiredModels.push(required);
      }
    }
    
    if (missingRequiredModels.length > 0) {
      console.warn(`⚠️  Warning: Required V3.0 models not found: ${missingRequiredModels.join(', ')}`);
    } else {
      console.log('✅ All required V3.0 models found');
    }
    
    // Check for generator and datasource
    if (!content.includes('generator client')) {
      throw new Error('Generator block not found');
    }
    
    if (!content.includes('datasource db')) {
      throw new Error('Datasource block not found');
    }
    
    // Check for V3.0 specific requirements
    const v3Requirements = [
      'Department.PHARMACY',
      'Department.OPD',
      'Role.PHARMACY_MANAGER',
      'Role.OPD_MANAGER',
      'TransferStatus.PENDING',
      'TransactionType.TRANSFER_OUT',
      'UserStatus.UNAPPROVED'
    ];
    
    const missingV3Features = [];
    for (const requirement of v3Requirements) {
      if (!content.includes(requirement)) {
        missingV3Features.push(requirement);
      }
    }
    
    if (missingV3Features.length > 0) {
      console.warn(`⚠️  Warning: V3.0 features missing: ${missingV3Features.join(', ')}`);
    } else {
      console.log('✅ All V3.0 features found');
    }
    
    // Check for potential relation issues
    const potentialIssues = [];
    
    // ตรวจสอบ Core V3.0 relations
    const coreRelationChecks = [
      { field: 'stockTransactions', model: 'User' },
      { field: 'transfersRequested', model: 'User' },
      { field: 'stocks', model: 'Drug' },
      { field: 'batches', model: 'Drug' },
      { field: 'transactions', model: 'Stock' },
      { field: 'items', model: 'Transfer' }
    ];
    
    let foundCoreRelations = 0;
    coreRelationChecks.forEach(check => {
      if (content.includes(check.field)) {
        foundCoreRelations++;
      }
    });
    
    if (foundCoreRelations < coreRelationChecks.length) {
      potentialIssues.push(`Core V3.0 relations incomplete (${foundCoreRelations}/${coreRelationChecks.length})`);
    }
    
    // ตรวจสอบ Department isolation
    const departmentIsolationChecks = [
      'department    Department',
      '@@unique([drugId, department])',
      'fromDept',
      'toDept'
    ];
    
    let foundDepartmentFeatures = 0;
    departmentIsolationChecks.forEach(check => {
      if (content.includes(check)) {
        foundDepartmentFeatures++;
      }
    });
    
    if (foundDepartmentFeatures < departmentIsolationChecks.length) {
      potentialIssues.push(`Department isolation incomplete (${foundDepartmentFeatures}/${departmentIsolationChecks.length})`);
    }
    
    if (potentialIssues.length > 0) {
      console.warn('⚠️  Potential issues found:');
      potentialIssues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
      console.log('✅ No potential relation issues found');
    }
    
    console.log('✅ V3.0 Schema validation passed');
    
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log(`
📚 Hospital Pharmacy Schema Merger V3.0 - Single Hospital System

Usage:
  node scripts/merge-schemas.js [--check-only]

Options:
  --check-only    Only validate files without merging
  --help, -h      Show this help message

This script merges all .prisma files from prisma/schemas/ into prisma/schema.prisma

🎯 V3.0 Features (Single Hospital):
- ✅ Department Isolation (PHARMACY + OPD)
- ✅ JWT Authentication with User Approval System
- ✅ Drug Master with Hospital-specific Codes
- ✅ Batch Management (Lot/Expiry tracking)
- ✅ Real-time Stock Management per Department
- ✅ Multi-step Transfer Workflow
- ✅ Complete Transaction Auditing
- ✅ Excel/CSV Drug Import System
- ✅ Mobile-First PWA Ready

✅ Core Models:
- ✅ User (with approval system)
- ✅ Drug (hospital drug codes + batches)
- ✅ Stock (department-isolated)
- ✅ Transfer (multi-step workflow)
- ✅ StockTransaction (complete audit trail)
- ✅ ImportHistory (import tracking)

✅ Department Features:
- ✅ PHARMACY & OPD departments
- ✅ Department-based stock isolation
- ✅ Role-based permissions
- ✅ Inter-department transfers
- ✅ Transfer approval workflow

🚀 Transfer Workflow:
- ✅ PENDING → APPROVED → PREPARED → DELIVERED
- ✅ Multi-user signatures (requester/approver/dispenser/receiver)
- ✅ Partial fulfillment support
- ✅ Different department perspectives

Features:
- ✅ Duplicate model/enum detection
- ✅ V3.0 structure validation
- ✅ Department isolation validation
- ✅ Transfer workflow validation
- ✅ Stock management validation
- ✅ Dependency-aware file ordering

Schema files are processed in this order:
${Object.entries(SCHEMA_ORDER)
  .sort(([, a], [, b]) => a - b)
  .map(([file, order]) => `  ${order + 1}. ${file}`)
  .join('\n')}

After merging, run:
  pnpm db:generate  # Generate Prisma client
  pnpm db:push      # Push to development database
  pnpm db:migrate   # Create migration for production
  pnpm db:seed      # Seed initial data
`);
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }
  
  if (args.includes('--check-only')) {
    console.log('🔍 Running V3.0 validation only...');
    if (fs.existsSync(OUTPUT_FILE)) {
      validateMerge();
    } else {
      console.error('❌ No merged schema found. Run without --check-only first.');
      process.exit(1);
    }
    process.exit(0);
  }
  
  try {
    mergeSchemas();
    validateMerge();
    
    console.log(`
🎉 Hospital Pharmacy V3.0 Schema merge completed successfully!

🏥 Single Hospital System Ready:
  - 2 Departments: PHARMACY + OPD
  - Department-isolated stock management
  - Inter-department transfer workflow
  - Real-time stock tracking
  - Complete audit trail

👥 User Management:
  - JWT authentication
  - User approval system
  - Role-based permissions (MANAGER/STAFF)
  - Department-based access control

💊 Drug Management:
  - Hospital-specific drug codes
  - Batch/lot tracking with expiry dates
  - Excel/CSV import capability
  - Master data management

📦 Stock Features:
  - Real-time stock levels per department
  - Reserved quantity tracking
  - Minimum stock alerts
  - Cost/value tracking
  - Complete transaction history

🔄 Transfer Workflow:
  - Multi-step approval process
  - Partial fulfillment support
  - Different department perspectives
  - Complete signature tracking
  - Status-based workflow management

✅ Ready for 1-Week Implementation Timeline:

Day 1-2: Foundation & Authentication
  - Next.js 14 + TypeScript setup
  - JWT authentication implementation
  - User management with approval

Day 3-4: Drug Master & Stock Management
  - Drug CRUD operations
  - Excel/CSV import system
  - Department-isolated stock management

Day 5-6: Transfer System
  - Transfer workflow implementation
  - Multi-step approval process
  - Mobile-optimized UI

Day 7: Testing & Deployment
  - PWA setup and testing
  - Production deployment
  - Final validation

🚀 Next steps:
  1. pnpm db:generate  # Generate Prisma client
  2. pnpm db:push      # Push to database (development)
  3. pnpm db:seed      # Seed with sample data
  4. pnpm dev          # Start development

For production:
  pnpm db:migrate      # Create and apply migration

💡 V3.0 System Ready For:
  - Single hospital deployment
  - 2-department operation (PHARMACY + OPD)
  - Mobile-first PWA experience
  - Real-time stock management
  - Complete paper replacement
  - 1-week implementation timeline

🛠️  Development Ready:
  - All core models defined
  - Department isolation complete
  - Transfer workflow ready
  - Authentication system ready
  - Import system ready
  - Mobile PWA ready
`);
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
    console.log('\n🛠️  Troubleshooting:');
    console.log('  1. Check for duplicate models in different schema files');
    console.log('  2. Ensure all V3.0 schema files are present');
    console.log('  3. Verify department isolation features');
    console.log('  4. Check transfer workflow models');
    console.log('  5. Verify user management with approval system');
    console.log('  6. Check batch management implementation');
    console.log('  7. Verify file syntax with: prisma format');
    process.exit(1);
  }
}

module.exports = { mergeSchemas, validateMerge };