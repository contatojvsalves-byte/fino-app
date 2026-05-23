// src/app/api/export/route.ts
// Exportação de dados do usuário — LGPD
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()

    const [transactions, debts, investments, profile] = await Promise.all([
      prisma.transaction.findMany({
        where:   { userId: user.id },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      prisma.debt.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.financialProfile.findUnique({ where: { userId: user.id } }),
    ])

    // ── Montar CSV ──────────────────────────────────────
    const lines: string[] = []

    // Cabeçalho geral
    lines.push('FINO — Exportação de dados')
    lines.push(`Gerado em:,${new Date().toLocaleString('pt-BR')}`)
    lines.push('')

    // Perfil
    lines.push('PERFIL FINANCEIRO')
    lines.push('Renda mensal,Meta de poupança,Moeda')
    lines.push(`${Number(profile?.monthlyIncome ?? 0).toFixed(2)},${profile?.savingGoalPercent ?? 20}%,${profile?.currency ?? 'BRL'}`)
    lines.push('')

    // Transações
    lines.push('TRANSAÇÕES')
    lines.push('Data,Tipo,Descrição,Categoria,Valor,Método de pagamento,Recorrente')
    transactions.forEach(t => {
      lines.push([
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.type === 'INCOME' ? 'Receita' : 'Gasto',
        `"${t.description.replace(/"/g, '""')}"`,
        t.category.name,
        Number(t.amount).toFixed(2).replace('.', ','),
        t.paymentMethod ?? '',
        t.isRecurring ? 'Sim' : 'Não',
      ].join(','))
    })
    lines.push('')

    // Dívidas
    lines.push('DÍVIDAS')
    lines.push('Nome,Valor original,Saldo atual,Juros mensal %,Pagamento mensal,Status,Parcelado,Total parcelas,Parcelas pagas')
    debts.forEach(d => {
      lines.push([
        `"${d.name.replace(/"/g, '""')}"`,
        Number(d.originalAmount).toFixed(2).replace('.', ','),
        Number(d.currentBalance).toFixed(2).replace('.', ','),
        (Number(d.monthlyInterestRate) * 100).toFixed(2).replace('.', ','),
        Number(d.monthlyPayment).toFixed(2).replace('.', ','),
        d.status,
        d.isInstallment ? 'Sim' : 'Não',
        d.totalInstallments ?? '',
        d.paidInstallments,
      ].join(','))
    })
    lines.push('')

    // Investimentos
    lines.push('INVESTIMENTOS')
    lines.push('Ticker,Nome,Tipo,Quantidade,Preço médio,Cotação atual,Corretora')
    investments.forEach(i => {
      lines.push([
        i.ticker,
        `"${i.name.replace(/"/g, '""')}"`,
        i.type,
        Number(i.quantity).toString(),
        Number(i.avgPrice).toFixed(2).replace('.', ','),
        Number(i.currentPrice).toFixed(2).replace('.', ','),
        i.broker ?? '',
      ].join(','))
    })

    const csv = lines.join('\n')

    // BOM para Excel abrir corretamente em português
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fino-dados-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 })
  }
}
