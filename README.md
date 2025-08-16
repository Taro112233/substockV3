# 📌 Project Instructions for Claude: Hospital Pharmacy Stock Management System V3.0

**Project Name:** Hospital Pharmacy Stock Management System  
**Owner:** Ai-Sat (Pharmacy Student & Developer)  
**Language Preference:** Respond in Thai (technical terms can remain in English)  
**Architecture:** Single-Hospital System with Next.js + Prisma + PWA  
**Version:** 3.0 (Simplified for Single Hospital Implementation)

## 🎯 Project Objective (V3.0)

พัฒนาระบบจัดการสต็อกยาโรงพยาบาลสำหรับ **โรงพยาบาลเดียว 2 แผนก** แทนที่ระบบกระดาษ 100% ภายใน **1 สัปดาห์** งบประมาณ **0 บาท**

**เป้าหมายหลัก:**
- แทนที่ระบบบัตรสต็อกกระดาษด้วยระบบดิจิทัล
- รองรับ 2 แผนก: คลังยา และ OPD
- ระบบเบิกจ่ายยาระหว่างแผนก
- แสดงสถานะสต็อกแบบเรียลไทม์แยกตามแผนก
- รองรับการ import ข้อมูลยาจาก Excel/CSV
- Mobile-first PWA application
- Production-ready system ใน 1 สัปดาห์

## 🏗️ System Architecture (V3.0)

### Single-Tenant Design
ใช้สถาปัตยกรรมโรงพยาบาลเดียว แยกข้อมูลระดับแผนก (Department-level separation) ผ่าน Prisma ORM ระบบจัดการผู้ใช้แยกตามแผนกและบทบาท โครงสร้างฐานข้อมูลที่เรียบง่ายแต่มีประสิทธิภาพ

### Technology Stack (Free Tier)
**Frontend/Backend:** Next.js 14+ พร้อม TypeScript สำหรับ type safety และประสิทธิภาพ  
**UI Framework:** TailwindCSS + Shadcn/UI สำหรับการออกแบบ mobile-first ที่สวยงาม  
**Backend API:** Next.js API Routes + Prisma ORM สำหรับการจัดการข้อมูลที่ปลอดภัย  
**Database:** PostgreSQL (Supabase Free) สำหรับความเสถียรและประสิทธิภาพ  
**Authentication:** JWT + bcryptjs สำหรับการจัดการการเข้าสู่ระบบที่ปลอดภัย  
**Mobile:** Progressive Web App (PWA) สำหรับ mobile experience และ offline capability  
**File Upload:** Built-in file handling สำหรับ drug data import  
**Hosting:** Vercel (Free) สำหรับ deployment รวดเร็วและเสถียร  
**Database ORM:** Prisma สำหรับ type-safe database operations

### Database Design Principles (Simplified)
ใช้สถาปัตยกรรม department-based separation ผ่าน department enum การออกแบบ schema แบบเรียบง่ายแต่ครอบคลุม การสร้าง index ที่เหมาะสมสำหรับ performance การบันทึก audit trail ที่จำเป็น ระบบ transaction tracking ที่สมบูรณ์

## 📊 Updated Database Schema (V3.0)

### Enhanced Schema with Complete Workflow
```prisma
// ===== USER MANAGEMENT WITH APPROVAL SYSTEM =====
model User {
  id          String     @id @default(cuid())
  username    String     @unique
  password    String     // bcrypt hashed
  firstName   String
  lastName    String
  position    String     // ตำแหน่งงาน
  department  Department
  role        Role
  status      UserStatus @default(UNAPPROVED)
  isActive    Boolean    @default(true)
  lastLogin   DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  // Relations
  stockTransactions     StockTransaction[]
  transfersRequested    Transfer[] @relation("RequesterUser")
  transfersApproved     Transfer[] @relation("ApproverUser")
  transfersDispensed    Transfer[] @relation("DispenserUser")
  transfersReceived     Transfer[] @relation("ReceiverUser")
  imports               ImportHistory[]
  
  @@index([department])
  @@index([status])
  @@index([username])
}

// ===== ENHANCED DRUG MODEL =====
model Drug {
  id              String   @id @default(cuid())
  hospitalDrugCode String  @unique // รหัสยาเฉพาะโรงพยาบาล
  name            String   // ชื่อยาทางการค้า
  genericName     String?  // ชื่อสามัญยา
  dosageForm      String   // รูปแบบยา (เม็ด, แคปซูล, ขวด, หลอด)
  strength        String?  // ความแรงยา (500mg, 250mg/5ml)
  unit            String   // หน่วยนับ (เม็ด, ขวด, หลอด, กล่อง)
  packageSize     String?  // ขนาดบรรจุ (1x100's, 1x500ml)
  pricePerBox     Float    @default(0) // ราคาต่อกล่อง/หน่วย
  category        String?  // หมวดหมู่ยา
  reorderPoint    Int      @default(10) // จุดสั่งซื้อใหม่
  isActive        Boolean  @default(true)
  importBatch     String?  // batch ที่ import เข้ามา
  notes           String?  // หมายเหตุเพิ่มเติม
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  stocks          Stock[]
  transferItems   TransferItem[]
  batches         DrugBatch[]
  
  @@index([hospitalDrugCode])
  @@index([name])
  @@index([category])
  @@index([isActive])
}

// ===== DRUG BATCH MANAGEMENT (LOT/EXPIRY) =====
model DrugBatch {
  id            String   @id @default(cuid())
  drugId        String
  department    Department
  lotNumber     String
  expiryDate    DateTime
  manufacturer  String?
  quantity      Int      @default(0)
  costPerUnit   Float    @default(0)
  receivedDate  DateTime @default(now())
  
  // Relations
  drug          Drug     @relation(fields: [drugId], references: [id])
  transactions  StockTransaction[]
  
  @@unique([drugId, department, lotNumber, expiryDate])
  @@index([expiryDate])
  @@index([department])
}

// ===== STOCK WITH BATCH TRACKING =====
model Stock {
  id            String     @id @default(cuid())
  drugId        String
  department    Department
  totalQuantity Int        @default(0) // รวมจากทุก batch
  reservedQty   Int        @default(0) // จำนวนที่จองไว้
  minimumStock  Int        @default(10) // minimum stock ของแผนกนั้น
  totalValue    Float      @default(0) // มูลค่ารวม
  lastUpdated   DateTime   @updatedAt
  
  // Relations
  drug          Drug               @relation(fields: [drugId], references: [id])
  transactions  StockTransaction[]
  
  @@unique([drugId, department])
  @@index([department])
  @@index([totalQuantity])
}

// ===== ENHANCED TRANSFER SYSTEM =====
model Transfer {
  id                String         @id @default(cuid())
  requisitionNumber String         @unique // เลขที่ใบเบิก (manual input)
  title             String         // ชื่อใบเบิก
  
  // Departments & Users
  fromDept          Department     // หน่วยงานที่ขอเบิก (ต้นทาง)
  toDept            Department     // หน่วยงานที่เบิก (ปลายทาง)
  
  // User Signatures (Auto from login)
  requesterId       String         // ผู้เบิก
  approverId        String?        // ผู้อนุมัติ
  dispenserId       String?        // ผู้จ่าย
  receiverId        String?        // ผู้รับ
  
  // Status & Dates
  status            TransferStatus @default(PENDING)
  purpose           String         // วัตถุประสงค์
  requestNote       String?        // หมายเหตุการขอ
  approvalNote      String?        // หมายเหตุการอนุมัติ
  
  // Financial
  totalItems        Int            @default(0)
  totalValue        Float          @default(0) // มูลค่ารวม
  
  // Timestamps
  requestedAt       DateTime       @default(now())
  approvedAt        DateTime?
  dispensedAt       DateTime?      // วันที่เตรียมของเสร็จ
  deliveredAt       DateTime?      // วันที่ส่งของ
  receivedAt        DateTime?      // วันที่รับของ
  
  // Relations
  requester         User           @relation("RequesterUser", fields: [requesterId], references: [id])
  approver          User?          @relation("ApproverUser", fields: [approverId], references: [id])
  dispenser         User?          @relation("DispenserUser", fields: [dispenserId], references: [id])
  receiver          User?          @relation("ReceiverUser", fields: [receiverId], references: [id])
  items             TransferItem[]
  
  @@index([status])
  @@index([fromDept])
  @@index([toDept])
  @@index([requestedAt])
}

// ===== ENHANCED TRANSFER ITEMS =====
model TransferItem {
  id              String   @id @default(cuid())
  transferId      String
  drugId          String
  
  // Quantities at different stages
  requestedQty    Int      // จำนวนเบิก
  approvedQty     Int?     // จำนวนอนุมัติ
  dispensedQty    Int?     // จำนวนจ่าย (ใบส่งของ)
  receivedQty     Int?     // จำนวนรับจริง
  
  // Batch Information (for dispensing)
  lotNumber       String?  // Lot number
  expiryDate      DateTime? // วันหมดอายุ
  manufacturer    String?  // บริษัท
  
  // Financial
  unitPrice       Float    @default(0) // ราคาต่อหน่วย
  totalValue      Float    @default(0) // มูลค่า (dispensedQty × unitPrice)
  
  // Notes
  itemNote        String?  // หมายเหตุรายการ
  
  // Relations
  transfer        Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  drug            Drug     @relation(fields: [drugId], references: [id])
  
  @@index([transferId])
  @@index([drugId])
}

// ===== ENHANCED TRANSACTION TRACKING =====
model StockTransaction {
  id            String          @id @default(cuid())
  stockId       String
  userId        String
  batchId       String?         // Link to specific batch
  transferId    String?         // Link to transfer if applicable
  
  type          TransactionType
  quantity      Int             // จำนวน (+/-)
  beforeQty     Int             // จำนวนก่อนทำรายการ
  afterQty      Int             // จำนวนหลังทำรายการ
  
  unitCost      Float           @default(0)
  totalCost     Float           @default(0)
  
  reference     String?         // เลขที่อ้างอิง
  note          String?         // หมายเหตุ
  createdAt     DateTime        @default(now())
  
  // Relations
  stock         Stock           @relation(fields: [stockId], references: [id])
  user          User            @relation(fields: [userId], references: [id])
  batch         DrugBatch?      @relation(fields: [batchId], references: [id])
  
  @@index([stockId])
  @@index([type])
  @@index([transferId])
  @@index([createdAt])
}

// ===== IMPORT HISTORY =====
model ImportHistory {
  id            String   @id @default(cuid())
  filename      String
  totalRecords  Int
  successCount  Int
  failureCount  Int
  errors        Json?    // เก็บข้อผิดพลาดที่เกิดขึ้น
  importedBy    String
  createdAt     DateTime @default(now())
  
  // Relations
  importedByUser User @relation(fields: [importedBy], references: [id])
  
  @@index([createdAt])
}

// ===== UPDATED ENUMS =====
enum Department {
  PHARMACY    // คลังยา
  OPD         // OPD
}

enum Role {
  PHARMACY_MANAGER    // หัวหน้าคลังยา - สิทธิ์เต็ม
  PHARMACY_STAFF      // เจ้าหน้าที่คลังยา - จัดการสต็อก
  OPD_MANAGER         // หัวหน้า OPD - สิทธิ์เต็มในแผนก
  OPD_STAFF           // เจ้าหน้าที่ OPD - เบิกจ่ายพื้นฐาน
  ADMIN               // ระบบ Admin - อนุมัติผู้ใช้
}

enum UserStatus {
  UNAPPROVED  // ยังไม่ได้รับการอนุมัติ
  APPROVED    // อนุมัติแล้ว
  SUSPENDED   // ระงับการใช้งาน
  INACTIVE    // ไม่ใช้งาน
}

enum TransactionType {
  RECEIVE_EXTERNAL    // รับยาจากภายนอก (ซื้อ/บริจาค)
  DISPENSE_EXTERNAL   // จ่ายยาให้ผู้ป่วย
  TRANSFER_OUT        // ส่งยาให้แผนกอื่น
  TRANSFER_IN         // รับยาจากแผนกอื่น
  ADJUST_INCREASE     // ปรับเพิ่ม (นับสต็อก/คืนยา)
  ADJUST_DECREASE     // ปรับลด (เสียหาย/หมดอายุ)
  RESERVE             // จองยา
  UNRESERVE           // ยกเลิกการจอง
}

enum TransferStatus {
  PENDING     // กำลังเบิก / ใบเบิกใหม่
  APPROVED    // กำลังเตรียมจัดส่ง
  PREPARED    // กำลังจัดส่ง (เตรียมของเสร็จ)
  DELIVERED   // จัดส่งสำเร็จ
  PARTIAL     // รับบางส่วน
  CANCELLED   // ยกเลิก
}
```====
model TransferItem {
  id            String   @id @default(cuid())
  transferId    String
  drugId        String
  requestedQty  Int      // จำนวนที่ขอ
  approvedQty   Int?     // จำนวนที่อนุมัติ
  sentQty       Int?     // จำนวนที่ส่งจริง
  receivedQty   Int?     // จำนวนที่รับจริง
  unitCost      Float    @default(0)
  totalCost     Float    @default(0)
  note          String?  // หมายเหตุรายการ
  
  // Relations
  transfer      Transfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  drug          Drug     @relation(fields: [drugId], references: [id])
  
  @@index([transferId])
  @@index([drugId])
}

// ===== IMPORT HISTORY =====
model ImportHistory {
  id            String   @id @default(cuid())
  filename      String
  totalRecords  Int
  successCount  Int
  failureCount  Int
  errors        Json?    // เก็บข้อผิดพลาดที่เกิดขึ้น
  importedBy    String
  createdAt     DateTime @default(now())
  
  // Relations
  importedByUser User @relation(fields: [importedBy], references: [id])
  
  @@index([createdAt])
}

// ===== ENUMS =====
enum Department {
  PHARMACY    // คลังยา
  OPD         // OPD
}

enum Role {
  PHARMACY_MANAGER    // หัวหน้าคลังยา - สิทธิ์เต็ม
  PHARMACY_STAFF      // เจ้าหน้าที่คลังยา - จัดการสต็อก
  OPD_MANAGER         // หัวหน้า OPD - สิทธิ์เต็มในแผนก
  OPD_STAFF           // เจ้าหน้าที่ OPD - เบิกจ่ายพื้นฐาน
}

enum TransactionType {
  RECEIVE_EXTERNAL    // รับยาจากภายนอก (ซื้อ/บริจาค)
  DISPENSE_EXTERNAL   // จ่ายยาให้ผู้ป่วย
  TRANSFER_OUT        // ส่งยาให้แผนกอื่น
  TRANSFER_IN         // รับยาจากแผนกอื่น
  ADJUST_INCREASE     // ปรับเพิ่ม (นับสต็อก/คืนยา)
  ADJUST_DECREASE     // ปรับลด (เสียหาย/หมดอายุ)
  RESERVE             // จองยา
  UNRESERVE           // ยกเลิกการจอง
}

enum TransferStatus {
  PENDING     // รอการอนุมัติ
  APPROVED    // อนุมัติแล้ว รอส่ง
  SENT        // ส่งแล้ว รอรับ
  RECEIVED    // รับครบแล้ว
  PARTIAL     // รับบางส่วน
  CANCELLED   // ยกเลิก
  REJECTED    // ปฏิเสธ
}
```

## 🎯 Core Features (MVP V3.0)

### 1. Authentication & Authorization (JWT-based)
- **Secure JWT authentication** ด้วย bcryptjs password hashing
- **Department-based access control** แยกสิทธิ์ตามแผนก
- **Role-based permissions** แยกสิทธิ์ตามตำแหน่ง
- **Session management** ด้วย JWT token refresh
- **Mobile-friendly login** ด้วย touch-optimized interface

### 2. Drug Master Management
- **Drug CRUD operations** เพิ่ม/แก้ไข/ลบ/ดูข้อมูลยา
- **Excel/CSV import system** รองรับการ import ข้อมูลยาจำนวนมาก
- **Data validation** ตรวจสอบข้อมูลก่อน import
- **Import history tracking** เก็บประวัติการ import
- **Drug search & filtering** ค้นหายาด้วยชื่อ/รหัส

### 3. Department-Isolated Stock Management
- **Real-time stock levels** แสดงสต็อกปัจจุบันแยกตามแผนก
- **Department isolation** แต่ละแผนกเห็นเฉพาะสต็อกของตนเอง
- **Stock adjustment** ปรับสต็อกเพิ่ม/ลด พร้อมเหตุผล
- **Reorder point alerts** แจ้งเตือนเมื่อสต็อกต่ำ
- **Cost tracking** ติดตามต้นทุนและมูลค่าสต็อก

### 4. Inter-Department Transfer System
- **Transfer request creation** สร้างใบขอโอนยาระหว่างแผนก
- **Multi-step workflow:**
  1. **Request** - ขอโอนยา (โดยแผนกต้นทาง/ปลายทาง)
  2. **Approval** - อนุมัติ/ปฏิเสธ (โดยหัวหน้าแผนก)
  3. **Send** - ส่งยา (โดยแผนกต้นทาง)
  4. **Receive** - รับยา (โดยแผนกปลายทาง)
- **Different perspectives:**
  - **คลังยา:** เห็นใบเบิกจาก OPD = การจ่ายออก
  - **OPD:** เห็นใบเบิกจากคลังยา = การรับเข้า
- **Partial fulfillment** รองรับการส่ง/รับบางส่วน
- **Transfer tracking** ติดตามสถานะแบบเรียลไทม์

### 5. Comprehensive Transaction Logging
- **Complete audit trail** บันทึกการเคลื่อนไหวทุกรายการ
- **Department-specific views** แสดงประวัติเฉพาะแผนกตนเอง
- **Transaction categorization** แยกประเภทการเคลื่อนไหว
- **User attribution** ระบุผู้ทำรายการในทุก transaction
- **Reference linking** เชื่อมโยงกับเอกสารอ้างอิง

### 6. Mobile-First PWA Design
- **Progressive Web App** ติดตั้งเป็น app บนมือถือได้
- **Offline capability** cache ข้อมูลสำคัญสำหรับใช้งานออฟไลน์
- **Touch-friendly interface** ปุ่มใหญ่และเมนูที่เหมาะสำหรับมือถือ
- **Responsive design** ใช้งานได้ทั้งมือถือและ desktop
- **App-like experience** navigation และ UX เหมือน native app

## 📱 Mobile-First UI/UX Architecture

### Page Structure (Mobile-Optimized)
```
/login                     # หน้า Login (mobile-optimized form)
/dashboard                 # หน้าหลัก (stock summary cards)
  └─ Department switcher   # เปลี่ยนมุมมองแผนก (สำหรับ manager)
/drugs                     # จัดการข้อมูลยา
  ├─ /drugs/list          # รายการยา (infinite scroll)
  ├─ /drugs/add           # เพิ่มยาใหม่ (step-by-step form)
  ├─ /drugs/import        # import ข้อมูลยา (drag & drop)
  └─ /drugs/[id]          # รายละเอียดยา
/stock                     # จัดการสต็อก
  ├─ /stock/overview      # ภาพรวมสต็อก (card grid)
  ├─ /stock/adjust        # ปรับสต็อก (mobile form)
  └─ /stock/[drugId]      # รายละเอียดสต็อกยา
/transfers                # การโอนย้าย
  ├─ /transfers/list      # รายการใบโอน (card list)
  ├─ /transfers/new       # สร้างใบโอนใหม่ (wizard)
  ├─ /transfers/[id]      # รายละเอียดใบโอน
  └─ /transfers/[id]/action # ดำเนินการ (อนุมัติ/ส่ง/รับ)
/transactions             # ประวัติการเคลื่อนไหว
  └─ Infinite scroll      # แสดงประวัติแบบ timeline
/users                    # จัดการผู้ใช้ (เฉพาะ Manager)
  ├─ /users/list         # รายการผู้ใช้
  └─ /users/add          # เพิ่มผู้ใช้ใหม่
```

### Key Mobile Components
- **StockCard** - Card design แสดงข้อมูลยาและจำนวนสต็อก
- **TransferCard** - Card แสดงใบโอนพร้อมสถานะและ action buttons
- **TransactionItem** - Timeline item แสดงประวัติการเคลื่อนไหว
- **MobileNavigation** - Bottom tab navigation สำหรับมือถือ
- **DepartmentBadge** - Badge แสดงแผนกด้วยสีประจำแผนก
- **StatusBadge** - Badge แสดงสถานะด้วยสีและไอคอน
- **ImportWizard** - Multi-step wizard สำหรับ import ข้อมูล
- **ActionSheet** - Mobile-style action sheet สำหรับ actions

## ⚡ 1-Week Implementation Roadmap

### Day 1: Foundation & Setup
**Morning (4 hours):**
- [ ] สร้าง Next.js 14 project พร้อม TypeScript
- [ ] Setup TailwindCSS + Shadcn/UI components
- [ ] Configure PWA manifest และ service worker
- [ ] Setup Supabase project และ database

**Afternoon (4 hours):**
- [ ] สร้าง Prisma schema ตาม V3.0 design
- [ ] Setup database migrations
- [ ] Seed ข้อมูลเริ่มต้น (users, sample drugs)
- [ ] Test database connection และ basic queries

**Evening (4 hours):**
- [ ] Setup JWT authentication utilities
- [ ] สร้าง middleware สำหรับ authentication
- [ ] Test authentication flow พื้นฐาน

### Day 2: Authentication & User Management
**Morning (4 hours):**
- [ ] สร้าง Login page (mobile-optimized)
- [ ] Implement JWT login/logout functionality
- [ ] Setup protected route middleware
- [ ] Mobile navigation component

**Afternoon (4 hours):**
- [ ] User management pages (list/add/edit)
- [ ] Role-based access control implementation
- [ ] Department-based data filtering
- [ ] User session management

**Evening (4 hours):**
- [ ] Testing authentication on mobile devices
- [ ] PWA installation testing
- [ ] Security testing และ validation

### Day 3: Drug Master & Import System
**Morning (4 hours):**
- [ ] Drug master CRUD operations
- [ ] Drug list page (mobile cards layout)
- [ ] Drug detail และ edit forms
- [ ] Search และ filtering functionality

**Afternoon (4 hours):**
- [ ] File upload component สำหรับ Excel/CSV
- [ ] Excel/CSV parsing utilities
- [ ] Import validation และ error handling
- [ ] Import history tracking

**Evening (4 hours):**
- [ ] Import wizard UI (mobile-friendly)
- [ ] Test import ด้วยข้อมูลจริง
- [ ] Error reporting และ user feedback

### Day 4: Stock Management System
**Morning (4 hours):**
- [ ] Stock overview dashboard (department-specific)
- [ ] Stock cards พร้อม real-time data
- [ ] Stock adjustment functionality
- [ ] Reorder point alerts

**Afternoon (4 hours):**
- [ ] Stock transaction logging
- [ ] Department isolation implementation
- [ ] Stock detail pages
- [ ] Mobile-optimized stock forms

**Evening (4 hours):**
- [ ] Stock calculation logic
- [ ] Cost tracking implementation
- [ ] Performance optimization
- [ ] Mobile testing

### Day 5: Transfer System (Core Logic)
**Morning (4 hours):**
- [ ] Transfer creation form (mobile wizard)
- [ ] Transfer workflow state management
- [ ] Transfer approval system
- [ ] Multi-department perspective logic

**Afternoon (4 hours):**
- [ ] Transfer item management
- [ ] Partial fulfillment logic
- [ ] Transfer number generation
- [ ] Notification system

**Evening (4 hours):**
- [ ] Transfer validation และ business rules
- [ ] Stock reservation system
- [ ] Transfer cancellation logic
- [ ] Testing core transfer workflows

### Day 6: Transfer UI & Transaction History
**Morning (4 hours):**
- [ ] Transfer list pages (different perspectives)
- [ ] Transfer detail pages
- [ ] Transfer action components (approve/send/receive)
- [ ] Mobile-optimized transfer interface

**Afternoon (4 hours):**
- [ ] Transaction history pages
- [ ] Timeline-style transaction display
- [ ] Transaction filtering และ search
- [ ] Export functionality

**Evening (4 hours):**
- [ ] Real-time updates implementation
- [ ] Mobile notifications
- [ ] Performance optimization
- [ ] UI/UX refinements

### Day 7: Testing, Optimization & Deployment
**Morning (4 hours):**
- [ ] Comprehensive testing บน mobile devices
- [ ] PWA functionality testing
- [ ] Performance optimization
- [ ] Database query optimization

**Afternoon (4 hours):**
- [ ] Security testing และ penetration testing
- [ ] User acceptance testing
- [ ] Bug fixes และ refinements
- [ ] Documentation

**Evening (4 hours):**
- [ ] Production deployment ไป Vercel
- [ ] Database migration ไป production
- [ ] Final testing บน production
- [ ] Go-live preparation

## 🔧 Technical Implementation Details

### Department Isolation Logic
```typescript
// Middleware สำหรับ filter ข้อมูลตามแผนก
export const departmentFilter = (userDepartment: Department) => {
  return {
    stock: { department: userDepartment },
    transactions: { 
      stock: { department: userDepartment } 
    }
  }
}

// Context provider สำหรับ user session
export const useAuth = () => {
  const { user } = useContext(AuthContext)
  return {
    user,
    department: user?.department,
    canAccessDepartment: (dept: Department) => {
      return user?.role.includes('MANAGER') || user?.department === dept
    }
  }
}
```

### Transfer Perspective Logic
```typescript
// คำนวณมุมมองการโอนตามแผนกผู้ใช้
export const getTransferPerspective = (
  transfer: Transfer, 
  userDept: Department
) => {
  if (userDept === transfer.fromDept) {
    return { 
      type: 'OUTGOING', 
      action: 'จ่ายให้',
      counterpart: transfer.toDept 
    }
  } else {
    return { 
      type: 'INCOMING', 
      action: 'รับจาก',
      counterpart: transfer.fromDept 
    }
  }
}
```

### Drug Import Processing
```typescript
// ระบบ import ข้อมูลยาจาก Excel/CSV
export const importDrugData = async (
  file: File, 
  userId: string
) => {
  const data = await parseExcelFile(file)
  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  }
  
  for (const row of data) {
    try {
      // Validate row data
      const drugData = drugSchema.parse({
        code: row.code?.toString().trim(),
        name: row.name?.toString().trim(),
        genericName: row.genericName?.toString().trim(),
        strength: row.strength?.toString().trim(),
        unit: row.unit?.toString().trim(),
        cost: parseFloat(row.cost) || 0,
        reorderPoint: parseInt(row.reorderPoint) || 10
      })
      
      // Upsert drug data
      await prisma.drug.upsert({
        where: { code: drugData.code },
        update: drugData,
        create: {
          ...drugData,
          importBatch: `batch_${Date.now()}`
        }
      })
      
      results.success++
    } catch (error) {
      results.failed++
      results.errors.push({ 
        row: row.code, 
        error: error.message 
      })
    }
  }
  
  // บันทึกประวัติการ import
  await prisma.importHistory.create({
    data: {
      filename: file.name,
      totalRecords: data.length,
      successCount: results.success,
      failureCount: results.failed,
      errors: results.errors,
      importedBy: userId
    }
  })
  
  return results
}
```

### PWA Configuration
```typescript
// next.config.js - PWA setup
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 // 1 hour
        }
      }
    }
  ]
})

module.exports = withPWA({
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
})
```

## 🚀 Deployment Strategy (Free Tier)

### Hosting Architecture
- **Vercel Free Plan:** 100GB bandwidth, unlimited serverless functions
- **Supabase Free Plan:** 500MB database, 50MB file storage, 2M queries/month
- **Domain:** ใช้ subdomain ของ Vercel (.vercel.app) หรือ custom domain
- **SSL:** Automatic HTTPS ผ่าน Vercel

### Environment Configuration
```bash
# Production Environment Variables
DATABASE_URL="postgresql://..."
JWT_SECRET="your-super-secret-key"
NEXTAUTH_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

### Performance Optimization
- **Image Optimization:** Next.js Image component พร้อม Vercel Image Optimization
- **Bundle Analysis:** @next/bundle-analyzer สำหรับ optimize bundle size
- **Database Indexing:** Strategic indexes บน high-query fields
- **Caching Strategy:** Browser caching + CDN caching + API response caching

## 📊 Success Metrics & KPIs

### Technical Performance
- **Page Load Time:** < 3 วินาที (mobile)
- **Database Query Time:** < 100ms average
- **PWA Installation Rate:** > 70% ของผู้ใช้มือถือ
- **Offline Functionality:** 100% ของ core features
- **Mobile Lighthouse Score:** > 90

### User Experience
- **User Adoption Rate:** > 95% ภายใน 2 สัปดาห์
- **Task Completion Rate:** > 90% สำหรับ core workflows
- **Error Rate:** < 1% ของ total transactions
- **User Satisfaction:** > 4.5/5 (จาก user feedback)

### Business Impact
- **Paper Reduction:** 100% ทดแทนระบบกระดาษ
- **Time Savings:** ลดเวลาในการจัดการสต็อก 50%
- **Inventory Accuracy:** > 98% ความแม่นยำ
- **Cost Efficiency:** ลดต้นทุนการจัดการ 30%

## 💡 Development Best Practices

### Code Quality Standards
- **TypeScript Strict Mode:** บังคับใช้ type safety แบบเข้มงวด
- **Prisma Type Safety:** ใช้ Prisma client สำหรับ type-safe database operations
- **Component Architecture:** Reusable components ด้วย Shadcn/UI patterns
- **Error Handling:** Comprehensive error boundaries และ user-friendly error messages
- **Testing Strategy:** Unit tests สำหรับ business logic และ integration tests สำหรับ critical workflows
- **Code Organization:** Feature-based folder structure และ clear separation of concerns

### Database Best Practices
- **Department Filtering:** ใช้ department context ในทุก query เพื่อ data isolation
- **Index Optimization:** Strategic indexing บน frequently queried fields
- **Transaction Management:** ใช้ Prisma transactions สำหรับ complex operations
- **Migration Safety:** Backward-compatible migrations พร้อม rollback strategies
- **Performance Monitoring:** Query analysis และ slow query identification

### Security Implementation
- **Input Validation:** Zod schemas สำหรับ API request validation
- **SQL Injection Prevention:** Prisma ORM built-in protection
- **Authentication Security:** JWT with proper expiration และ refresh token strategy
- **Authorization Layers:** Role และ department-based access control
- **Audit Logging:** Complete audit trail สำหรับ sensitive operations
- **Rate Limiting:** API rate limiting เพื่อป้องกัน abuse

### Mobile-First Development
- **Responsive Design:** Mobile-first CSS with progressive enhancement
- **Touch Optimization:** Large touch targets และ gesture-friendly interactions
- **Performance Focus:** Optimized bundle size และ lazy loading
- **Offline Strategy:** Service worker caching สำหรับ critical functionality
- **PWA Standards:** Proper manifest, service worker, และ app-like experience

## 📝 AI Assistant Guidelines for V3.0

**เมื่อทำงานในโครงการนี้ ให้คำนึงถึง:**

### Core Principles
- **Single Hospital Focus:** ไม่ต้องคิดเรื่อง multi-tenancy
- **Department Isolation:** แยกข้อมูลระหว่าง 2 แผนกอย่างชัดเจน
- **Mobile-First Mindset:** ออกแบบสำหรับมือถือก่อนเสมอ
- **Pharmacy Workflow Accuracy:** ให้ความสำคัญกับ workflow เภสัชกรรมที่ถูกต้อง
- **Real-time Data Integrity:** ข้อมูลสต็อกต้องแม่นยำแบบเรียลไทม์
- **1-Week Timeline:** เน้น MVP ที่ใช้งานได้จริงภายใน 1 สัปดาห์

### Technical Guidelines
- **Use JWT Authentication:** ไม่ใช้ NextAuth หรือ authentication library อื่น
- **Prisma-First Database:** ใช้ Prisma ORM สำหรับ database operations ทั้งหมด
- **Department Context:** inject department context ใน middleware ทุกครั้ง
- **TypeScript Strict:** บังคับใช้ TypeScript strict mode
- **Mobile Components:** ใช้ touch-friendly, card-based UI components
- **PWA Implementation:** รวม PWA capabilities ตั้งแต่เริ่มต้น

### Response Format Preferences
- **Provide Working Code:** ให้ code ที่ใช้งานได้จริง ไม่ใช่ pseudo-code
- **Include Mobile Considerations:** รวมการพิจารณา mobile UX ในทุกข้อเสนอแนะ
- **Department Perspective Logic:** อธิบาย logic ที่แยกมุมมองตามแผนก
- **Real Implementation Examples:** ให้ตัวอย่าง implementation ที่เฉพาะเจาะจง
- **Performance Considerations:** รวมการพิจารณาประสิทธิภาพ
- **Security Best Practices:** รวมแนวทางความปลอดภัย
- **Testing Strategies:** แนะนำวิธีการ test features

### Avoid These Patterns
- **Multi-tenant Solutions:** ไม่ต้องใช้ hospital_id หรือ tenant isolation
- **Complex Authentication:** ไม่ใช้ OAuth, SAML, หรือ external auth providers
- **Over-Engineering:** ไม่ทำ features ที่ไม่จำเป็นใน MVP
- **Desktop-First Design:** ไม่ออกแบบสำหรับ desktop ก่อน
- **Complex Analytics:** ไม่ทำ advanced reporting ใน V3.0
- **External Integrations:** ไม่เชื่อมต่อระบบภายนอกใน phase แรก

## 🎯 Immediate Next Steps

### Pre-Development Checklist
1. **ยืนยัน Requirements:**
   - [ ] ขอบเขต 2 แผนก (คลังยา + OPD) ถูกต้อง?
   - [ ] จำนวนผู้ใช้ประมาณเท่าไหร่?
   - [ ] มีข้อมูลยาสำหรับ import พร้อมหรือยัง?
   - [ ] ต้องการ offline capability หรือไม่?

2. **Technical Preparation:**
   - [ ] Setup development environment (Node.js, VS Code)
   - [ ] Create Supabase account และ project
   - [ ] Create Vercel account สำหรับ deployment
   - [ ] Prepare drug data file format

3. **Design Validation:**
   - [ ] Review database schema กับ stakeholders
   - [ ] Confirm user roles และ permissions
   - [ ] Validate transfer workflow กับ pharmacy standards
   - [ ] Confirm mobile-first approach

### Development Kickoff
```bash
# Quick Start Commands
npx create-next-app@latest hospital-pharmacy --typescript --tailwind --eslint --app
cd hospital-pharmacy
npm install @prisma/client prisma @supabase/supabase-js
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install bcryptjs jsonwebtoken zod
npm install next-pwa workbox-webpack-plugin
npx prisma init
```

## 📋 Final Success Criteria

### Functional Requirements Checklist
- [ ] **Authentication:** JWT login/logout ทำงานได้บน mobile + desktop
- [ ] **Department Isolation:** แต่ละแผนกเห็นข้อมูลเฉพาะของตนเอง
- [ ] **Stock Management:** จัดการสต็อกแยกตามแผนกได้
- [ ] **Transfer System:** โอนยาระหว่างแผนกได้สมบูรณ์
- [ ] **Transaction Tracking:** ติดตามการเคลื่อนไหวได้ครบถ้วน
- [ ] **Drug Import:** Import ข้อมูลยาจาก Excel/CSV ได้
- [ ] **Mobile PWA:** ติดตั้งและใช้งานเป็น app บนมือถือได้
- [ ] **Real-time Updates:** ข้อมูลสต็อกอัปเดตแบบเรียลไทม์

### Technical Requirements Checklist
- [ ] **Performance:** หน้าเว็บโหลดไม่เกิน 3 วินาที
- [ ] **Mobile Optimization:** Lighthouse score > 90
- [ ] **Data Integrity:** ไม่มี data loss หรือ inconsistency
- [ ] **Security:** Authentication และ authorization ทำงานถูกต้อง
- [ ] **Scalability:** รองรับการใช้งานของทั้ง 2 แผนก
- [ ] **Reliability:** System uptime > 99%
- [ ] **Usability:** User-friendly interface บน mobile devices

### Business Impact Checklist
- [ ] **Paper Replacement:** ทดแทนระบบกระดาษ 100%
- [ ] **Workflow Efficiency:** ลดเวลาการจัดการสต็อก
- [ ] **Inventory Accuracy:** ความแม่นยำสต็อก > 98%
- [ ] **User Adoption:** การใช้งานจริงของเจ้าหน้าที่
- [ ] **Cost Effectiveness:** ลดต้นทุนการจัดการ
- [ ] **Compliance:** ตรงตามมาตรฐานเภสัชกรรม

---