// src/app/api/ai/chat/route.ts
// ⚠️ API KEY fica SOMENTE aqui — nunca vai ao frontend

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendAiMessage, checkAiLimit } from '@/lib/ai'
import { buildFinancialContext, currentMonth } from '@/lib/finance'
import { aiChatSchema } from '@/lib/validations'

// Rate limit simples em memória (em produção usar Redis/Upstash)
const rateLimit = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000  // 1 min
const RATE_LIMIT_MAX    = 5       // 5 req/min por usuário

function checkRateLimit(userId: string): boolean {
  const now  = Date.now()
  const prev = rateLimit.get(userId)
  if (!prev || now > prev.resetAt) {
    rateLimit.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (prev.count >= RATE_LIMIT_MAX) return false
  prev.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const userId = user.id as string

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { success:false, data:null, error:'Muitas requisições. Aguarde 1 minuto.' },
        { status: 429 }
      )
    }

    // Validar input
    const body   = await req.json()
    const parsed = aiChatSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ success:false, data:null, error: parsed.error.errors[0].message }, { status:400 })

    const { message, conversationId } = parsed.data

    // Verificar limite do plano
    let plan = await prisma.userPlan.findUnique({ where: { userId: user.id as string } })
    if (!plan) return NextResponse.json({ success:false, data:null, error:'Plano não encontrado' }, { status:400 })

    // ── Reset mensal automático ──
    // Formato da chave: "2024-11" (ano-mês atual)
    const now      = new Date()
    const resetKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (plan.aiResetKey !== resetKey) {
      // Mudou o mês — zerar o contador
      plan = await prisma.userPlan.update({
        where: { userId: user.id as string },
        data:  {
          aiMessagesUsed: 0,
          aiResetKey:     resetKey,
        },
      })
    }

    const limitCheck = checkAiLimit(plan)
    if (!limitCheck.allowed) {
      return NextResponse.json({ success:false, data:null, error: limitCheck.message }, { status:403 })
    }

    // Buscar ou criar conversa
    let convId = conversationId
    if (!convId) {
      const conv = await prisma.aiConversation.create({
        data: { userId: user.id as string, title: message.slice(0, 60) },
      })
      convId = conv.id
    } else {
      // Verificar que pertence ao usuário
      const conv = await prisma.aiConversation.findUnique({ where: { id: convId } })
      if (!conv || conv.userId !== user.id)
        return NextResponse.json({ success:false, data:null, error:'Conversa inválida' }, { status:400 })
    }

    // Histórico da conversa
    const history = await prisma.aiMessage.findMany({
      where:   { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take:    20,
    })

    // Construir contexto financeiro do usuário
    const [profile, txRaw, debts, budgetLimits] = await Promise.all([
      prisma.financialProfile.findUnique({ where: { userId: user.id as string } }),
      prisma.transaction.findMany({
        where:   { userId: user.id as string },
        include: { category: true },
        orderBy: { date: 'desc' },
        take:    100,
      }),
      prisma.debt.findMany({ where: { userId: user.id as string, status: 'ACTIVE' } }),
      prisma.budgetLimit.findMany({ where: { userId: user.id as string } }),
    ])

    const transactions = txRaw.map(t => ({
      ...t,
      amount: Number(t.amount),
      category: { ...t.category },
    }))

    const debtsNorm = debts.map(d => ({
      ...d,
      originalAmount:      Number(d.originalAmount),
      currentBalance:      Number(d.currentBalance),
      monthlyInterestRate: Number(d.monthlyInterestRate),
      monthlyPayment:      Number(d.monthlyPayment),
    }))

    const context = buildFinancialContext({
      profile:      profile ? { monthlyIncome: Number(profile.monthlyIncome), savingGoalPercent: profile.savingGoalPercent } : { monthlyIncome: 0, savingGoalPercent: 20 },
      transactions: transactions as any,
      debts:        debtsNorm as any,
      budgetLimits: budgetLimits.map(b => ({ categoryId: b.categoryId, amount: Number(b.amount) })),
      month:        currentMonth(),
    })

    // Chamar IA
    const { content, tokensUsed } = await sendAiMessage({
      userMessage:         message,
      context,
      conversationHistory: history.map(h => ({ role: h.role.toLowerCase() as 'user'|'assistant', content: h.content })),
    })

    // Salvar mensagens e atualizar contador em transação
    await prisma.$transaction([
      prisma.aiMessage.create({ data: { conversationId: convId, role: 'USER', content: message } }),
      prisma.aiMessage.create({ data: { conversationId: convId, role: 'ASSISTANT', content, tokensUsed } }),
      prisma.userPlan.update({
        where: { userId: user.id as string },
        data:  { aiMessagesUsed: { increment: 1 } },
      }),
      prisma.aiConversation.update({
        where: { id: convId },
        data:  { updatedAt: new Date() },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        content,
        conversationId: convId,
        remaining: limitCheck.remaining - 1,
      },
      error: null,
    })

  } catch (err: any) {
    if (err.message === 'UNAUTHORIZED')
      return NextResponse.json({ success:false, data:null, error:'Não autorizado' }, { status:401 })
    console.error('[POST /api/ai/chat]', err)
    return NextResponse.json({ success:false, data:null, error:'Erro ao processar mensagem' }, { status:500 })
  }
}
