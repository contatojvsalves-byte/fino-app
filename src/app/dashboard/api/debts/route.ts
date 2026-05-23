// src/app/api/debts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const debtSchema = z.object({
  name:                z.string().min(2).max(100).trim(),
  originalAmount:      z.number().positive(),
  currentBalance:      z.number().min(0).optional(),
  monthlyInterestRate: z.number().min(0).max(1).default(0),
  monthlyPayment:      z.number().min(0).default(0),
  dueDate:             z.string().nullable().optional(),
  notes:               z.string().max(1000).optional(),
  isInstallment:       z.boolean().default(false),
  totalInstallments:   z.number().int().min(1).nullable().optional(),
  installmentDueDay:   z.number().int().min(1).max(31).nullable().optional(),
})

export async function GET() {
  try {
    const user  = await requireAuth()
    const debts = await prisma.debt.findMany({
      where:   { userId: user.id },
      include: { payments: { orderBy: { paidAt: 'desc' }, take: 5 } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      success: true,
      data: debts.map(d => ({
        ...d,
        originalAmount:      Number(d.originalAmount),
        currentBalance:      Number(d.currentBalance),
        monthlyInterestRate: Number(d.monthlyInterestRate),
        monthlyPayment:      Number(d.monthlyPayment),
        payments:            d.payments.map(p => ({ ...p, amount: Number(p.amount) })),
      })),
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const body   = await req.json()
    const parsed = debtSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const {
      name, originalAmount, currentBalance, monthlyInterestRate,
      monthlyPayment, dueDate, notes, isInstallment,
      totalInstallments, installmentDueDay,
    } = parsed.data

    // Se parcelado, calcular pagamento mensal automaticamente
    const calcPayment = isInstallment && totalInstallments
      ? originalAmount / totalInstallments
      : monthlyPayment

    const debt = await prisma.debt.create({
      data: {
        userId:              user.id,
        name,
        originalAmount,
        currentBalance:      currentBalance ?? originalAmount,
        monthlyInterestRate,
        monthlyPayment:      calcPayment,
        dueDate:             dueDate ? new Date(dueDate) : null,
        notes:               notes ?? null,
        isInstallment,
        totalInstallments:   isInstallment ? totalInstallments ?? null : null,
        paidInstallments:    0,
        installmentDueDay:   isInstallment ? installmentDueDay ?? null : null,
      },
      include: { payments: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...debt,
        originalAmount:      Number(debt.originalAmount),
        currentBalance:      Number(debt.currentBalance),
        monthlyInterestRate: Number(debt.monthlyInterestRate),
        monthlyPayment:      Number(debt.monthlyPayment),
        payments:            [],
      },
      error: null,
    }, { status: 201 })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    console.error('[POST /api/debts]', err)
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
