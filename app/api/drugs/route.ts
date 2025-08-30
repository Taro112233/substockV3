// 📄 File: app/api/drugs/route.ts (FIXED - Use Current User ID)
// แก้ไขปัญหา Foreign Key Constraint โดยใช้ userId จริง

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z, ZodError, ZodIssue } from "zod";
import { Prisma, Department, DrugCategory } from "@prisma/client";
import { getServerUser } from "@/lib/auth-server"; // ✅ เพิ่ม import สำหรับ auth

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
      "CANCELLED"
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
    console.log("🔍 GET /api/drugs - Starting request");
    
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const department = searchParams.get("department") as Department | null;

    console.log("🔍 Search params:", { search, category, department });

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

    console.log("✅ GET /api/drugs - Found", drugs.length, "drugs");
    return NextResponse.json({ success: true, data: drugs });
  } catch (error) {
    console.error("❌ GET /api/drugs - Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลยา" },
      { status: 500 }
    );
  }
}

// POST - สร้างยาใหม่พร้อมสต็อกเริ่มต้น
export async function POST(request: NextRequest) {
  console.log("🔍 POST /api/drugs - Starting request");
  
  try {
    // ✅ Step 1: Get current user from authentication
    const currentUser = await getServerUser();
    if (!currentUser) {
      console.log("❌ No authenticated user found");
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบใหม่" },
        { status: 401 }
      );
    }
    console.log("✅ Current user:", currentUser.userId, currentUser.username);

    // ✅ Step 2: Parse request body
    const body = await request.json();
    console.log("🔍 Request body:", JSON.stringify(body, null, 2));

    // ✅ Step 3: Validate data
    console.log("🔍 Validating data with Zod schema...");
    const validatedData = createDrugSchema.parse(body);
    console.log("✅ Data validation passed:", JSON.stringify(validatedData, null, 2));

    // ✅ Step 4: Check for existing drug code
    console.log("🔍 Checking for existing drug code:", validatedData.hospitalDrugCode);
    const existingDrugByCode = await prisma.drug.findFirst({
      where: { hospitalDrugCode: validatedData.hospitalDrugCode },
    });
    
    if (existingDrugByCode) {
      console.log("❌ Drug code already exists:", validatedData.hospitalDrugCode);
      return NextResponse.json(
        { error: "รหัสยาโรงพยาบาลนี้มีอยู่ในระบบแล้ว" },
        { status: 409 }
      );
    }
    console.log("✅ Drug code is available");

    // ✅ Step 5: Calculate initial values
    const initialTotalValue = validatedData.initialQuantity * validatedData.pricePerBox;
    console.log("🔍 Initial stock calculation:", {
      quantity: validatedData.initialQuantity,
      pricePerBox: validatedData.pricePerBox,
      totalValue: initialTotalValue
    });

    // ✅ Step 6: Start database transaction
    console.log("🔍 Starting database transaction...");
    const result = await prisma.$transaction(async (tx) => {
      console.log("🔍 Creating new drug record...");
      
      // Create new drug
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
      console.log("✅ Drug created with ID:", newDrug.id);

      // Create primary stock record
      console.log("🔍 Creating primary stock record for department:", validatedData.department);
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
      console.log("✅ Primary stock created with ID:", primaryStock.id);

      // Create secondary stock record (opposite department)
      const secondaryDepartment = validatedData.department === "PHARMACY" ? "OPD" : "PHARMACY";
      console.log("🔍 Creating secondary stock record for department:", secondaryDepartment);
      
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
      console.log("✅ Secondary stock created with ID:", secondaryStock.id);

      // ✅ Create initial transaction if there's initial quantity (ใช้ current user ID)
      if (validatedData.initialQuantity > 0) {
        console.log("🔍 Creating initial stock transaction with user ID:", currentUser.userId);
        const transaction = await tx.stockTransaction.create({
          data: {
            stockId: primaryStock.id,
            userId: currentUser.userId, // ✅ ใช้ userId จริงแทน "SYSTEM"
            type: "TRANSFER_IN",
            quantity: validatedData.initialQuantity,
            beforeQty: 0,
            afterQty: validatedData.initialQuantity,
            reference: `INITIAL_${newDrug.hospitalDrugCode}`,
            note: `สร้างสต็อกเริ่มต้น - ${newDrug.name} (โดย ${currentUser.username})`,
          },
        });
        console.log("✅ Initial transaction created with ID:", transaction.id);
      }

      // Return combined result
      const result = {
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

      console.log("✅ Transaction completed successfully");
      return result;
    });

    console.log("✅ POST /api/drugs - Success, returning result");
    return NextResponse.json({
      success: true,
      data: result,
      message: `เพิ่มยา "${result.drug.name}" เรียบร้อยแล้ว`,
    });

  } catch (error) {
    console.error("❌ POST /api/drugs - Error occurred:");
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      console.error("❌ Zod validation errors:", error.issues);
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

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("❌ Prisma error code:", error.code);
      console.error("❌ Prisma error meta:", error.meta);
      
      if (error.code === "P2002") {
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

      if (error.code === "P2003") {
        console.error("❌ Foreign key constraint error");
        return NextResponse.json(
          { 
            error: "ข้อผิดพลาดการเชื่อมโยงข้อมูล", 
            details: "ไม่พบข้อมูลอ้างอิงที่จำเป็น กรุณาตรวจสอบข้อมูลผู้ใช้" 
          },
          { status: 400 }
        );
      }
      
      // Other Prisma errors
      return NextResponse.json(
        { 
          error: "ข้อผิดพลาดของฐานข้อมูล", 
          details: `Prisma Error ${error.code}: ${error.message}` 
        },
        { status: 500 }
      );
    }

    // Handle other database connection errors
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error("❌ Prisma initialization error:", error.message);
      return NextResponse.json(
        { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" },
        { status: 500 }
      );
    }

    if (error instanceof Prisma.PrismaClientRustPanicError) {
      console.error("❌ Prisma engine panic:", error.message);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดร้ายแรงของฐานข้อมูล" },
        { status: 500 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      console.error("❌ JSON parsing error");
      return NextResponse.json(
        { error: "ข้อมูลที่ส่งมาไม่ใช่ JSON ที่ถูกต้อง" },
        { status: 400 }
      );
    }

    // Generic error fallback
    console.error("❌ Unknown error:", error);
    return NextResponse.json(
      { 
        error: "เกิดข้อผิดพลาดในการสร้างยาใหม่",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}