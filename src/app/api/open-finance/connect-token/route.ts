// src/app/api/open-finance/connect-token/route.ts
// Gera token temporário para o widget do Pluggy — API key fica no servidor
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createConnectToken } from '@/lib/pluggy'

export async function POST(req: NextRequest) {
  try {
    const user   = await requireAuth()
    const userId = user.id as string
    const body   = await req.json().catch(() => ({}))
    const itemId = body.itemId as string | undefined

    const connectToken = await createConnectToken(itemId)

    return NextResponse.json({ success: true, data: { connectToken }, error: null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success: false, data: null, error: 'Não autorizado' }, { status: 401 })
    console.error('[connect-token]', err)
    return NextResponse.json({ success: false, data: null, error: 'Erro ao gerar token' }, { status: 500 })
  }
}
