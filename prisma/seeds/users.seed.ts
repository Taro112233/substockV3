// prisma/seeds/users.seed.ts - Hospital Pharmacy V3.0 User Management
// ระบบจัดการผู้ใช้งานสำหรับโรงพยาบาลเดียว 2 แผนก

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../lib/auth";

interface UserSeedData {
  username: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  position?: string;
  role?: string;
  status: "UNAPPROVED" | "APPROVED" | "SUSPENDED" | "INACTIVE";
  isActive: boolean;
}

export async function seedUsers(prisma: PrismaClient) {
  console.log("👥 Creating Hospital Pharmacy V3.0 Users...");
  console.log("🏥 Single Hospital - Department Based Users");

  const users: UserSeedData[] = [
    // 🔧 System Developer (แล้วเสร็จ)
    {
      username: "developer",
      email: "dev@hospital.local",
      password: "dev123",
      firstName: "System",
      lastName: "Developer",
      position: "System Developer",
      role: "ADMIN",
      status: "APPROVED",
      isActive: true,
    },

    // 👨‍⚕️ คลังยา (PHARMACY) Users
    {
      username: "pharmacy_manager",
      email: "pharmacy.manager@hospital.local",
      password: "pharmacy123",
      firstName: "สมชาย",
      lastName: "เภสัชเวช",
      position: "หัวหน้าเภสัชกร",
      role: "PHARMACY_MANAGER",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "pharmacist1",
      email: "pharmacist1@hospital.local",
      password: "pharma123",
      firstName: "สมหญิง",
      lastName: "ใจดี",
      position: "เภสัชกร",
      role: "PHARMACY_STAFF",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "pharmacist2",
      email: "pharmacist2@hospital.local",
      password: "pharma123",
      firstName: "วิชัย",
      lastName: "รักษ์ดี",
      position: "เภสัชกร",
      role: "PHARMACY_STAFF",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "pharmacy_tech1",
      email: "pharmtech1@hospital.local",
      password: "tech123",
      firstName: "มาลี",
      lastName: "ขยันหา",
      position: "เทคนิคเภสัชกรรม",
      role: "PHARMACY_STAFF",
      status: "APPROVED",
      isActive: true,
    },

    // 🏥 OPD Users
    {
      username: "opd_manager",
      email: "opd.manager@hospital.local",
      password: "opd123",
      firstName: "ประภาส",
      lastName: "จัดการดี",
      position: "หัวหน้า OPD",
      role: "OPD_MANAGER",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "nurse1",
      email: "nurse1@hospital.local",
      password: "nurse123",
      firstName: "สุภา",
      lastName: "ดูแลดี",
      position: "พยาบาลวิชาชีพ",
      role: "OPD_STAFF",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "nurse2",
      email: "nurse2@hospital.local",
      password: "nurse123",
      firstName: "วันดี",
      lastName: "รักษาดี",
      position: "พยาบาลวิชาชีพ",
      role: "OPD_STAFF",
      status: "APPROVED",
      isActive: true,
    },
    {
      username: "opd_clerk",
      email: "opdclerk@hospital.local",
      password: "clerk123",
      firstName: "สมหมาย",
      lastName: "ช่วยงาน",
      position: "เจ้าหน้าที่ OPD",
      role: "OPD_STAFF",
      status: "APPROVED",
      isActive: true,
    },

    // 🔐 Admin Users
    {
      username: "admin",
      email: "admin@hospital.local",
      password: "admin123",
      firstName: "ผู้ดูแล",
      lastName: "ระบบ",
      position: "ผู้ดูแลระบบ",
      role: "ADMIN",
      status: "APPROVED",
      isActive: true,
    },

    // 📋 Test Users for Demo
    {
      username: "testuser",
      email: "test@hospital.local",
      password: "test123",
      firstName: "ทดสอบ",
      lastName: "ระบบ",
      position: "ผู้ทดสอบ",
      role: "OPD_STAFF",
      status: "APPROVED",
      isActive: true,
    },

    // ⏳ Unapproved Users (รอการอนุมัติ)
    {
      username: "newuser1",
      email: "newuser1@hospital.local",
      password: "newuser123",
      firstName: "สมาชิก",
      lastName: "ใหม่หนึ่ง",
      position: "พยาบาล",
      role: "OPD_STAFF",
      status: "UNAPPROVED",
      isActive: true,
    },
    {
      username: "newuser2",
      email: "newuser2@hospital.local",
      password: "newuser123",
      firstName: "สมาชิก",
      lastName: "ใหม่สอง",
      position: "เทคนิคเภสัชกรรม",
      role: "PHARMACY_STAFF",
      status: "UNAPPROVED",
      isActive: true,
    },
  ];

  console.log(`📊 Creating ${users.length} users...`);
  
  const results = {
    created: 0,
    updated: 0,
    byRole: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  };

  for (const userData of users) {
    try {
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      // Create or update user
      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position,
          status: userData.status,
          isActive: userData.isActive,
          lastLogin: userData.status === "APPROVED" ? new Date() : null,
        },
        create: {
          username: userData.username,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          position: userData.position || null,
          status: userData.status,
          isActive: userData.isActive,
          lastLogin: userData.status === "APPROVED" ? new Date() : null,
        },
      });

      // ถ้าเป็น user ใหม่
      if (!await prisma.user.findUnique({ where: { username: userData.username } })) {
        results.created++;
      } else {
        results.updated++;
      }

      // นับสถิติ
      const role = userData.role || "STAFF";
      results.byRole[role] = (results.byRole[role] || 0) + 1;
      results.byStatus[userData.status] = (results.byStatus[userData.status] || 0) + 1;

      console.log(`  ✅ ${userData.firstName} ${userData.lastName} (${userData.username})`);
      console.log(`      Role: ${role} | Status: ${userData.status} | Position: ${userData.position || 'N/A'}`);

    } catch (error) {
      console.error(`  ❌ Failed to create user ${userData.username}:`, error);
    }
  }

  // แสดงสถิติสรุป
  console.log(`\n📊 User Creation Summary:`);
  console.log(`  ✅ Created: ${results.created} users`);
  console.log(`  🔄 Updated: ${results.updated} users`);
  console.log(`  👥 Total: ${results.created + results.updated} users`);

  console.log(`\n📋 Users by Role:`);
  Object.entries(results.byRole).forEach(([role, count]) => {
    const roleDescriptions: Record<string, string> = {
      "ADMIN": "ผู้ดูแลระบบ",
      "PHARMACY_MANAGER": "หัวหน้าเภสัชกร", 
      "PHARMACY_STAFF": "เจ้าหน้าที่เภสัชกรรม",
      "OPD_MANAGER": "หัวหน้า OPD",
      "OPD_STAFF": "เจ้าหน้าที่ OPD"
    };
    console.log(`  - ${role} (${roleDescriptions[role] || role}): ${count} คน`);
  });

  console.log(`\n📈 Users by Status:`);
  Object.entries(results.byStatus).forEach(([status, count]) => {
    const statusDescriptions: Record<string, string> = {
      "APPROVED": "อนุมัติแล้ว",
      "UNAPPROVED": "รอการอนุมัติ",
      "SUSPENDED": "ระงับการใช้งาน",
      "INACTIVE": "ไม่ใช้งาน"
    };
    console.log(`  - ${status} (${statusDescriptions[status] || status}): ${count} คน`);
  });

  console.log(`\n🔐 Login Information:`);
  console.log(`  🔧 Developer: developer / dev123`);
  console.log(`  💊 Pharmacy Manager: pharmacy_manager / pharmacy123`);
  console.log(`  💊 Pharmacist: pharmacist1 / pharma123`);
  console.log(`  🏥 OPD Manager: opd_manager / opd123`);
  console.log(`  👩‍⚕️ Nurse: nurse1 / nurse123`);
  console.log(`  🔐 Admin: admin / admin123`);
  console.log(`  🧪 Test User: testuser / test123`);

  console.log(`\n⚠️  Unapproved Users (for testing approval workflow):`);
  console.log(`  - newuser1 / newuser123 (พยาบาล - รอการอนุมัติ)`);
  console.log(`  - newuser2 / newuser123 (เทคนิคเภสัชกรรม - รอการอนุมัติ)`);

  console.log(`\n🎯 Ready for Hospital Pharmacy V3.0 Testing!`);
  console.log(`   📱 Mobile-first design testing`);
  console.log(`   🔄 Transfer workflow testing`);
  console.log(`   📊 Department isolation testing`);
  console.log(`   🔐 Role-based access testing`);
  console.log(`   ✅ User approval workflow testing`);

  return {
    totalUsers: results.created + results.updated,
    created: results.created,
    updated: results.updated,
    byRole: results.byRole,
    byStatus: results.byStatus,
    success: true
  };
}