// src/app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { updateTransactionSchema } from '@/lib/validations'

// PUT /api/transactions/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const body = await req.json()

    const parsed = updateTransactionSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    const updated = await prisma.transaction.update({
      where:   { id },
      data:    {
        ...parsed.data,
        amount: parsed.data.amount,
        date:   parsed.data.date ? new Date(parsed.data.date) : undefined,
      },
      include: { category: true },
    })

    return NextResponse.json({
      success: true,
      data:    { ...updated, amount: Number(updated.amount) },
      error:   null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()

    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing || existing.userId !== user.id)
      return NextResponse.json({ success:false, data:null, error:'Não encontrado' }, { status:404 })

    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ success:true, data:null, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro interno' }, { status:500 })
  }
}
