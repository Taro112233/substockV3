// 📄 File: app/api/drugs/check-code/route.ts
// API สำหรับตรวจสอบรหัสยาซ้ำแบบเรียลไทม์

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema สำหรับ validation
const checkCodeSchema = z.object({
  code: z.string().min(1).max(50)
});

// GET - ตรวจสอบรหัสยาโรงพยาบาลซ้ำ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสยา" },
        { status: 400 }
      );
    }

    // Validate input
    const { code: validatedCode } = checkCodeSchema.parse({ code });

    // Check if code exists
    const existingDrug = await prisma.drug.findFirst({
      where: {
        hospitalDrugCode: validatedCode,
        isActive: true
      },
      select: {
        id: true,
        hospitalDrugCode: true,
        name: true,
        genericName: true,
        dosageForm: true,
        strength: true,
        unit: true,
        category: true,
        packageSize: true,
        pricePerBox: true,
        notes: true,
        createdAt: true,
        stocks: {
          select: {
            department: true,
            totalQuantity: true
          }
        }
      }
    });

    // Generate suggestions for similar codes
    const similarCodes = await prisma.drug.findMany({
      where: {
        hospitalDrugCode: {
          contains: validatedCode.slice(0, 3), // ใช้ 3 ตัวแรก
          mode: 'insensitive'
        },
        isActive: true,
        NOT: {
          hospitalDrugCode: validatedCode
        }
      },
      select: {
        hospitalDrugCode: true,
        name: true
      },
      take: 5,
      orderBy: {
        hospitalDrugCode: 'asc'
      }
    });

    if (existingDrug) {
      return NextResponse.json({
        available: false,
        exists: true,
        drug: existingDrug,
        suggestions: similarCodes,
        message: `รหัส "${validatedCode}" มีอยู่ในระบบแล้ว`
      });
    }

    return NextResponse.json({
      available: true,
      exists: false,
      suggestions: similarCodes,
      message: `รหัส "${validatedCode}" ใช้ได้`
    });

  } catch (error) {
    console.error('Check code error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "รหัสยาไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสยา" },
      { status: 500 }
    );
  }
}

// POST - ตรวจสอบหลายรหัสพร้อมกัน (สำหรับ bulk import)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codes } = body;

    if (!Array.isArray(codes)) {
      return NextResponse.json(
        { error: "codes ต้องเป็น array" },
        { status: 400 }
      );
    }

    // Validate all codes
    const validatedCodes = codes.map(code => 
      checkCodeSchema.parse({ code }).code
    );

    // Check existing codes
    const existingDrugs = await prisma.drug.findMany({
      where: {
        hospitalDrugCode: {
          in: validatedCodes
        },
        isActive: true
      },
      select: {
        hospitalDrugCode: true,
        name: true,
        genericName: true,
        category: true
      }
    });

    const existingCodes = new Set(
      existingDrugs.map(drug => drug.hospitalDrugCode)
    );

    const results = validatedCodes.map(code => ({
      code,
      available: !existingCodes.has(code),
      exists: existingCodes.has(code),
      drug: existingDrugs.find(d => d.hospitalDrugCode === code) || null
    }));

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: validatedCodes.length,
        available: results.filter(r => r.available).length,
        existing: results.filter(r => !r.available).length
      }
    });

  } catch (error) {
    console.error('Bulk check codes error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "รหัสยาบางตัวไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสยา" },
      { status: 500 }
    );
  }
}