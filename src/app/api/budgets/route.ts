// src/app/api/budgets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const bulkSchema = z.object({
  month:  z.string().regex(/^\d{4}-\d{2}$/),
  limits: z.record(z.string(), z.number().min(0)),
})

// GET /api/budgets?month=YYYY-MM
export async function GET(req: NextRequest) {
  try {
    const user  = await requireAuth()
    const month = req.nextUrl.searchParams.get('month') ?? ''

    const limits = await prisma.budgetLimit.findMany({
      where:   { userId: user.id, ...(month ? { month } : {}) },
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      data: limits.map(l => ({ ...l, amount: Number(l.amount) })),
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

// POST /api/budgets — salva/atualiza limites em lote
export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const body   = await req.json()
    const parsed = bulkSchema.safeParse(body)

    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const { month, limits } = parsed.data

    // Upsert cada limite
    const ops = Object.entries(limits)
      .filter(([, amount]) => amount > 0)
      .map(([categoryId, amount]) =>
        prisma.budgetLimit.upsert({
          where:  { userId_categoryId_month: { userId: user.id, categoryId, month } },
          update: { amount },
          create: { userId: user.id, categoryId, month, amount },
        })
      )

    // Deletar limites zerados
    const zeroIds = Object.entries(limits)
      .filter(([, amount]) => amount === 0)
      .map(([categoryId]) => categoryId)

    if (zeroIds.length > 0) {
      ops.push(
        prisma.budgetLimit.deleteMany({
          where: { userId: user.id, month, categoryId: { in: zeroIds } },
        }) as any
      )
    }

    await prisma.$transaction(ops)

    return NextResponse.json({ success:true, data:null, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
