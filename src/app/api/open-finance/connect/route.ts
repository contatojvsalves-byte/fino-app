// src/app/api/open-finance/connect/route.ts
// Salva a conexão bancária após o usuário autenticar no widget
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getItem, getAccounts } from '@/lib/pluggy'

export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const userId = user.id as string
    const body   = await req.json()
    const { itemId } = body

    if (!itemId)
      return NextResponse.json({ success: false, data: null, error: 'itemId obrigatório' }, { status: 400 })

    // Buscar dados do item no Pluggy
    const item     = await getItem(itemId)
    const accounts = await getAccounts(itemId)

    // Salvar conexão no banco
    const connection = await prisma.bankConnection.upsert({
      where:  { itemId },
      update: {
        status:    item.status,
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        itemId,
        connectorId: item.connector.id,
        bankName:    item.connector.name,
        bankLogo:    item.connector.imageUrl ?? null,
        status:      item.status,
        lastSyncAt:  new Date(),
      },
    })

    // Salvar contas bancárias
    for (const acc of accounts) {
      await prisma.bankAccount.upsert({
        where:  { externalId: acc.id },
        update: {
          balance:    acc.balance ?? 0,
          lastSyncAt: new Date(),
        },
        create: {
          connectionId: connection.id,
          externalId:   acc.id,
          name:         acc.name,
          type:         acc.type,
          number:       acc.number ?? null,
          balance:      acc.balance ?? 0,
          creditLimit:  acc.creditData?.creditLimit ?? null,
          lastSyncAt:   new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      data:    {
        connectionId: connection.id,
        bankName:     connection.bankName,
        accounts:     accounts.length,
      },
      error: null,
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, data: null, error: 'Não autorizado' }, { status: 401 })
    console.error('[open-finance/connect]', err)
    return NextResponse.json({ success: false, data: null, error: 'Erro ao conectar banco' }, { status: 500 })
  }
}
