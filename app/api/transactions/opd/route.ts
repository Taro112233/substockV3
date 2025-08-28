// 📄 File: app/api/transactions/opd/route.ts
// ⭐ ENHANCED: Include minimum stock fields in response

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // ดึงข้อมูล transactions จากแผนก OPD
    const transactions = await prisma.stockTransaction.findMany({
      where: {
        stock: {
          department: "OPD",
        },
      },
      include: {
        stock: {
          include: {
            drug: {
              select: {
                hospitalDrugCode: true,
                name: true,
                genericName: true,
                dosageForm: true,
                strength: true,
                unit: true,
                packageSize: true,
                pricePerBox: true,
                category: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        // ⭐ เพิ่ม transfer relation ถ้ามี
        transfer: {
          select: {
            id: true,
            requisitionNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 9999,
    });

    // คำนวณสถิติ
    const totalTransactions = transactions.length;

    const totalValue = transactions.reduce((sum, transaction) => {
      const pricePerBox = transaction.stock.drug.pricePerBox || 0;
      const actualCost = Math.abs(transaction.quantity) * pricePerBox;
      return sum + actualCost;
    }, 0);

    const recentTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.createdAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return transactionDate >= sevenDaysAgo;
    }).length;

    // ⭐ ENHANCED: แปลงข้อมูลพร้อมฟิลด์ minimum stock
    const mappedTransactions = transactions.map((transaction) => {
      const pricePerBox = transaction.stock.drug.pricePerBox || 0;
      const calculatedTotalCost = Math.abs(transaction.quantity) * pricePerBox;

      return {
        id: transaction.id,
        type: transaction.type,

        // 📦 STOCK QUANTITY FIELDS
        quantity: transaction.quantity,
        beforeQty: transaction.beforeQty,
        afterQty: transaction.afterQty,

        // 🎯 MINIMUM STOCK FIELDS - ⭐ เพิ่มใหม่
        minStockChange: transaction.minStockChange,
        beforeMinStock: transaction.beforeMinStock,
        afterMinStock: transaction.afterMinStock,

        // 💰 FINANCIAL FIELDS
        unitCost: transaction.unitCost,
        totalCost: transaction.totalCost,

        // 📄 REFERENCE & AUDIT FIELDS
        reference: transaction.reference,
        note: transaction.note,
        batchNumber: transaction.batchId,
        createdAt: transaction.createdAt,

        // 🧬 RELATED DATA
        drug: {
          hospitalDrugCode: transaction.stock.drug.hospitalDrugCode,
          name: transaction.stock.drug.name,
          genericName: transaction.stock.drug.genericName,
          dosageForm: transaction.stock.drug.dosageForm,
          strength: transaction.stock.drug.strength || "",
          unit: transaction.stock.drug.unit,
          packageSize: transaction.stock.drug.packageSize,
          pricePerBox: pricePerBox,
          category: transaction.stock.drug.category,
        },
        user: {
          firstName: transaction.user.firstName,
          lastName: transaction.user.lastName,
        },
        transfer: transaction.transfer || null,

        // ⭐ เพิ่ม calculated cost สำหรับ reference
        calculatedCost: calculatedTotalCost,
      };
    });

    const responseData = {
      transactions: mappedTransactions,
      stats: {
        totalTransactions,
        totalValue,
        recentTransactions,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
      // ⭐ Debug info
      debug: {
        totalTransactions: mappedTransactions.length,
        minStockTransactions: mappedTransactions.filter((t) =>
          [
            "MIN_STOCK_INCREASE",
            "MIN_STOCK_DECREASE",
            "MIN_STOCK_RESET",
          ].includes(t.type)
        ).length,
        sampleMinStockTransaction:
          mappedTransactions.find((t) =>
            [
              "MIN_STOCK_INCREASE",
              "MIN_STOCK_DECREASE",
              "MIN_STOCK_RESET",
            ].includes(t.type)
          ) || null,
      },
    });
  } catch (error) {
    console.error("OPD transactions API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ไม่สามารถดึงข้อมูลประวัติแผนก OPD ได้",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  } finally {
    // ตรวจสอบการเชื่อมต่อ Prisma
    await prisma.$disconnect();
  }
}

// ✅ OPTIONS method สำหรับ CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
