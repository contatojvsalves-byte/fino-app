// src/lib/ai.ts
// Serviço de IA — SOMENTE backend. API key nunca vai ao frontend.

import Anthropic from '@anthropic-ai/sdk'
import type { FinancialContext } from '@/types'
import { formatCurrency } from './finance'

// Instância singleton
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const AI_MODEL  = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

// ─── SYSTEM PROMPT ────────────────────────

const SYSTEM_PROMPT = `Você é o Fino IA, um assistente financeiro pessoal para brasileiros.

Suas responsabilidades:
- Analisar a situação financeira do usuário com base nos dados reais fornecidos
- Oferecer orientações práticas, claras e motivadoras de organização financeira
- Ajudar a criar estratégias para economizar, quitar dívidas e começar a investir
- Responder sempre em português brasileiro, de forma direta e acessível

Regras importantes:
- Não prometa ganhos garantidos
- Não recomende investimentos específicos como certeza absoluta
- Nunca substitua consultoria profissional — quando necessário, sugira buscar um especialista
- Não forneça informações falsas sobre produtos financeiros
- Baseie TODAS as suas respostas nos dados reais do usuário
- Seja empático: organização financeira pode ser estressante
- Seja objetivo: respostas entre 3 e 8 parágrafos, sem rodeios
- Formate com quebras de linha para facilitar a leitura

Formato de resposta:
- Use linguagem simples, sem jargão financeiro excessivo
- Quando usar valores, use o formato R$ X.XXX,XX
- Dê no máximo 4-5 recomendações práticas por resposta
- Quando relevante, mencione a estratégia avalanche ou bola de neve para dívidas`

// ─── CONSTRUÇÃO DO CONTEXTO ───────────────

export function buildContextPrompt(context: FinancialContext): string {
  const { profile, currentMonth, topCategories, activeDebts, alerts, recentTx } = context

  return `=== DADOS FINANCEIROS DO USUÁRIO (${currentMonth.month}) ===

PERFIL:
- Renda mensal: ${formatCurrency(profile.monthlyIncome)}
- Meta de poupança: ${profile.savingGoal}%

RESUMO DO MÊS:
- Total de receitas: ${formatCurrency(currentMonth.totalIncome)}
- Total de gastos:   ${formatCurrency(currentMonth.totalExpense)}
- Saldo do mês:      ${formatCurrency(currentMonth.balance)}
- Taxa de poupança:  ${currentMonth.savingRate}%
- Transações:        ${currentMonth.transactionCount}

MAIORES CATEGORIAS DE GASTO:
${topCategories.map(c => `- ${c.icon} ${c.categoryName}: ${formatCurrency(c.total)} (${c.percentage}% dos gastos${c.limit ? `, limite: ${formatCurrency(c.limit)}, usado: ${c.limitPercent}%` : ''})`).join('\n') || '- Nenhum gasto registrado'}

DÍVIDAS ATIVAS:
${activeDebts.length > 0
  ? activeDebts.map(d => `- ${d.name}: saldo R$ ${d.currentBalance.toFixed(2)}, juros ${(d.monthlyInterestRate * 100).toFixed(1)}%/mês, paga R$ ${d.monthlyPayment.toFixed(2)}/mês`).join('\n')
  : '- Nenhuma dívida ativa'}

ALERTAS DO SISTEMA:
${alerts.length > 0 ? alerts.map(a => `⚠️ ${a}`).join('\n') : '- Nenhum alerta no momento'}

ÚLTIMAS TRANSAÇÕES:
${recentTx.map(t => `- ${t.type === 'INCOME' ? '↑' : '↓'} ${t.description}: ${formatCurrency(t.amount)} (${new Date(t.date).toLocaleDateString('pt-BR')})`).join('\n') || '- Nenhuma transação recente'}

===`
}

// ─── CHAT ─────────────────────────────────

interface ChatMessage {
  role:    'user' | 'assistant'
  content: string
}

export async function sendAiMessage(params: {
  userMessage:     string
  context:         FinancialContext
  conversationHistory: ChatMessage[]
}): Promise<{ content: string; tokensUsed: number }> {
  const { userMessage, context, conversationHistory } = params

  const contextPrompt = buildContextPrompt(context)

  // Montar histórico (últimas 10 mensagens para não explodir tokens)
  const history = conversationHistory.slice(-10).map(m => ({
    role:    m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Primeira mensagem injeta o contexto junto com a pergunta
  const messages: Anthropic.MessageParam[] = history.length === 0
    ? [{ role: 'user', content: `${contextPrompt}\n\nPergunta do usuário: ${userMessage}` }]
    : [
        // Reinjetar contexto na primeira mensagem do histórico
        {
          role: 'user',
          content: `${contextPrompt}\n\nPergunta do usuário: ${history[0]?.content ?? userMessage}`,
        },
        ...history.slice(1),
        { role: 'user', content: userMessage },
      ]

  const response = await anthropic.messages.create({
    model:      AI_MODEL,
    max_tokens: MAX_TOKENS,
    system:     SYSTEM_PROMPT,
    messages,
  })

  const content    = response.content.map(b => (b.type === 'text' ? b.text : '')).join('')
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

  return { content, tokensUsed }
}

// ─── LIMITES DE USO ───────────────────────

export function checkAiLimit(plan: { aiMessagesUsed: number; aiMessagesLimit: number }): {
  allowed: boolean
  remaining: number
  message?: string
} {
  const remaining = plan.aiMessagesLimit - plan.aiMessagesUsed
  if (remaining <= 0) {
    return {
      allowed:   false,
      remaining: 0,
      message:   `Você atingiu o limite de ${plan.aiMessagesLimit} mensagens mensais do plano gratuito. Faça upgrade para continuar usando a IA sem limites.`,
    }
  }
  return { allowed: true, remaining }
}
