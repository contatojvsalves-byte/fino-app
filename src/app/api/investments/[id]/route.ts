// src/app/api/investments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  quantity:     z.number().positive().optional(),
  avgPrice:     z.number().positive().optional(),
  currentPrice: z.number().min(0).optional(),
  broker:       z.string().optional(),
  notes:        z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const existing = await prisma.investment.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const updated = await prisma.investment.update({ where: { id }, data: parsed.data })
    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        quantity:     Number(updated.quantity),
        avgPrice:     Number(updated.avgPrice),
        currentPrice: Number(updated.currentPrice),
      },
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const existing = await prisma.investment.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    await prisma.investment.delete({ where: { id } })
    return NextResponse.json({ success:true, data:null, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
