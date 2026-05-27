// src/app/api/open-finance/sync/route.ts
// Importa transações dos bancos conectados
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTransactions, mapPluggyCategory } from '@/lib/pluggy'

export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const userId = user.id as string

    // Buscar todas as conexões ativas do usuário
    const connections = await prisma.bankConnection.findMany({
      where:    { userId, status: { not: 'ERROR' } },
      include:  { accounts: true },
    })

    if (!connections.length)
      return NextResponse.json({ success: false, data: null, error: 'Nenhum banco conectado' }, { status: 400 })

    // Data de início: últimos 30 dias
    const from = new Date()
    from.setDate(from.getDate() - 30)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr   = new Date().toISOString().slice(0, 10)

    let totalImported = 0
    let totalSkipped  = 0

    for (const connection of connections) {
      for (const account of connection.accounts) {
        const txs = await getTransactions(account.externalId, fromStr, toStr)

        for (const tx of txs) {
          // Verificar se transação já foi importada (pelo ID externo na descrição)
          const existingTx = await prisma.transaction.findFirst({
            where: {
              userId,
              description: { contains: tx.id },
            },
          })

          if (existingTx) { totalSkipped++; continue }

          // Determinar categoria
          const categoryId = mapPluggyCategory(tx.category ?? '')

          // Verificar se categoria existe
          const category = await prisma.category.findFirst({
            where: { OR: [{ id: categoryId }, { userId: null, name: 'Outros' }] },
          })

          if (!category) continue

          // Criar transação
          await prisma.transaction.create({
            data: {
              userId,
              type:        tx.amount > 0 ? 'INCOME' : 'EXPENSE',
              amount:      Math.abs(tx.amount),
              description: `${tx.description} [OF:${tx.id}]`,
              categoryId:  category.id,
              date:        new Date(tx.date),
              isRecurring: false,
            },
          })

          totalImported++
        }
      }

      // Atualizar lastSyncAt
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data:  { lastSyncAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      data:    { imported: totalImported, skipped: totalSkipped },
      error:   null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, data: null, error: 'Não autorizado' }, { status: 401 })
    console.error('[open-finance/sync]', err)
    return NextResponse.json({ success: false, data: null, error: 'Erro ao sincronizar' }, { status: 500 })
  }
}

// GET — listar conexões
export async function GET() {
  try {
    const user   = await requireAuth()
    const userId = user.id as string

    const connections = await prisma.bankConnection.findMany({
      where:   { userId },
      include: { accounts: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data:    connections.map(c => ({
        ...c,
        accounts: c.accounts.map(a => ({
          ...a,
          balance:     Number(a.balance),
          creditLimit: a.creditLimit ? Number(a.creditLimit) : null,
        })),
      })),
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, data: null, error: 'Não autorizado' }, { status: 401 })
    return NextResponse.json({ success: false, data: null, error: 'Erro interno' }, { status: 500 })
  }
}
