// 📄 File: app/api/drugs/route.ts (FIXED CLEAN)
// API สำหรับสร้างยาใหม่พร้อมสต็อกเริ่มต้น - Type-safe

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError, ZodIssue } from "zod";
import { Prisma, Department, DrugCategory } from "@prisma/client";

// ✅ Schema สำหรับ validation การสร้างยาใหม่
const createDrugSchema = z.object({
  hospitalDrugCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  genericName: z
    .string()
    .max(255)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  dosageForm: z.enum(
    [
      "APP",
      "BAG",
      "CAP",
      "CR",
      "DOP",
      "ENE",
      "GEL",
      "HAN",
      "IMP",
      "INJ",
      "LIQ",
      "LOT",
      "LVP",
      "MDI",
      "MIX",
      "NAS",
      "NB",
      "OIN",
      "PAT",
      "POW",
      "PWD",
      "SAC",
      "SOL",
      "SPR",
      "SUP",
      "SUS",
      "SYR",
      "TAB",
      "TUR",
    ],
    { message: "รูปแบบยาไม่ถูกต้อง" }
  ),
  strength: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  unit: z.string().min(1).max(20),
  packageSize: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  pricePerBox: z.number().min(0).max(999999.99),
  category: z.enum(
    [
      "REFER",
      "HAD",
      "NARCOTIC",
      "REFRIGERATED",
      "PSYCHIATRIC",
      "FLUID",
      "GENERAL",
      "TABLET",
      "SYRUP",
      "INJECTION",
      "EXTEMP",
      "ALERT",
    ],
    { message: "ประเภทยาไม่ถูกต้อง" }
  ),
  notes: z
    .string()
    .max(1000)
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),
  initialQuantity: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(10),
  department: z.enum(["PHARMACY", "OPD"], { message: "แผนกไม่ถูกต้อง" }),
});

// GET - ดึงรายการยาทั้งหมด
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const department = searchParams.get("department") as Department | null;

    // Type-safe where clause
    const where: Prisma.DrugWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { hospitalDrugCode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (
      category &&
      Object.values(DrugCategory).includes(category as DrugCategory)
    ) {
      where.category = category as DrugCategory;
    }

    const drugs = await prisma.drug.findMany({
      where,
      include: {
        stocks: department ? { where: { department } } : true,
        _count: { select: { stocks: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: drugs });
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
    const body = await request.json();
    const validatedData = createDrugSchema.parse(body);

    const existingDrugByCode = await prisma.drug.findFirst({
      where: { hospitalDrugCode: validatedData.hospitalDrugCode },
    });
    if (existingDrugByCode) {
      return NextResponse.json(
        { error: "รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว" },
        { status: 409 }
      );
    }

    const initialTotalValue =
      validatedData.initialQuantity * validatedData.pricePerBox;

    const result = await prisma.$transaction(async (tx) => {
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

      // secondary stock (ไม่ต้องเก็บค่าไว้ก็ได้)
      const secondaryDepartment =
        validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY";
      await tx.stock.create({
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

      if (validatedData.initialQuantity > 0) {
        await tx.stockTransaction.create({
          data: {
            stockId: primaryStock.id,
            userId: "SYSTEM",
            type: "TRANSFER_IN",
            quantity: validatedData.initialQuantity,
            beforeQty: 0,
            afterQty: validatedData.initialQuantity,
            reference: `INITIAL_${newDrug.hospitalDrugCode}`,
            note: `สร้างสต็อกเริ่มต้น - ${newDrug.name}`,
          },
        });
      }

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
          isActive: newDrug.isActive,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `เพิ่มยา "${result.drug.name}" เรียบร้อยแล้ว`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "ข้อมูลไม่ถูกต้อง",
          details: error.issues
            .map(
              (issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`
            )
            .join(", "),
          validationErrors: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target;
        const field = Array.isArray(target) ? target[0] : undefined;
        let message = "ข้อมูลซ้ำกับรายการที่มีอยู่แล้ว";
        if (field === "hospitalDrugCode")
          message = "รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว";
        else if (field === "name") message = "ชื่อยานี้มีอยู่ในระบบแล้ว";
        return NextResponse.json({ error: message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้างยาใหม่" },
      { status: 500 }
    );
  }
}
