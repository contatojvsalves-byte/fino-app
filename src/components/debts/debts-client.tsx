// src/components/debts/debts-client.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CheckCircle, X, Loader2, CreditCard, ChevronDown, ChevronUp, Banknote } from 'lucide-react'
import { formatCurrency, calcDebtProjection } from '@/lib/finance'

interface DebtPayment { id: string; amount: number; paidAt: string; notes?: string }

interface Debt {
  id:                  string
  name:                string
  originalAmount:      number
  currentBalance:      number
  monthlyInterestRate: number
  monthlyPayment:      number
  dueDate:             string | null
  status:              string
  notes:               string | null
  isInstallment:       boolean
  totalInstallments:   number | null
  paidInstallments:    number
  installmentDueDay:   number | null
  payments:            DebtPayment[]
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE:      { label: 'Ativa',            cls: 'badge-red'    },
  PARTIAL:     { label: 'Pago parcialmente', cls: 'badge-amber'  },
  PAID:        { label: 'Quitada',           cls: 'badge-green'  },
  NEGOTIATING: { label: 'Negociando',        cls: 'badge-amber'  },
  DEFAULTED:   { label: 'Em atraso',         cls: 'badge-red'    },
}

export function DebtsClient({ debts: initial }: { debts: Debt[] }) {
  const router    = useRouter()
  const [debts,    setDebts]    = useState<Debt[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Pagamento parcial
  const [payingId,     setPayingId]     = useState<string | null>(null)
  const [payAmount,    setPayAmount]    = useState('')
  const [payNotes,     setPayNotes]     = useState('')
  const [payLoading,   setPayLoading]   = useState(false)

  // Form nova dívida
  const [form, setForm] = useState({
    name:                '',
    originalAmount:      '',
    currentBalance:      '',
    monthlyInterestRate: '',
    monthlyPayment:      '',
    dueDate:             '',
    notes:               '',
    isInstallment:       false,
    totalInstallments:   '',
    installmentDueDay:   '',
  })

  const active = debts.filter(d => d.status !== 'PAID')
  const totalBalance = active.reduce((s, d) => s + d.currentBalance, 0)
  const totalPayment = active.reduce((s, d) => s + d.monthlyPayment, 0)

  function resetForm() {
    setForm({ name:'', originalAmount:'', currentBalance:'', monthlyInterestRate:'',
      monthlyPayment:'', dueDate:'', notes:'', isInstallment:false, totalInstallments:'', installmentDueDay:'' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/debts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:                form.name,
          originalAmount:      +form.originalAmount,
          currentBalance:      form.currentBalance ? +form.currentBalance : undefined,
          monthlyInterestRate: form.monthlyInterestRate ? +form.monthlyInterestRate / 100 : 0,
          monthlyPayment:      form.isInstallment ? 0 : +form.monthlyPayment,
          dueDate:             form.dueDate || null,
          notes:               form.notes || undefined,
          isInstallment:       form.isInstallment,
          totalInstallments:   form.isInstallment && form.totalInstallments ? +form.totalInstallments : null,
          installmentDueDay:   form.isInstallment && form.installmentDueDay ? +form.installmentDueDay : null,
        }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      const { data } = await res.json()
      setDebts(prev => [data, ...prev])
      resetForm()
      setShowForm(false)
      router.refresh()
    } catch { alert('Erro ao salvar.') }
    finally { setLoading(false) }
  }

  async function handlePartialPayment(debtId: string) {
    if (!payAmount || +payAmount <= 0) { alert('Informe um valor válido.'); return }
    setPayLoading(true)
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount: +payAmount, notes: payNotes || undefined }),
      })
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      const { data } = await res.json()
      setDebts(prev => prev.map(d => d.id === debtId ? { ...data.debt } : d))
      setPayingId(null)
      setPayAmount('')
      setPayNotes('')
      router.refresh()
    } catch { alert('Erro ao registrar pagamento.') }
    finally { setPayLoading(false) }
  }

  async function handleMarkPaid(id: string) {
    const debt = debts.find(d => d.id === id)
    if (!debt) return
    // Registrar pagamento do saldo restante
    setPayingId(id)
    setPayAmount(String(debt.currentBalance))
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta dívida?')) return
    setDebts(prev => prev.filter(d => d.id !== id))
    await fetch(`/api/debts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Dívidas</h1>
          <p className="page-sub">{active.length} ativa{active.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); resetForm() }}
          className="btn-primary w-auto px-4 flex items-center gap-1.5" style={{ width: 'auto' }}>
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Fechar' : 'Nova'}
        </button>
      </div>

      {/* Totais */}
      {active.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--txt2)' }}>Total em dívidas</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'var(--red)' }}>{formatCurrency(totalBalance)}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--txt2)' }}>Pagamento mensal</div>
            <div className="text-xl font-bold font-mono" style={{ color: 'var(--amber)' }}>{formatCurrency(totalPayment)}</div>
          </div>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-4 space-y-3 animate-fade-up">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Nova dívida</h2>

          <div>
            <label className="label">Nome da dívida</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Cartão Nubank" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor total (R$)</label>
              <input required type="number" step="0.01" min="0.01"
                value={form.originalAmount} onChange={e => setForm(f => ({ ...f, originalAmount: e.target.value }))}
                placeholder="0,00" className="input" />
            </div>
            <div>
              <label className="label">Saldo atual (R$)</label>
              <input type="number" step="0.01" min="0"
                value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))}
                placeholder="Igual ao total" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Juros ao mês (%)</label>
            <input type="number" step="0.1" min="0" max="100"
              value={form.monthlyInterestRate} onChange={e => setForm(f => ({ ...f, monthlyInterestRate: e.target.value }))}
              placeholder="Ex: 5.5 — deixe 0 se não tiver juros" className="input" />
          </div>

          {/* Checkbox parcelado */}
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
            <input type="checkbox" checked={form.isInstallment}
              onChange={e => setForm(f => ({ ...f, isInstallment: e.target.checked, monthlyPayment: '' }))}
              className="w-4 h-4 accent-green-500" />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>É uma dívida parcelada?</div>
              <div className="text-xs" style={{ color: 'var(--txt2)' }}>Ex: compra parcelada no cartão, financiamento</div>
            </div>
          </label>

          {form.isInstallment ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total de parcelas</label>
                <input required={form.isInstallment} type="number" min="1" max="999"
                  value={form.totalInstallments} onChange={e => setForm(f => ({ ...f, totalInstallments: e.target.value }))}
                  placeholder="Ex: 12" className="input" />
                {form.totalInstallments && form.originalAmount && (
                  <p className="text-xs mt-1" style={{ color: 'var(--green)' }}>
                    {formatCurrency(+form.originalAmount / +form.totalInstallments)}/parcela
                  </p>
                )}
              </div>
              <div>
                <label className="label">Dia do vencimento</label>
                <input type="number" min="1" max="31"
                  value={form.installmentDueDay} onChange={e => setForm(f => ({ ...f, installmentDueDay: e.target.value }))}
                  placeholder="Ex: 10" className="input" />
              </div>
            </div>
          ) : (
            <div>
              <label className="label">Pagamento mensal (R$)</label>
              <input required={!form.isInstallment} type="number" step="0.01" min="0"
                value={form.monthlyPayment} onChange={e => setForm(f => ({ ...f, monthlyPayment: e.target.value }))}
                placeholder="0,00" className="input" />
            </div>
          )}

          <div>
            <label className="label">Data de vencimento</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              className="input" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Salvar dívida'}
          </button>
        </form>
      )}

      {/* Lista */}
      {debts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>Nenhuma dívida cadastrada</p>
          <p className="text-xs mt-1" style={{ color: 'var(--txt2)' }}>Adicione suas dívidas para acompanhar e quitar mais rápido.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map(debt => {
            const proj      = debt.status !== 'PAID' ? calcDebtProjection(debt as any, 'avalanche') : null
            const months    = proj?.monthsToPayoff ?? 0
            const pctPaid   = debt.originalAmount > 0
              ? Math.round((1 - debt.currentBalance / debt.originalAmount) * 100)
              : 100
            const isExpanded = expanded === debt.id
            const isPaying   = payingId === debt.id
            const remaining  = debt.isInstallment && debt.totalInstallments
              ? debt.totalInstallments - debt.paidInstallments
              : null

            return (
              <div key={debt.id} className="card overflow-hidden">
                {/* Topo */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: 'var(--red-dim)' }}>
                      <CreditCard size={18} style={{ color: 'var(--red)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>{debt.name}</span>
                        <span className={STATUS_LABELS[debt.status]?.cls ?? 'badge-red'}>
                          {STATUS_LABELS[debt.status]?.label}
                        </span>
                        {debt.isInstallment && (
                          <span className="badge-purple">Parcelado</span>
                        )}
                      </div>

                      {/* Info parcelamento */}
                      {debt.isInstallment && debt.totalInstallments && (
                        <div className="text-xs mt-1" style={{ color: 'var(--purple)' }}>
                          {debt.paidInstallments}/{debt.totalInstallments} parcelas pagas
                          {remaining !== null && remaining > 0 && ` · faltam ${remaining}`}
                          {debt.installmentDueDay && ` · vence dia ${debt.installmentDueDay}`}
                        </div>
                      )}

                      {!debt.isInstallment && (
                        <div className="text-xs mt-0.5" style={{ color: 'var(--txt2)' }}>
                          {debt.monthlyInterestRate > 0 ? `${(debt.monthlyInterestRate * 100).toFixed(1)}% a.m.` : 'Sem juros'}
                          {debt.dueDate && ` · vence ${new Date(debt.dueDate).toLocaleDateString('pt-BR')}`}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-base font-bold font-mono" style={{ color: 'var(--red)' }}>
                        {formatCurrency(debt.currentBalance)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--txt2)' }}>
                        {formatCurrency(debt.monthlyPayment)}/mês
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  {debt.status !== 'PAID' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span style={{ color: 'var(--txt2)' }}>{pctPaid}% pago</span>
                        {proj && months > 0 && months < 600 && (
                          <span style={{ color: 'var(--txt2)' }}>
                            Quitação em {Math.floor(months / 12) > 0 ? `${Math.floor(months / 12)}a ` : ''}{months % 12}m
                          </span>
                        )}
                      </div>
                      <div className="progress-wrap">
                        <div className="progress-fill" style={{
                          width:      `${pctPaid}%`,
                          background: pctPaid >= 100 ? 'var(--green)' : pctPaid >= 50 ? 'var(--amber)' : 'var(--red)',
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações */}
                {debt.status !== 'PAID' && (
                  <div className="px-4 pb-4 flex gap-2 flex-wrap">
                    <button onClick={() => { setPayingId(isPaying ? null : debt.id); setPayAmount(''); setPayNotes('') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(0,230,118,0.2)', cursor: 'pointer' }}>
                      <Banknote size={13} /> Registrar pagamento
                    </button>
                    <button onClick={() => handleMarkPaid(debt.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(124,77,255,0.2)', cursor: 'pointer' }}>
                      <CheckCircle size={13} /> Marcar como pago
                    </button>
                    <button onClick={() => setExpanded(isExpanded ? null : debt.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all ml-auto"
                      style={{ background: 'var(--bg-card2)', color: 'var(--txt2)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      Histórico
                    </button>
                    <button onClick={() => handleDelete(debt.id)} className="btn-danger">
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}

                {debt.status === 'PAID' && (
                  <div className="px-4 pb-4 flex gap-2">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--green)' }}>
                      <CheckCircle size={13} /> Dívida quitada!
                    </div>
                    <button onClick={() => handleDelete(debt.id)} className="btn-danger ml-auto">
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}

                {/* Panel pagamento parcial */}
                {isPaying && (
                  <div className="px-4 pb-4 pt-0 animate-fade-up">
                    <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>
                        💰 Registrar pagamento — saldo atual: {formatCurrency(debt.currentBalance)}
                      </p>
                      {debt.isInstallment && debt.monthlyPayment > 0 && (
                        <button onClick={() => setPayAmount(String(debt.monthlyPayment))}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'var(--green-dim)', color: 'var(--green)', border: 'none', cursor: 'pointer' }}>
                          Usar valor da parcela ({formatCurrency(debt.monthlyPayment)})
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="label">Valor pago (R$)</label>
                          <input type="number" step="0.01" min="0.01" max={debt.currentBalance}
                            value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            placeholder="0,00" className="input" autoFocus />
                        </div>
                        <div>
                          <label className="label">Observação</label>
                          <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)}
                            placeholder="Opcional" className="input" />
                        </div>
                      </div>
                      {payAmount && +payAmount > 0 && (
                        <p className="text-xs" style={{ color: 'var(--txt2)' }}>
                          Saldo após pagamento: <span style={{ color: 'var(--txt0)', fontWeight: 600 }}>
                            {formatCurrency(Math.max(0, debt.currentBalance - +payAmount))}
                          </span>
                          {+payAmount >= debt.currentBalance && <span style={{ color: 'var(--green)' }}> — Dívida quitada! 🎉</span>}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handlePartialPayment(debt.id)} disabled={payLoading}
                          className="btn-primary flex items-center justify-center gap-2" style={{ flex: 1 }}>
                          {payLoading ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar pagamento'}
                        </button>
                        <button onClick={() => { setPayingId(null); setPayAmount(''); setPayNotes('') }}
                          className="btn-ghost" style={{ width: 'auto', padding: '10px 14px' }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Histórico de pagamentos */}
                {isExpanded && debt.payments.length > 0 && (
                  <div className="px-4 pb-4 animate-fade-up">
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--txt2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Histórico de pagamentos
                    </p>
                    <div className="space-y-1.5">
                      {debt.payments.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg"
                          style={{ background: 'var(--bg-card2)' }}>
                          <div>
                            <div className="text-xs font-semibold" style={{ color: 'var(--green)' }}>
                              +{formatCurrency(p.amount)}
                            </div>
                            {p.notes && <div className="text-xs" style={{ color: 'var(--txt2)' }}>{p.notes}</div>}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--txt2)' }}>
                            {new Date(p.paidAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && debt.payments.length === 0 && (
                  <div className="px-4 pb-4">
                    <p className="text-xs text-center py-2" style={{ color: 'var(--txt2)' }}>Nenhum pagamento registrado.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Notificação PWA info */}
      <div className="mt-4 card p-3 flex items-start gap-3"
        style={{ border: '1px solid rgba(124,77,255,0.15)', background: 'var(--purple-dim)' }}>
        <span className="text-xl">🔔</span>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--purple)' }}>Notificações de vencimento</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--txt2)' }}>
            Instale o Fino como app (PWA) para receber lembretes automáticos no dia do vencimento das suas parcelas.
          </p>
        </div>
      </div>
    </div>
  )
}
