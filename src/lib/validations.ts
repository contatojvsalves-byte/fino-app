// src/lib/validations.ts
// Schemas Zod — validação no backend (nunca confiar no frontend)

import { z } from 'zod'

// ─── TRANSAÇÕES ───────────────────────────

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .number({ invalid_type_error: 'Valor deve ser número' })
    .positive('Valor deve ser positivo')
    .max(99999999, 'Valor muito alto'),
  description: z
    .string()
    .min(2, 'Descrição muito curta')
    .max(200, 'Descrição muito longa')
    .trim(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  paymentMethod: z
    .enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia', 'boleto'])
    .optional(),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
})

export const updateTransactionSchema = transactionSchema.partial()

// ─── DÍVIDAS ──────────────────────────────

export const debtSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100).trim(),
  originalAmount: z.number().positive('Valor deve ser positivo'),
  currentBalance: z.number().min(0, 'Saldo não pode ser negativo'),
  monthlyInterestRate: z
    .number()
    .min(0, 'Juros não pode ser negativo')
    .max(1, 'Juros em decimal, ex: 0.05 para 5%'),
  monthlyPayment: z.number().min(0),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional(),
})

export const updateDebtSchema = debtSchema.partial().extend({
  status: z.enum(['ACTIVE', 'PAID', 'NEGOTIATING', 'DEFAULTED']).optional(),
})

// ─── PERFIL ───────────────────────────────

export const profileSchema = z.object({
  monthlyIncome: z.number().min(0).max(99999999),
  savingGoalPercent: z.number().int().min(0).max(100),
})

// ─── LIMITES DE ORÇAMENTO ─────────────────

export const budgetLimitSchema = z.object({
  categoryId: z.string().cuid(),
  amount: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido, use YYYY-MM'),
})

// ─── IA ───────────────────────────────────

export const aiChatSchema = z.object({
  conversationId: z.string().cuid().optional(),
  message: z
    .string()
    .min(2, 'Mensagem muito curta')
    .max(1000, 'Mensagem muito longa')
    .trim(),
})

// ─── AUTH ─────────────────────────────────

export const registerSchema = z.object({
  name:     z.string().min(2, 'Nome muito curto').max(100).trim(),
  email:    z.string().email('E-mail inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve ter ao menos um número'),
})

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

// ─── CATEGORIAS ───────────────────────────

export const categorySchema = z.object({
  name:  z.string().min(2).max(50).trim(),
  icon:  z.string().max(10).default('📦'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida').default('#94a3b8'),
  type:  z.enum(['INCOME', 'EXPENSE']),
})
