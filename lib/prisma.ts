// 📄 File: lib/prisma.ts

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ⭐ Helper functions สำหรับ Transfer operations

export async function updateStockAfterTransfer(
  transferId: string,
  items: Array<{
    drugId: string
    receivedQty: number
    unitPrice: number
  }>,
  fromDept: 'PHARMACY' | 'OPD',
  toDept: 'PHARMACY' | 'OPD',
  userId: string,
  requisitionNumber: string
) {
  return await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (item.receivedQty <= 0) continue

      // 1. ลดสต็อกจากแผนกต้นทาง (toDept - คลังยา)
      const sourceStock = await tx.stock.findUnique({
        where: {
          drugId_department: {
            drugId: item.drugId,
            department: toDept
          }
        }
      })

      if (sourceStock && sourceStock.totalQuantity >= item.receivedQty) {
        await tx.stock.update({
          where: {
            drugId_department: {
              drugId: item.drugId,
              department: toDept
            }
          },
          data: {
            totalQuantity: sourceStock.totalQuantity - item.receivedQty,
            totalValue: sourceStock.totalValue - (item.receivedQty * item.unitPrice)
          }
        })

        // สร้าง transaction record สำหรับการจ่ายออก
        await tx.stockTransaction.create({
          data: {
            stockId: sourceStock.id,
            userId: userId,
            transferId: transferId,
            type: 'TRANSFER_OUT',
            quantity: -item.receivedQty,
            beforeQty: sourceStock.totalQuantity,
            afterQty: sourceStock.totalQuantity - item.receivedQty,
            unitCost: item.unitPrice,
            totalCost: -(item.receivedQty * item.unitPrice),
            reference: requisitionNumber,
            note: `จ่ายให้ ${fromDept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}`
          }
        })
      }

      // 2. เพิ่มสต็อกให้แผนกปลายทาง (fromDept - OPD)
      const destStock = await tx.stock.findUnique({
        where: {
          drugId_department: {
            drugId: item.drugId,
            department: fromDept
          }
        }
      })

      if (destStock) {
        await tx.stock.update({
          where: {
            drugId_department: {
              drugId: item.drugId,
              department: fromDept
            }
          },
          data: {
            totalQuantity: destStock.totalQuantity + item.receivedQty,
            totalValue: destStock.totalValue + (item.receivedQty * item.unitPrice)
          }
        })

        // สร้าง transaction record สำหรับการรับเข้า
        await tx.stockTransaction.create({
          data: {
            stockId: destStock.id,
            userId: userId,
            transferId: transferId,
            type: 'TRANSFER_IN',
            quantity: item.receivedQty,
            beforeQty: destStock.totalQuantity,
            afterQty: destStock.totalQuantity + item.receivedQty,
            unitCost: item.unitPrice,
            totalCost: item.receivedQty * item.unitPrice,
            reference: requisitionNumber,
            note: `รับจาก ${toDept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'}`
          }
        })
      } else {
        // สร้าง stock record ใหม่ถ้าไม่มี
        const newStock = await tx.stock.create({
          data: {
            drugId: item.drugId,
            department: fromDept,
            totalQuantity: item.receivedQty,
            totalValue: item.receivedQty * item.unitPrice,
            minimumStock: 10
          }
        })

        await tx.stockTransaction.create({
          data: {
            stockId: newStock.id,
            userId: userId,
            transferId: transferId,
            type: 'TRANSFER_IN',
            quantity: item.receivedQty,
            beforeQty: 0,
            afterQty: item.receivedQty,
            unitCost: item.unitPrice,
            totalCost: item.receivedQty * item.unitPrice,
            reference: requisitionNumber,
            note: `รับจาก ${toDept === 'PHARMACY' ? 'แผนกเภสัชกรรม' : 'แผนก OPD'} (สต็อกใหม่)`
          }
        })
      }
    }
  })
}