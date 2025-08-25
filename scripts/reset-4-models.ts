// scripts/reset-4-models.ts
// ลบและ reset เฉพาะ 4 models: drug_batches, drugs, stock_transactions, stocks
// สำหรับ Hospital Pharmacy V3.0

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function reset4Models() {
  console.log('🗑️  Resetting 4 Models: drug_batches, drugs, stock_transactions, stocks')
  console.log('====================================================================')

  try {
    await prisma.$transaction(async (tx) => {
      console.log('🔄 Starting transaction...')

      // ลำดับการลบต้องเรียงตาม foreign key dependencies
      // 1. ลบ stock_transactions ก่อน (มี FK ไป stocks, drug_batches)
      console.log('1️⃣ Deleting stock_transactions...')
      const deletedTransactions = await tx.stockTransaction.deleteMany()
      console.log(`   ✅ Deleted ${deletedTransactions.count} stock_transactions`)

      // 2. ลบ stocks (มี FK ไป drugs)
      console.log('2️⃣ Deleting stocks...')
      const deletedStocks = await tx.stock.deleteMany()
      console.log(`   ✅ Deleted ${deletedStocks.count} stocks`)

      // 3. ลบ drug_batches (มี FK ไป drugs)
      console.log('3️⃣ Deleting drug_batches...')
      const deletedBatches = await tx.drugBatch.deleteMany()
      console.log(`   ✅ Deleted ${deletedBatches.count} drug_batches`)

      // 4. ลบ drugs (เป็น parent table)
      console.log('4️⃣ Deleting drugs...')
      const deletedDrugs = await tx.drug.deleteMany()
      console.log(`   ✅ Deleted ${deletedDrugs.count} drugs`)

      console.log('\n🎊 Transaction completed successfully!')
    })

    // ตรวจสอบผลลัพธ์
    console.log('\n📊 Verification - Current record counts:')
    const [drugs, stocks, batches, transactions] = await Promise.all([
      prisma.drug.count(),
      prisma.stock.count(), 
      prisma.drugBatch.count(),
      prisma.stockTransaction.count()
    ])

    console.log(`   📦 Drugs: ${drugs}`)
    console.log(`   📋 Stocks: ${stocks}`)
    console.log(`   🏷️  Drug Batches: ${batches}`)
    console.log(`   📝 Stock Transactions: ${transactions}`)

    const allCleared = drugs === 0 && stocks === 0 && batches === 0 && transactions === 0
    console.log(`   ${allCleared ? '✅' : '❌'} All 4 models ${allCleared ? 'cleared' : 'NOT fully cleared'}`)

    console.log('\n🚀 Ready for fresh data import!')
    console.log('   Next step: npm run db:seed:csv')

  } catch (error) {
    console.error('❌ Reset failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Direct execution
if (require.main === module) {
  reset4Models()
    .then(() => {
      console.log('✅ Reset completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Reset failed:', error)
      process.exit(1)
    })
}