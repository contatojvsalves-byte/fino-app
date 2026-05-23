// src/app/transactions/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { TransactionsClient } from '@/components/transactions/transactions-client'

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [txRaw, categories] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take:    200,
    }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      orderBy: { name: 'asc' },
    }),
  ])

  const transactions = txRaw.map(t => ({
    ...t,
    amount: Number(t.amount),
    category: { ...t.category },
  }))

  return (
    <AppLayout session={session}>
      <TransactionsClient transactions={transactions as any} categories={categories} />
    </AppLayout>
  )
}
