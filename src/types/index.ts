// src/types/index.ts
// Tipos centralizados do Fino

export type TransactionType = 'INCOME' | 'EXPENSE'
export type CategoryType    = 'INCOME' | 'EXPENSE'
export type DebtStatus      = 'ACTIVE' | 'PAID' | 'NEGOTIATING' | 'DEFAULTED'
export type PlanType        = 'FREE' | 'PREMIUM' | 'ENTERPRISE'
export type AiRole          = 'USER' | 'ASSISTANT'

// ─── ENTIDADES ────────────────────────────

export interface Category {
  id:        string
  userId:    string | null
  name:      string
  icon:      string
  color:     string
  type:      CategoryType
  isDefault: boolean
  createdAt: Date
}

export interface Transaction {
  id:            string
  userId:        string
  type:          TransactionType
  amount:        number
  description:   string
  categoryId:    string
  category:      Category
  date:          Date
  paymentMethod: string | null
  isRecurring:   boolean
  notes:         string | null
  createdAt:     Date
  updatedAt:     Date
}

export interface Debt {
  id:                  string
  userId:              string
  name:                string
  originalAmount:      number
  currentBalance:      number
  monthlyInterestRate: number
  monthlyPayment:      number
  dueDate:             Date | null
  status:              DebtStatus
  notes:               string | null
  createdAt:           Date
  updatedAt:           Date
}

export interface BudgetLimit {
  id:         string
  userId:     string
  categoryId: string
  category:   Category
  amount:     number
  month:      string // "YYYY-MM"
}

export interface FinancialProfile {
  id:               string
  userId:           string
  monthlyIncome:    number
  savingGoalPercent: number
  currency:         string
}

export interface UserPlan {
  id:                string
  userId:            string
  plan:              PlanType
  aiMessagesUsed:    number
  aiMessagesLimit:   number
  transactionLimit:  number
  subscriptionStatus: string
  currentPeriodEnd:  Date | null
}

// ─── DASHBOARD ────────────────────────────

export interface MonthSummary {
  month:          string          // "YYYY-MM"
  totalIncome:    number
  totalExpense:   number
  balance:        number
  savingRate:     number          // percentual
  transactionCount: number
}

export interface CategoryExpense {
  categoryId:   string
  categoryName: string
  icon:         string
  color:        string
  total:        number
  percentage:   number
  limit:        number | null
  limitPercent: number | null     // % do limite usado
}

export interface DashboardData {
  summary:        MonthSummary
  patrimony:      number          // acumulado histórico
  byCategory:     CategoryExpense[]
  recentTx:       Transaction[]
  debts:          Debt[]
  alerts:         Alert[]
}

export interface Alert {
  id:      string
  type:    'warning' | 'danger' | 'info'
  title:   string
  message: string
}

// ─── IA ───────────────────────────────────

export interface AiMessage {
  id:             string
  conversationId: string
  role:           AiRole
  content:        string
  createdAt:      Date
}

export interface AiConversation {
  id:        string
  userId:    string
  title:     string
  messages:  AiMessage[]
  createdAt: Date
  updatedAt: Date
}

// Contexto enviado para a IA
export interface FinancialContext {
  profile:      { monthlyIncome: number; savingGoal: number }
  currentMonth: MonthSummary
  topCategories: CategoryExpense[]
  activeDebts:   Pick<Debt, 'name' | 'currentBalance' | 'monthlyInterestRate' | 'monthlyPayment'>[]
  alerts:        string[]
  recentTx:      Pick<Transaction, 'description' | 'amount' | 'type' | 'date'>[]
}

// ─── API RESPONSES ────────────────────────

export interface ApiResponse<T> {
  data:    T | null
  error:   string | null
  success: boolean
}

// ─── FORMS ────────────────────────────────

export interface TransactionFormData {
  type:          TransactionType
  amount:        number
  description:   string
  categoryId:    string
  date:          string
  paymentMethod?: string
  isRecurring:   boolean
  notes?:        string
}

export interface DebtFormData {
  name:                string
  originalAmount:      number
  currentBalance:      number
  monthlyInterestRate: number
  monthlyPayment:      number
  dueDate?:            string
  notes?:              string
}

export interface ProfileFormData {
  monthlyIncome:    number
  savingGoalPercent: number
}

// ─── SIMULADOR ────────────────────────────

export interface InvestmentSimulation {
  monthlyContribution: number
  annualRate:          number
  years:               number
  totalInvested:       number
  finalAmount:         number
  earnings:            number
  earningsPercent:     number
  monthlyData:         { month: number; value: number }[]
}

// ─── DÍVIDAS — PROJEÇÃO ───────────────────

export interface DebtProjection {
  debtId:          string
  name:            string
  monthsToPayoff:  number
  totalInterest:   number
  strategy:        'avalanche' | 'snowball'
}
