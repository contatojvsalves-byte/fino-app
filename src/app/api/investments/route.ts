// src/app/api/investments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const investmentSchema = z.object({
  ticker:   z.string().min(1).max(20).toUpperCase().trim(),
  name:     z.string().min(1).max(200).trim(),
  type:     z.enum(['STOCK','FII','ETF','CRYPTO','TREASURY','GOLD','FIXED','OTHER']),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  avgPrice: z.number().positive('Preço médio deve ser positivo'),
  broker:   z.string().max(100).optional(),
  notes:    z.string().max(500).optional(),
})

function normalize(inv: any) {
  return {
    ...inv,
    quantity:     Number(inv.quantity),
    avgPrice:     Number(inv.avgPrice),
    currentPrice: Number(inv.currentPrice),
    totalCost:    Number(inv.quantity) * Number(inv.avgPrice),
    currentValue: Number(inv.quantity) * Number(inv.currentPrice),
    gainLoss:     (Number(inv.currentPrice) - Number(inv.avgPrice)) * Number(inv.quantity),
    gainLossPct:  Number(inv.avgPrice) > 0
      ? ((Number(inv.currentPrice) - Number(inv.avgPrice)) / Number(inv.avgPrice)) * 100
      : 0,
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    const invs = await prisma.investment.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: invs.map(normalize), error: null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const body   = await req.json()
    const parsed = investmentSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const inv = await prisma.investment.create({
      data: {
        userId:   user.id,
        ticker:   parsed.data.ticker,
        name:     parsed.data.name,
        type:     parsed.data.type,
        quantity: parsed.data.quantity,
        avgPrice: parsed.data.avgPrice,
        broker:   parsed.data.broker ?? null,
        notes:    parsed.data.notes ?? null,
      },
    })
    return NextResponse.json({ success:true, data: normalize(inv), error:null }, { status:201 })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    console.error('[POST /api/investments]', err)
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
