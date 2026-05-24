// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { transactionSchema } from '@/lib/validations'

// GET /api/transactions — lista do usuário
export async function GET(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const params = req.nextUrl.searchParams
    const month  = params.get('month')  // "YYYY-MM"
    const type   = params.get('type')   // "INCOME" | "EXPENSE"

    const where: Record<string, unknown> = { userId: user.id as string }
    if (type) where.type = type
    if (month) {
      const [y, m] = month.split('-').map(Number)
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt:  new Date(y, m, 1),
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: transactions.map(t => ({ ...t, amount: Number(t.amount) })),
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status: 401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status: 500 })
  }
}

// POST /api/transactions — criar
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    // Verificar limite do plano
    const plan = await prisma.userPlan.findUnique({ where: { userId: user.id as string } })
    if (plan && plan.plan === 'FREE') {
      const now = new Date()
      const countThisMonth = await prisma.transaction.count({
        where: {
          userId: user.id as string,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      })
      if (countThisMonth >= plan.transactionLimit) {
        return NextResponse.json(
          { success:false, data:null, error:`Limite de ${plan.transactionLimit} transações/mês atingido. Faça upgrade para o plano Premium.` },
          { status: 403 }
        )
      }
    }

    const body   = await req.json()
    const parsed = transactionSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status: 400 })

    const { type, amount, description, categoryId, date, paymentMethod, isRecurring, notes } = parsed.data

    // Verificar que a categoria existe e pertence ao usuário (ou é padrão)
    const category = await prisma.category.findFirst({
      where: { id: categoryId, OR: [{ userId: user.id as string }, { userId: null }] },
    })
    if (!category)
      return NextResponse.json({ success:false, data:null, error:'Categoria inválida' }, { status: 400 })

    const tx = await prisma.transaction.create({
      data: {
        userId: user.id as string,
        type,
        amount,
        description,
        categoryId,
        date:          new Date(date),
        paymentMethod: paymentMethod ?? null,
        isRecurring,
        notes:         notes ?? null,
      },
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      data:    { ...tx, amount: Number(tx.amount) },
      error:   null,
    }, { status: 201 })

  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status: 401 })
    console.error('[POST /api/transactions]', err)
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status: 500 })
  }
}
