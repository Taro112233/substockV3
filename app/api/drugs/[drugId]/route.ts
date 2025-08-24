
// 📄 File: app/api/drugs/route.ts (FIXED TypeScript Strict)
// API สำหรับสร้างยาใหม่พร้อมสต็อกเริ่มต้น - แก้ไข TypeScript errors

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z, ZodError, ZodIssue } from "zod";
import { Prisma } from "@prisma/client";

// Schema สำหรับ validation การสร้างยาใหม่
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
    .optional(),
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
    .optional(),
  unit: z
    .string()
    .min(1, "หน่วยเป็นข้อมูลที่จำเป็น")
    .max(20, "หน่วยต้องไม่เกิน 20 ตัวอักษร"),
  packageSize: z
    .string()
    .max(50, "ขนาดบรรจุต้องไม่เกิน 50 ตัวอักษร")
    .nullable()
    .optional(),
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
    .optional(),
  // Stock data
  department: z.enum(["PHARMACY", "OPD"], { message: "แผนกไม่ถูกต้อง" }),
  initialQuantity: z.number().min(0, "จำนวนเริ่มต้นต้องไม่น้อยกว่า 0"),
  minimumStock: z.number().min(0, "จำนวนขั้นต่ำต้องไม่น้อยกว่า 0"),
});

// GET - ดึงรายการยาทั้งหมด (สำหรับ search/autocomplete)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "ไม่พบ token การเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const dosageForm = searchParams.get("dosageForm");
    const isActive = searchParams.get("active") !== "false";

    // ✅ Fixed: ใช้ Prisma.DrugWhereInput แทน any
    const where: Prisma.DrugWhereInput = {
      isActive,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { hospitalDrugCode: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      // ✅ Fixed: ใช้ proper enum type
      where.category = category as Prisma.EnumDrugCategoryFilter;
    }

    if (dosageForm) {
      // ✅ Fixed: ใช้ proper enum type
      where.dosageForm = dosageForm as Prisma.EnumDosageFormFilter;
    }

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        stocks: {
          select: {
            id: true,
            department: true,
            totalQuantity: true,
            minimumStock: true,
            totalValue: true,
          },
        },
        _count: {
          select: {
            transferItems: true,
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: 100, // จำกัดจำนวนสูงสุด
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

// POST - สร้างยาใหม่พร้อมสต็อกเริ่มต้น
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "ไม่พบ token การเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
    }

    // Get and validate input data
    const body = await request.json();
    const validatedData = createDrugSchema.parse(body);

    // ตรวจสอบว่ารหัสยาซ้ำหรือไม่
    const existingDrugByCode = await prisma.drug.findFirst({
      where: {
        hospitalDrugCode: validatedData.hospitalDrugCode,
      },
    });

    if (existingDrugByCode) {
      return NextResponse.json(
        {
          error: "รหัสยานี้มีอยู่ในระบบแล้ว",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าชื่อยาซ้ำหรือไม่
    const existingDrugByName = await prisma.drug.findFirst({
      where: {
        name: validatedData.name,
      },
    });

    if (existingDrugByName) {
      return NextResponse.json(
        {
          error: "ชื่อยานี้มีอยู่ในระบบแล้ว",
        },
        { status: 400 }
      );
    }

    // คำนวณมูลค่าเริ่มต้น
    const initialTotalValue =
      validatedData.initialQuantity * validatedData.pricePerBox;

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

      // สร้างสต็อกสำหรับทั้ง 2 แผนก
      const primaryDepartment = validatedData.department;
      const secondaryDepartment =
        validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY";

      // สร้างสต็อกสำหรับแผนกหลัก (ที่มีจำนวนเริ่มต้น)
      const primaryStock = await tx.stock.create({
        data: {
          drugId: newDrug.id,
          department: primaryDepartment,
          totalQuantity: validatedData.initialQuantity,
          reservedQty: 0,
          minimumStock: validatedData.minimumStock,
          fixedStock: 0,
          totalValue: initialTotalValue,
        },
      });

      // สร้างสต็อกสำหรับแผนกรอง (เริ่มต้นที่ 0)
      const secondaryStock = await tx.stock.create({
        data: {
          drugId: newDrug.id,
          department: secondaryDepartment,
          totalQuantity: 0,
          reservedQty: 0,
          minimumStock: 0,
          fixedStock: 0,
          totalValue: 0,
        },
      });

      // บันทึก transaction log เริ่มต้น (ถ้ามีจำนวนเริ่มต้น)
      if (validatedData.initialQuantity > 0) {
        await tx.stockTransaction.create({
          data: {
            stockId: primaryStock.id,
            userId: decoded.userId,
            type: "RECEIVE_EXTERNAL",
            quantity: validatedData.initialQuantity,
            beforeQty: 0,
            afterQty: validatedData.initialQuantity,
            unitCost: validatedData.pricePerBox,
            totalCost: initialTotalValue,
            reference: `INITIAL_STOCK_${Date.now()}`,
            note: `สต็อกเริ่มต้นเมื่อสร้างยาใหม่ (แผนก ${primaryDepartment})`,
          },
        });
      }

      // บันทึก transaction log สำหรับแผนกรอง (เริ่มต้น 0)
      await tx.stockTransaction.create({
        data: {
          stockId: secondaryStock.id,
          userId: decoded.userId,
          type: "ADJUST_INCREASE",
          quantity: 0,
          beforeQty: 0,
          afterQty: 0,
          unitCost: validatedData.pricePerBox,
          totalCost: 0,
          reference: `INITIAL_STOCK_${Date.now()}`,
          note: `สร้างสต็อกเริ่มต้นสำหรับแผนก ${secondaryDepartment} (เริ่มต้น 0)`,
        },
      });

      // ส่งคืนข้อมูล primary stock สำหรับ frontend
      return {
        ...primaryStock,
        drug: {
          ...newDrug,
          stocks: [primaryStock, secondaryStock],
        },
      };
    });

    const secondaryDepartment =
      validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY";

    return NextResponse.json({
      success: true,
      data: result,
      message: `สร้างยา "${validatedData.name}" สำเร็จ | ${
        validatedData.department
      }: ${validatedData.initialQuantity.toLocaleString()} กล่อง (minimum: ${validatedData.minimumStock}) | ${secondaryDepartment}: 0 กล่อง (minimum: 0)`,
      details: {
        primaryDepartment: validatedData.department,
        primaryQuantity: validatedData.initialQuantity,
        primaryMinimumStock: validatedData.minimumStock,
        secondaryDepartment:
          validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY",
        secondaryQuantity: 0,
        secondaryMinimumStock: 0,
        totalStocks: 2,
      },
    });
  } catch (error) {
    console.error("Create drug error:", error);

    // ✅ Fixed: Type-safe error handling
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: error.issues
            .map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", "),
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

        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // Generic error handling
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างยาใหม่" },
      { status: 500 }
    );
  }
}