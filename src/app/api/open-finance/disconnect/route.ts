// src/app/api/open-finance/disconnect/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteItem } from '@/lib/pluggy'

export async function POST(req: NextRequest) {
  try {
    const user         = await requireAuth()
    const userId       = user.id as string
    const { connectionId } = await req.json()

    const connection = await prisma.bankConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection || connection.userId !== userId)
      return NextResponse.json({ success: false, data: null, error: 'Não encontrado' }, { status: 404 })

    // Deletar no Pluggy
    await deleteItem(connection.itemId).catch(() => {})

    // Deletar no banco (cascade deleta as contas)
    await prisma.bankConnection.delete({ where: { id: connectionId } })

    return NextResponse.json({ success: true, data: null, error: null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, data: null, error: 'Não autorizado' }, { status: 401 })
    return NextResponse.json({ success: false, data: null, error: 'Erro ao desconectar' }, { status: 500 })
  }
}
