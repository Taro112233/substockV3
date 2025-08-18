// 📄 File: services/transfer-action-service.ts - Updated for cookie auth

import { prisma, updateStockAfterTransfer } from '@/lib/prisma'

interface UserWithDept {
  userId: string
  username: string
  firstName: string
  lastName: string
  department: 'PHARMACY' | 'OPD'
  role?: string
}

class TransferActionService {
  async handleApprove(transfer: any, user: UserWithDept, note: string, items: any[]) {
    console.log(`📝 handleApprove: ${user.username} approving transfer ${transfer.id}`)
    
    // Validate user can approve
    if (transfer.toDept !== user.department) {
      throw new Error('You can only approve transfers to your department')
    }

    if (transfer.status !== 'PENDING') {
      throw new Error('Transfer is not in pending status')
    }

    // Use transaction for data consistency
    return await prisma.$transaction(async (tx) => {
      // Update transfer
      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'APPROVED',
          approverId: user.userId,
          approvedAt: new Date(),
          approvalNote: note
        }
      })

      // Update items with approved quantities
      for (const item of items) {
        await tx.transferItem.update({
          where: { id: item.id },
          data: {
            approvedQty: item.approvedQty || item.requestedQty
          }
        })
      }

      console.log(`✅ Transfer ${transfer.id} approved successfully`)
      return updatedTransfer
    })
  }

  async handlePrepare(transfer: any, user: UserWithDept, note: string, items: any[]) {
    console.log(`📦 handlePrepare: ${user.username} preparing transfer ${transfer.id}`)
    
    // Validate user can prepare
    if (transfer.toDept !== user.department) {
      throw new Error('You can only prepare transfers for your department')
    }

    if (transfer.status !== 'APPROVED') {
      throw new Error('Transfer must be approved before preparation')
    }

    return await prisma.$transaction(async (tx) => {
      // Update transfer
      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'PREPARED',
          dispenserId: user.userId,
          dispensedAt: new Date()
        }
      })

      // Calculate total value
      let totalValue = 0

      // Update items with dispensed quantities and batch info
      for (const item of items) {
        const itemValue = (item.dispensedQty || 0) * (item.unitPrice || 0)
        totalValue += itemValue

        await tx.transferItem.update({
          where: { id: item.id },
          data: {
            dispensedQty: item.dispensedQty || 0,
            lotNumber: item.lotNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            manufacturer: item.manufacturer,
            unitPrice: item.unitPrice || 0,
            totalValue: itemValue,
            itemNote: item.itemNote
          }
        })
      }

      // Update total value
      await tx.transfer.update({
        where: { id: transfer.id },
        data: { totalValue }
      })

      console.log(`✅ Transfer ${transfer.id} prepared successfully, total value: ฿${totalValue}`)
      return updatedTransfer
    })
  }

  async handleReceive(transfer: any, user: UserWithDept, note: string, items: any[]) {
    console.log(`✅ handleReceive: ${user.username} receiving transfer ${transfer.id}`)
    
    // Validate user can receive
    if (transfer.fromDept !== user.department) {
      throw new Error('You can only receive transfers for your department')
    }

    if (transfer.status !== 'PREPARED') {
      throw new Error('Transfer must be prepared before receiving')
    }

    return await prisma.$transaction(async (tx) => {
      // Update transfer
      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'DELIVERED',
          receiverId: user.userId,
          receivedAt: new Date()
        }
      })

      // Update items with received quantities
      for (const item of items) {
        await tx.transferItem.update({
          where: { id: item.id },
          data: {
            receivedQty: item.receivedQty || item.dispensedQty || 0
          }
        })
      }

      // Update stock levels for both departments
      const stockItems = items
        .filter(item => (item.receivedQty || item.dispensedQty || 0) > 0)
        .map(item => ({
          drugId: item.drugId,
          receivedQty: item.receivedQty || item.dispensedQty || 0,
          unitPrice: item.unitPrice || 0
        }))

      if (stockItems.length > 0) {
        console.log(`💊 Updating stock for ${stockItems.length} items`)
        await updateStockAfterTransfer(
          transfer.id,
          stockItems,
          transfer.fromDept,
          transfer.toDept,
          user.userId,
          transfer.requisitionNumber
        )
      }

      console.log(`🎉 Transfer ${transfer.id} received and stock updated successfully`)
      return updatedTransfer
    })
  }

  async handleCancel(transfer: any, user: UserWithDept, note: string) {
    console.log(`❌ handleCancel: ${user.username} cancelling transfer ${transfer.id}`)
    
    // Validate user can cancel
    const canCancel = (
      (transfer.fromDept === user.department && transfer.status === 'PENDING') ||
      (transfer.toDept === user.department && transfer.status === 'PENDING')
    )

    if (!canCancel) {
      throw new Error('You cannot cancel this transfer')
    }

    const updatedTransfer = await prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        status: 'CANCELLED',
        approvalNote: note
      }
    })

    console.log(`✅ Transfer ${transfer.id} cancelled successfully`)
    return updatedTransfer
  }
}

export const transferActionService = new TransferActionService()