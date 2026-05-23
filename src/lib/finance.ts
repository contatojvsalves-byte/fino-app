// src/lib/finance.ts
// Funções utilitárias de cálculo financeiro — sem lógica de UI

import type {
  Transaction,
  Debt,
  MonthSummary,
  CategoryExpense,
  InvestmentSimulation,
  DebtProjection,
  Alert,
  FinancialContext,
} from '@/types'

// ─────────────────────────────────────────
// RESUMO MENSAL
// ─────────────────────────────────────────

export function calcMonthSummary(
  transactions: Transaction[],
  month: string,
  monthlyIncome = 0
): MonthSummary {
  const inMonth = transactions.filter(
    (t) => new Date(t.date).toISOString().slice(0, 7) === month
  )

  const totalIncomeTransactions = inMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = inMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  // Se há receitas lançadas usa elas, senão usa a renda configurada nos ajustes
  const totalIncome  = totalIncomeTransactions > 0 ? totalIncomeTransactions : monthlyIncome
  const balance      = totalIncome - totalExpense
  const savingRate   = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0

  return {
    month,
    totalIncome,
    totalExpense,
    balance,
    savingRate,
    transactionCount: inMonth.length,
  }
}

// ─────────────────────────────────────────
// PATRIMÔNIO ACUMULADO
// ─────────────────────────────────────────

export function calcPatrimony(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    return t.type === 'INCOME' ? acc + t.amount : acc - t.amount
  }, 0)
}

// Evolução mês a mês (últimos N meses)
export function calcPatrimonyEvolution(
  transactions: Transaction[],
  months: string[]
): { month: string; value: number }[] {
  let running = 0
  // patrimônio antes do primeiro mês do range
  const firstMonth = months[0]
  transactions
    .filter(t => t.date.toISOString().slice(0, 7) < firstMonth)
    .forEach(t => { running += t.type === 'INCOME' ? t.amount : -t.amount })

  return months.map(month => {
    transactions
      .filter(t => t.date.toISOString().slice(0, 7) === month)
      .forEach(t => { running += t.type === 'INCOME' ? t.amount : -t.amount })
    return { month, value: Math.round(running) }
  })
}

// ─────────────────────────────────────────
// GASTOS POR CATEGORIA
// ─────────────────────────────────────────

export function calcCategoryExpenses(
  transactions: Transaction[],
  month: string,
  budgetLimits: { categoryId: string; amount: number }[]
): CategoryExpense[] {
  const expenses = transactions.filter(
    t => t.type === 'EXPENSE' && t.date.toISOString().slice(0, 7) === month
  )

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)

  // Agrupar por categoria
  const map = new Map<string, { category: Transaction['category']; total: number }>()
  for (const tx of expenses) {
    const existing = map.get(tx.categoryId)
    if (existing) {
      existing.total += tx.amount
    } else {
      map.set(tx.categoryId, { category: tx.category, total: tx.amount })
    }
  }

  return Array.from(map.entries())
    .map(([categoryId, { category, total }]) => {
      const limit       = budgetLimits.find(b => b.categoryId === categoryId)?.amount ?? null
      const limitPercent = limit ? Math.round((total / limit) * 100) : null
      return {
        categoryId,
        categoryName: category.name,
        icon:         category.icon,
        color:        category.color,
        total,
        percentage:   totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
        limit,
        limitPercent,
      }
    })
    .sort((a, b) => b.total - a.total)
}

// ─────────────────────────────────────────
// ALERTAS FINANCEIROS
// ─────────────────────────────────────────

export function generateAlerts(
  summary: MonthSummary,
  categories: CategoryExpense[],
  debts: Debt[],
  savingGoal: number
): Alert[] {
  const alerts: Alert[] = []

  // Saldo negativo
  if (summary.balance < 0) {
    alerts.push({
      id: 'negative-balance',
      type: 'danger',
      title: 'Saldo negativo!',
      message: `Você gastou ${formatCurrency(Math.abs(summary.balance))} a mais do que recebeu este mês.`,
    })
  }

  // Meta de poupança não atingida
  if (summary.savingRate < savingGoal && summary.totalIncome > 0) {
    alerts.push({
      id: 'saving-goal',
      type: 'warning',
      title: 'Meta de poupança em risco',
      message: `Você poupou ${summary.savingRate}% da renda. Sua meta é de ${savingGoal}%.`,
    })
  }

  // Categorias ultrapassadas
  for (const cat of categories) {
    if (cat.limitPercent !== null && cat.limitPercent >= 100) {
      alerts.push({
        id: `budget-exceeded-${cat.categoryId}`,
        type: 'danger',
        title: `Limite de ${cat.categoryName} ultrapassado`,
        message: `Você usou ${cat.limitPercent}% do limite em ${cat.categoryName}.`,
      })
    } else if (cat.limitPercent !== null && cat.limitPercent >= 80) {
      alerts.push({
        id: `budget-warning-${cat.categoryId}`,
        type: 'warning',
        title: `${cat.categoryName} acima de 80%`,
        message: `Você já usou ${cat.limitPercent}% do limite em ${cat.categoryName}.`,
      })
    }
  }

  // Dívidas com juros altos
  const highInterestDebt = debts.find(d => d.monthlyInterestRate > 0.1 && d.status === 'ACTIVE')
  if (highInterestDebt) {
    alerts.push({
      id: 'high-interest-debt',
      type: 'danger',
      title: 'Dívida com juros altos detectada',
      message: `${highInterestDebt.name} tem ${(highInterestDebt.monthlyInterestRate * 100).toFixed(1)}% de juros ao mês. Priorize quitar!`,
    })
  }

  return alerts
}

// ─────────────────────────────────────────
// PROJEÇÃO DE DÍVIDAS
// ─────────────────────────────────────────

export function calcDebtProjection(
  debt: Debt,
  strategy: 'avalanche' | 'snowball' = 'avalanche'
): DebtProjection {
  if (debt.monthlyPayment <= 0 || debt.currentBalance <= 0) {
    return { debtId: debt.id, name: debt.name, monthsToPayoff: 0, totalInterest: 0, strategy }
  }

  let balance       = debt.currentBalance
  let totalInterest = 0
  let months        = 0

  while (balance > 0 && months < 600) {
    const interest = balance * debt.monthlyInterestRate
    balance       += interest
    totalInterest += interest
    const payment = Math.min(debt.monthlyPayment, balance)
    balance -= payment
    months++
  }

  return {
    debtId:         debt.id,
    name:           debt.name,
    monthsToPayoff: months,
    totalInterest:  Math.round(totalInterest),
    strategy,
  }
}

// Ordena dívidas pela estratégia escolhida
export function sortDebtsByStrategy(
  debts: Debt[],
  strategy: 'avalanche' | 'snowball'
): Debt[] {
  return [...debts].sort((a, b) =>
    strategy === 'avalanche'
      ? b.monthlyInterestRate - a.monthlyInterestRate  // maior juros primeiro
      : a.currentBalance - b.currentBalance             // menor saldo primeiro
  )
}

// ─────────────────────────────────────────
// SIMULADOR DE INVESTIMENTO
// ─────────────────────────────────────────

export function simulateInvestment(
  monthlyContribution: number,
  annualRate: number,
  years: number
): InvestmentSimulation {
  const monthlyRate  = annualRate / 100 / 12
  const totalMonths  = years * 12
  const monthlyData: { month: number; value: number }[] = []

  let accumulated = 0
  for (let m = 1; m <= totalMonths; m++) {
    accumulated = (accumulated + monthlyContribution) * (1 + monthlyRate)
    if (m % 12 === 0 || m === totalMonths) {
      monthlyData.push({ month: m, value: Math.round(accumulated) })
    }
  }

  const totalInvested  = monthlyContribution * totalMonths
  const finalAmount    = Math.round(accumulated)
  const earnings       = finalAmount - totalInvested
  const earningsPercent = totalInvested > 0 ? Math.round((earnings / totalInvested) * 100) : 0

  return {
    monthlyContribution,
    annualRate,
    years,
    totalInvested,
    finalAmount,
    earnings,
    earningsPercent,
    monthlyData,
  }
}

// ─────────────────────────────────────────
// CONTEXTO PARA IA
// ─────────────────────────────────────────

export function buildFinancialContext(params: {
  profile:      { monthlyIncome: number; savingGoalPercent: number }
  transactions: Transaction[]
  debts:        Debt[]
  budgetLimits: { categoryId: string; amount: number }[]
  month:        string
}): FinancialContext {
  const { profile, transactions, debts, budgetLimits, month } = params

  const summary    = calcMonthSummary(transactions, month)
  const categories = calcCategoryExpenses(transactions, month, budgetLimits)
  const alerts     = generateAlerts(summary, categories, debts, profile.savingGoalPercent)

  const recentTx = transactions
    .filter(t => t.date.toISOString().slice(0, 7) === month)
    .slice(0, 10)
    .map(t => ({
      description: t.description,
      amount:      t.amount,
      type:        t.type,
      date:        t.date,
    }))

  const activeDebts = debts
    .filter(d => d.status === 'ACTIVE')
    .map(d => ({
      name:                d.name,
      currentBalance:      d.currentBalance,
      monthlyInterestRate: d.monthlyInterestRate,
      monthlyPayment:      d.monthlyPayment,
    }))

  return {
    profile: { monthlyIncome: profile.monthlyIncome, savingGoal: profile.savingGoalPercent },
    currentMonth: summary,
    topCategories: categories.slice(0, 5),
    activeDebts,
    alerts: alerts.map(a => a.message),
    recentTx,
  }
}

// ─────────────────────────────────────────
// FORMATADORES
// ─────────────────────────────────────────

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value}%`
}

export function getLast6Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    )
  }
  return months
}

export function currentMonth(): string {
  const now = new Date()
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
}
