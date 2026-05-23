// src/app/charts/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { ChartsClient } from '@/components/charts/charts-client'
import {
  calcPatrimonyEvolution,
  calcCategoryExpenses,
  calcPatrimony,
  getLast6Months,
  currentMonth,
} from '@/lib/finance'

export default async function ChartsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [txRaw, debts, budgetLimits] = await Promise.all([
    prisma.transaction.findMany({
      where:   { userId },
      include: { category: true },
      orderBy: { date: 'asc' },
    }),
    prisma.debt.findMany({ where: { userId, status: { in: ['ACTIVE','PARTIAL'] } } }),
    prisma.budgetLimit.findMany({ where: { userId } }),
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

  const months6    = getLast6Months()
  const month      = currentMonth()

  // Saldo em caixa = total histórico receitas - gastos
  const cashBalance = calcPatrimony(transactions as any)

  const evolution  = calcPatrimonyEvolution(transactions as any, months6)
  const categories = calcCategoryExpenses(
    transactions as any,
    month,
    budgetLimits.map(b => ({ categoryId: b.categoryId, amount: Number(b.amount) }))
  )

  const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const monthlyRG = months6.map(m => {
    const inM   = transactions.filter(t => new Date(t.date).toISOString().slice(0,7) === m)
    const label = MONTH_NAMES[+m.split('-')[1]-1]
    return {
      month:   label,
      income:  inM.filter(t=>t.type==='INCOME').reduce((s,t)=>s+t.amount,0),
      expense: inM.filter(t=>t.type==='EXPENSE').reduce((s,t)=>s+t.amount,0),
    }
  })

  return (
    <AppLayout session={session}>
      <ChartsClient
        evolution={evolution}
        categories={categories}
        monthlyRG={monthlyRG}
        debts={debtsNorm as any}
        cashBalance={cashBalance}
      />
    </AppLayout>
  )
}
