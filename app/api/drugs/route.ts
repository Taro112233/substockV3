// 📄 File: app/api/drugs/route.ts (FIXED)
// API สำหรับสร้างยาใหม่พร้อมสต็อกเริ่มต้น - แก้ไข validation และ response

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError, ZodIssue } from "zod";
import { Prisma, Department } from "@prisma/client";

// ✅ Fixed: Schema สำหรับ validation การสร้างยาใหม่ (แก้ไขให้รองรับข้อมูลจาก modal)
const createDrugSchema = z.object({
  hospitalDrugCode: z
    .string()
    .min(1, "รหัสยาโรงพยาบาลเป็นข้อมูลที่จำเป็น")
    .max(50, "รหัสยาต้องไม่เกิน 50 ตัวอักษร"),
  name: z
    .string()
    .min(1, "ชื่อยาเป็นข้อมูลที่จำเป็น")
    .max(255, "ชื่อยาต้องไม่เกิน 255 ตัวอักษร"),
  genericName: z
    .string()
    .max(255, "ชื่อสามัญต้องไม่เกิน 255 ตัวอักษร")
    .nullable()
    .optional()
    .transform((val) => val === "" ? null : val), // ✅ แปลง empty string เป็น null
  dosageForm: z.enum(
    [
      "APP", "BAG", "CAP", "CR", "DOP", "ENE", "GEL", "HAN", "IMP",
      "INJ", "LIQ", "LOT", "LVP", "MDI", "MIX", "NAS", "NB", "OIN",
      "PAT", "POW", "PWD", "SAC", "SOL", "SPR", "SUP", "SUS", "SYR",
      "TAB", "TUR",
    ],
    {
      message: "รูปแบบยาไม่ถูกต้อง",
    }
  ),
  strength: z
    .string()
    .max(50, "ความแรงต้องไม่เกิน 50 ตัวอักษร")
    .nullable()
    .optional()
    .transform((val) => val === "" ? null : val), // ✅ แปลง empty string เป็น null
  unit: z
    .string()
    .min(1, "หน่วยเป็นข้อมูลที่จำเป็น")
    .max(20, "หน่วยต้องไม่เกิน 20 ตัวอักษร"),
  packageSize: z
    .string()
    .max(50, "ขนาดบรรจุต้องไม่เกิน 50 ตัวอักษร")
    .nullable()
    .optional()
    .transform((val) => val === "" ? null : val), // ✅ แปลง empty string เป็น null
  pricePerBox: z
    .number()
    .min(0, "ราคาต้องไม่น้อยกว่า 0")
    .max(999999.99, "ราคาต้องไม่เกิน 999,999.99"),
  category: z.enum(
    [
      "REFER", "HAD", "NARCOTIC", "REFRIGERATED", "PSYCHIATRIC",
      "FLUID", "GENERAL", "TABLET", "SYRUP", "INJECTION", "EXTEMP", "ALERT",
    ],
    {
      message: "ประเภทยาไม่ถูกต้อง",
    }
  ),
  notes: z
    .string()
    .max(1000, "หมายเหตุต้องไม่เกิน 1000 ตัวอักษร")
    .nullable()
    .optional()
    .transform((val) => val === "" ? null : val), // ✅ แปลง empty string เป็น null
  
  // ✅ Fixed: เพิ่มฟิลด์ stock ที่ส่งมาจาก modal
  initialQuantity: z
    .number()
    .min(0, "จำนวนเริ่มต้นต้องไม่น้อยกว่า 0")
    .default(0),
  minimumStock: z
    .number()
    .min(0, "จำนวนขั้นต่ำต้องไม่น้อยกว่า 0")
    .default(10),
  
  // ✅ Fixed: แผนกที่ส่งมาจาก modal
  department: z.enum(["PHARMACY", "OPD"], {
    message: "แผนกไม่ถูกต้อง"
  })
});

// GET - ดึงรายการยาทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const department = searchParams.get("department") as Department | null;

    // Build where clause
    const where: any = {
      isActive: true, // เฉพาะยาที่ยังใช้งาน
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { hospitalDrugCode: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        stocks: department ? {
          where: { department }
        } : true,
        _count: {
          select: {
            stocks: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: drugs,
    });
  } catch (error) {
    console.error("Get drugs error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลยา" },
      { status: 500 }
    );
  }
}

// POST - สร้างยาใหม่พร้อมสต็อกเริ่มต้น (NO AUTHENTICATION)
export async function POST(request: NextRequest) {
  try {
    // Get and validate input data
    const body = await request.json();
    console.log('📝 Received data:', JSON.stringify(body, null, 2));
    
    // ✅ Fixed: Validate กับ schema ที่แก้ไขแล้ว
    const validatedData = createDrugSchema.parse(body);
    console.log('✅ Validated data:', JSON.stringify(validatedData, null, 2));

    // ตรวจสอบว่ารหัสยาซ้ำหรือไม่
    const existingDrugByCode = await prisma.drug.findFirst({
      where: {
        hospitalDrugCode: validatedData.hospitalDrugCode,
      },
    });

    if (existingDrugByCode) {
      return NextResponse.json(
        {
          error: "รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว",
        },
        { status: 409 } // ✅ Fixed: ใช้ 409 Conflict แทน 400
      );
    }

    // คำนวณมูลค่าเริ่มต้น
    const initialTotalValue =
      validatedData.initialQuantity * validatedData.pricePerBox;

    console.log(`💰 Initial stock value: ${initialTotalValue} baht`);

    // ใช้ transaction เพื่อสร้างยาและสต็อกพร้อมกัน
    const result = await prisma.$transaction(async (tx) => {
      // สร้างยาใหม่
      const newDrug = await tx.drug.create({
        data: {
          hospitalDrugCode: validatedData.hospitalDrugCode,
          name: validatedData.name,
          genericName: validatedData.genericName,
          dosageForm: validatedData.dosageForm,
          strength: validatedData.strength,
          unit: validatedData.unit,
          packageSize: validatedData.packageSize,
          pricePerBox: validatedData.pricePerBox,
          category: validatedData.category,
          notes: validatedData.notes,
          isActive: true,
        },
      });

      console.log(`✅ Created drug: ${newDrug.id} - ${newDrug.name}`);

      // สร้างสต็อกสำหรับแผนกที่เลือก
      const primaryStock = await tx.stock.create({
        data: {
          drugId: newDrug.id,
          department: validatedData.department,
          totalQuantity: validatedData.initialQuantity,
          reservedQty: 0,
          minimumStock: validatedData.minimumStock,
          totalValue: initialTotalValue,
          lastUpdated: new Date(),
        },
      });

      console.log(`📦 Created stock for ${validatedData.department}: ${primaryStock.totalQuantity} units`);

      // สร้างสต็อกสำหรับแผนกที่สอง (quantity = 0)
      const secondaryDepartment = validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY";
      const secondaryStock = await tx.stock.create({
        data: {
          drugId: newDrug.id,
          department: secondaryDepartment as Department,
          totalQuantity: 0,
          reservedQty: 0,
          minimumStock: 0,
          totalValue: 0,
          lastUpdated: new Date(),
        },
      });

      console.log(`📦 Created secondary stock for ${secondaryDepartment}: 0 units`);

      // สร้าง transaction record สำหรับ initial stock (ถ้ามี)
      if (validatedData.initialQuantity > 0) {
        await tx.stockTransaction.create({
          data: {
            stockId: primaryStock.id,
            userId: 'SYSTEM', // ✅ ใช้ SYSTEM แทน user.id เพราะไม่มี authentication
            type: 'TRANSFER_IN',
            quantity: validatedData.initialQuantity,
            beforeQty: 0,
            afterQty: validatedData.initialQuantity,
            reference: `INITIAL_${newDrug.hospitalDrugCode}`,
            note: `สร้างสต็อกเริ่มต้น - ${newDrug.name}`
          }
        });

        console.log(`📝 Created initial stock transaction for ${validatedData.initialQuantity} units`);
      }

      // ✅ Fixed: Return data ในรูปแบบที่ modal คาดหวัง (Stock format)
      return {
        id: primaryStock.id,
        drugId: newDrug.id,
        department: validatedData.department,
        totalQuantity: validatedData.initialQuantity,
        reservedQty: 0,
        minimumStock: validatedData.minimumStock,
        totalValue: initialTotalValue,
        lastUpdated: primaryStock.lastUpdated,
        drug: {
          id: newDrug.id,
          hospitalDrugCode: newDrug.hospitalDrugCode,
          name: newDrug.name,
          genericName: newDrug.genericName,
          dosageForm: newDrug.dosageForm,
          strength: newDrug.strength,
          unit: newDrug.unit,
          category: newDrug.category,
          pricePerBox: newDrug.pricePerBox,
          isActive: newDrug.isActive
        }
      };
    });

    console.log(`🎉 Successfully created drug and stock: ${result.drug.name}`);

    // ✅ Fixed: Response format ที่ modal คาดหวัง
    return NextResponse.json({
      success: true,
      data: result, // ส่งข้อมูล stock พร้อม drug info กลับไป
      message: `เพิ่มยา "${result.drug.name}" เรียบร้อยแล้ว`
    });

  } catch (error) {
    console.error("Create drug error:", error);

    // ✅ Fixed: Type-safe error handling
    if (error instanceof ZodError) {
      console.log('❌ Validation error details:', error.issues);
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: error.issues
            .map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", "),
          validationErrors: error.issues // ส่ง validation errors แยก
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // ✅ Fixed: Type-safe meta target access
        const target = error.meta?.target;
        const field = Array.isArray(target) ? target[0] : undefined;
        let message = "ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว";

        if (field === "hospitalDrugCode") {
          message = "รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว";
        } else if (field === "name") {
          message = "ชื่อยานี้มีอยู่ในระบบแล้ว";
        }

        return NextResponse.json({ error: message }, { status: 409 });
      }
    }

    // Generic error handling
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างยาใหม่" },
      { status: 500 }
    );
  }
}