// src/app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import {
  calcMonthSummary,
  calcPatrimony,
  calcCategoryExpenses,
  generateAlerts,
  currentMonth,
  getLast6Months,
  calcPatrimonyEvolution,
} from '@/lib/finance'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Redirecionar para onboarding se nunca configurou renda
  const profile = await prisma.financialProfile.findUnique({ where: { userId } })
  if (!profile || Number(profile.monthlyIncome) === 0) {
    redirect('/onboarding')
  }

  // Buscar dados em paralelo
  const [txRaw, debts, budgetLimits, userPlan] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.debt.findMany({
      where:   { userId, status: { in: ['ACTIVE', 'PARTIAL'] } },
      orderBy: { monthlyInterestRate: 'desc' },
    }),
    prisma.budgetLimit.findMany({ where: { userId } }),
    prisma.userPlan.findUnique({ where: { userId } }),
  ])

  const transactions = txRaw.map(t => ({
    ...t,
    amount:   Number(t.amount),
    category: { ...t.category },
  }))

  const debtsNorm = debts.map(d => ({
    ...d,
    originalAmount:      Number(d.originalAmount),
    currentBalance:      Number(d.currentBalance),
    monthlyInterestRate: Number(d.monthlyInterestRate),
    monthlyPayment:      Number(d.monthlyPayment),
  }))

  const budgetNorm = budgetLimits.map(b => ({
    categoryId: b.categoryId,
    amount:     Number(b.amount),
  }))

  const month   = currentMonth()
  const renda   = Number(profile!.monthlyIncome)
  const summary = calcMonthSummary(transactions as any, month, renda)
  const patrimony = calcPatrimony(transactions as any)
  const cats    = calcCategoryExpenses(transactions as any, month, budgetNorm)
  const alerts  = generateAlerts(summary, cats, debtsNorm as any, profile!.savingGoalPercent)
  const months6 = getLast6Months()
  const evolution = calcPatrimonyEvolution(transactions as any, months6)
  const recentTx  = transactions.slice(0, 8)

  return (
    <AppLayout session={session}>
      <DashboardClient
        summary={summary}
        patrimony={patrimony}
        categories={cats}
        alerts={alerts}
        recentTx={recentTx as any}
        debts={debtsNorm as any}
        evolution={evolution}
        profile={{
          monthlyIncome:     renda,
          savingGoalPercent: profile!.savingGoalPercent,
          currency:          profile!.currency,
        }}
        userPlan={userPlan}
      />
    </AppLayout>
  )
}
