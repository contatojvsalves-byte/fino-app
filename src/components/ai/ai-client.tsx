// src/components/ai/ai-client.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Gem, ChevronRight } from 'lucide-react'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  { emoji: '📉', label: 'Reduzir gastos',      text: 'Como posso reduzir meus gastos com base no meu perfil atual?' },
  { emoji: '💳', label: 'Qual dívida pagar',    text: 'Qual dívida devo priorizar pagar primeiro e por quê?' },
  { emoji: '📈', label: 'Posso investir?',      text: 'Com base na minha situação financeira, posso começar a investir agora?' },
  { emoji: '⚖️', label: 'Regra 50-30-20',       text: 'Como aplicar a regra 50-30-20 no meu orçamento atual?' },
  { emoji: '🗓️', label: 'Plano para 12 meses',  text: 'Monte um plano financeiro prático para os próximos 12 meses.' },
]

export function AiClient({ remaining, plan }: { remaining: number; plan: string }) {
  const [messages,       setMessages]       = useState<Message[]>([])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [msgRemaining,   setMsgRemaining]   = useState(remaining)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    if (!text.trim() || loading || msgRemaining <= 0) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res  = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, conversationId }),
      })
      const data = await res.json()
      if (!data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.content }])
        setConversationId(data.data.conversationId)
        setMsgRemaining(data.data.remaining)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Sparkles size={20} style={{ color: 'var(--purple)' }} />
              Fino IA
            </h1>
            <p className="page-sub">Assistente financeiro personalizado</p>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${msgRemaining <= 1 ? 'text-red' : ''}`}
              style={{ color: msgRemaining <= 1 ? 'var(--red)' : 'var(--txt2)' }}>
              {msgRemaining} msg{msgRemaining !== 1 ? 's' : ''} restante{msgRemaining !== 1 ? 's' : ''}
            </div>
            {plan === 'FREE' && (
              <a href="/upgrade" className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>
                Upgrade →
              </a>
            )}
          </div>
        </div>
        {plan === 'FREE' && (
          <div className="progress-wrap mt-2">
            <div className="progress-fill" style={{
              width: `${Math.max(0, (msgRemaining / 5) * 100)}%`,
              background: msgRemaining <= 1 ? 'var(--red)' : 'var(--green)',
            }} />
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 24 }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: 'var(--purple-dim)' }}>✦</div>
            <p className="text-base font-semibold mb-1" style={{ color: 'var(--txt0)' }}>Olá! Sou o Fino IA.</p>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--txt2)' }}>
              Analiso seus dados reais para dar orientações financeiras personalizadas.
            </p>
            <div className="space-y-2 max-w-sm mx-auto">
              {QUICK_PROMPTS.map(p => (
                <button key={p.text} onClick={() => send(p.text)} disabled={msgRemaining <= 0}
                  className="card w-full p-3 flex items-center gap-3 text-left transition-all hover:scale-[1.01]"
                  style={{ cursor: 'pointer' }}>
                  <span className="text-lg">{p.emoji}</span>
                  <span className="text-sm font-medium flex-1" style={{ color: 'var(--txt0)' }}>{p.label}</span>
                  <ChevronRight size={14} style={{ color: 'var(--txt2)' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>✦</div>
            )}
            <div className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-bot'}>
              {msg.role === 'assistant' && (
                <div className="text-xs font-bold mb-1.5" style={{ color: 'var(--purple)' }}>Fino IA</div>
              )}
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--purple-dim)', color: 'var(--purple)' }}>✦</div>
            <div className="ai-bubble-bot flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--purple)' }} />
              <span style={{ fontSize: 13, color: 'var(--txt2)' }}>Analisando seus dados...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Limite */}
      {msgRemaining <= 0 && (
        <div className="card p-4 mb-3 flex items-center gap-3"
          style={{ borderColor: 'rgba(124,77,255,0.2)', background: 'var(--purple-dim)' }}>
          <Gem size={18} style={{ color: 'var(--purple)', flexShrink: 0 }} />
          <div className="flex-1">
            <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Limite atingido</div>
            <div className="text-xs" style={{ color: 'var(--txt2)' }}>Faça upgrade para continuar usando a IA.</div>
          </div>
          <a href="/upgrade" className="btn-purple" style={{ width: 'auto', padding: '8px 14px', fontSize: 12 }}>
            Upgrade
          </a>
        </div>
      )}

      {/* Input */}
      <div className="card p-3 flex gap-2 items-end" style={{ border: '1px solid var(--border2)' }}>
        <textarea ref={inputRef} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          placeholder={msgRemaining > 0 ? 'Pergunte sobre suas finanças...' : 'Upgrade para continuar'}
          disabled={msgRemaining <= 0 || loading} rows={2}
          style={{
            flex: 1, resize: 'none', background: 'transparent', border: 'none',
            boxShadow: 'none', outline: 'none', fontSize: 14, color: 'var(--txt0)',
            fontFamily: 'var(--font-sora)',
          }} />
        <button onClick={() => send(input)}
          disabled={!input.trim() || loading || msgRemaining <= 0}
          style={{
            padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: input.trim() && !loading && msgRemaining > 0 ? 'var(--green)' : 'var(--border)',
            color: input.trim() && !loading && msgRemaining > 0 ? '#0A0A0A' : 'var(--txt2)',
            transition: 'all 0.15s', flexShrink: 0,
          }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
