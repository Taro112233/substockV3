// scripts/merge-schemas.js - Improved Version
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
}

`;

function mergeSchemas() {
  console.log('🔄 Merging Hospital Pharmacy V3.0 schemas...');
  
  if (!fs.existsSync(SCHEMAS_DIR)) {
    console.error(`❌ Schemas directory not found: ${SCHEMAS_DIR}`);
    process.exit(1);
  }
  
  let mergedContent = baseSchema;
  
  // Get all .prisma files
  const schemaFiles = fs.readdirSync(SCHEMAS_DIR)
    .filter(file => file.endsWith('.prisma'))
    .sort();
  
  console.log(`📁 Found ${schemaFiles.length} schema files:`);
  schemaFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
  // Process each schema file
  schemaFiles.forEach(file => {
    const filePath = path.join(SCHEMAS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove generator and datasource blocks
    content = content
      .replace(/generator\s+\w+\s*{[^}]*}/gs, '')
      .replace(/datasource\s+\w+\s*{[^}]*}/gs, '')
      .trim();
    
    if (!content) {
      console.log(`⚠️  Skipping empty file: ${file}`);
      return;
    }
    
    // Add section header
    const sectionName = file.replace('.prisma', '').toUpperCase();
    mergedContent += `\n// ==========================================\n`;
    mergedContent += `// ${sectionName} - V3.0\n`;
    mergedContent += `// ==========================================\n\n`;
    mergedContent += content + '\n';
    
    console.log(`✅ Merged ${file}`);
  });
  
  try {
    fs.writeFileSync(OUTPUT_FILE, mergedContent);
    console.log(`✅ Successfully merged into ${OUTPUT_FILE}`);
    return mergedContent;
  } catch (error) {
    console.error('❌ Failed to write merged schema:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  mergeSchemas();
}

module.exports = { mergeSchemas };