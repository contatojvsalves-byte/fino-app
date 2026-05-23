// src/app/api/investments/quotes/route.ts
// Busca cotações reais — roda no servidor para esconder rate limits
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchQuotes } from '@/lib/quotes'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const user  = await requireAuth()
    const body  = await req.json()
    const items = body.items as { ticker: string; type: string }[]

    if (!items?.length)
      return NextResponse.json({ success:false, data:null, error:'Nenhum ticker informado' }, { status:400 })

    const quotes = await fetchQuotes(items)

    // Atualizar currentPrice no banco para cada investimento
    const invs = await prisma.investment.findMany({ where: { userId: user.id } })
    await Promise.all(
      invs.map(inv => {
        const q = quotes[inv.ticker]
        if (q && q.price > 0) {
          return prisma.investment.update({
            where: { id: inv.id },
            data:  { currentPrice: q.price },
          })
        }
      }).filter(Boolean)
    )

    return NextResponse.json({ success:true, data: quotes, error:null })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED') return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    return NextResponse.json({ success:false, data:null, error:'Erro ao buscar cotações' }, { status:500 })
  }
}
