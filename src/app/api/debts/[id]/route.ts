// src/app/api/debts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name:                z.string().min(2).max(100).optional(),
  currentBalance:      z.number().min(0).optional(),
  monthlyInterestRate: z.number().min(0).max(1).optional(),
  monthlyPayment:      z.number().min(0).optional(),
  dueDate:             z.string().nullable().optional(),
  status:              z.enum(['ACTIVE','PARTIAL','PAID','NEGOTIATING','DEFAULTED']).optional(),
  notes:               z.string().optional(),
  paidInstallments:    z.number().int().min(0).optional(),
})

const paymentSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  notes:  z.string().optional(),
})

// PUT /api/debts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user     = await requireAuth()
    const existing = await prisma.debt.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const updated = await prisma.debt.update({
      where: { id },
      data:  {
        ...parsed.data,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      },
      include: { payments: { orderBy: { paidAt: 'desc' }, take: 10 } },
    })

    return NextResponse.json({ success:true, data: normalizeDebt(updated), error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

// POST /api/debts/[id] — pagamento parcial
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user     = await requireAuth()
    const existing = await prisma.debt.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    const body   = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const { amount, notes } = parsed.data
    const currentBalance    = Number(existing.currentBalance)
    const newBalance        = Math.max(0, currentBalance - amount)

    let newStatus: 'ACTIVE' | 'PARTIAL' | 'PAID' = 'ACTIVE'
    if (newBalance === 0) newStatus = 'PAID'
    else if (amount > 0)  newStatus = 'PARTIAL'

    let newPaidInstallments = existing.paidInstallments
    if (existing.isInstallment && existing.monthlyPayment) {
      const installmentValue = Number(existing.monthlyPayment)
      if (Math.abs(amount - installmentValue) < 0.01) {
        newPaidInstallments = existing.paidInstallments + 1
      }
    }

    const [payment, updatedDebt] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: { debtId: id, amount, notes: notes ?? null },
      }),
      prisma.debt.update({
        where: { id },
        data:  { currentBalance: newBalance, status: newStatus, paidInstallments: newPaidInstallments },
        include: { payments: { orderBy: { paidAt: 'desc' }, take: 10 } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data:    { debt: normalizeDebt(updatedDebt), payment: { ...payment, amount: Number(payment.amount) } },
      error:   null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    console.error('[POST /api/debts/[id]]', err)
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

// DELETE /api/debts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user     = await requireAuth()
    const existing = await prisma.debt.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    await prisma.debt.delete({ where: { id } })
    return NextResponse.json({ success:true, data:null, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

function normalizeDebt(d: any) {
  return {
    ...d,
    originalAmount:      Number(d.originalAmount),
    currentBalance:      Number(d.currentBalance),
    monthlyInterestRate: Number(d.monthlyInterestRate),
    monthlyPayment:      Number(d.monthlyPayment),
    payments:            (d.payments ?? []).map((p: any) => ({ ...p, amount: Number(p.amount) })),
  }
}
