// src/app/debts/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { DebtsClient } from '@/components/debts/debts-client'

export default async function DebtsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const debts = await prisma.debt.findMany({
    where:   { userId },
    include: { payments: { orderBy: { paidAt: 'desc' }, take: 10 } },
    orderBy: { createdAt: 'desc' },
  })

  const debtsNorm = debts.map(d => ({
    ...d,
    originalAmount:      Number(d.originalAmount),
    currentBalance:      Number(d.currentBalance),
    monthlyInterestRate: Number(d.monthlyInterestRate),
    monthlyPayment:      Number(d.monthlyPayment),
    payments:            d.payments.map(p => ({
      ...p,
      amount: Number(p.amount),
    })),
  }))

  return (
    <AppLayout session={session}>
      <DebtsClient debts={debtsNorm as any} />
    </AppLayout>
  )
}
