// src/components/transactions/transactions-client.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, X, Loader2 } from 'lucide-react'
import { formatCurrency, currentMonth } from '@/lib/finance'
import type { Transaction, Category, TransactionType } from '@/types'

interface Props {
  transactions: Transaction[]
  categories:   Category[]
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export function TransactionsClient({ transactions: initial, categories }: Props) {
  const router = useRouter()
  const [txs,          setTxs]         = useState<Transaction[]>(initial)
  const [showForm,     setShowForm]    = useState(false)
  const [loading,      setLoading]     = useState(false)
  const [search,       setSearch]      = useState('')
  const [filterType,   setFilterType]  = useState<'ALL' | TransactionType>('ALL')
  const [filterMonth,  setFilterMonth] = useState(currentMonth())

  const [form, setForm] = useState({
    type:          'EXPENSE' as TransactionType,
    amount:        '',
    description:   '',
    categoryId:    '',
    date:          new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    isRecurring:   false,
    notes:         '',
  })

  const filteredCats = categories.filter(c =>
    form.type === 'INCOME' ? c.type === 'INCOME' : c.type === 'EXPENSE'
  )

  // 6 meses atrás + mês atual + 6 meses à frente
  const monthOptions = Array.from({ length: 13 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - 6 + i)
    const val   = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}${i === 6 ? ' ✓' : ''}`
    return { val, label }
  })

  const filtered = useMemo(() => {
    return txs.filter(t => {
      const d    = new Date(t.date)
      const val  = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      const matchMonth  = val === filterMonth
      const matchType   = filterType === 'ALL' || t.type === filterType
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase())
      return matchMonth && matchType && matchSearch
    })
  }, [txs, filterMonth, filterType, search])

  const totalIncome  = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.description || !form.categoryId) return
    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Erro ao salvar.')
        return
      }
      const { data } = await res.json()
      setTxs(prev => [data, ...prev])
      setForm({ type: 'EXPENSE', amount: '', description: '', categoryId: '', date: new Date().toISOString().slice(0, 10), paymentMethod: '', isRecurring: false, notes: '' })
      setShowForm(false)
      router.refresh()
    } catch {
      alert('Erro ao salvar transação.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return
    setTxs(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Lançamentos</h1>
          <p className="page-sub">{filtered.length} transações</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary w-auto px-4 flex items-center gap-1.5">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Fechar' : 'Novo'}
        </button>
      </div>

      {/* FORMULÁRIO */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-4 space-y-3 animate-fade-up">
          <div className="flex bg-fino-bg3 rounded-sm p-1 gap-1">
            {(['EXPENSE', 'INCOME'] as TransactionType[]).map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t, categoryId: '' }))}
                className={`flex-1 py-2 text-xs font-semibold rounded transition-all ${
                  form.type === t ? 'bg-fino-bg1 text-fino-txt0 shadow' : 'text-fino-txt2'
                }`}
              >
                {t === 'EXPENSE' ? 'Gasto' : 'Receita'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" required placeholder="0,00"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="input" inputMode="decimal" />
            </div>
            <div>
              <label className="label">Data</label>
              <input type="date" required value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="input" />
            </div>
          </div>

          <div>
            <label className="label">Descrição</label>
            <input type="text" required minLength={2} placeholder="Ex: Supermercado"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoria</label>
              <select required value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                className="input">
                <option value="">Selecione</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pagamento</label>
              <select value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                className="input">
                <option value="">Opcional</option>
                <option value="pix">Pix</option>
                <option value="cartao_credito">Cartão de crédito</option>
                <option value="cartao_debito">Cartão de débito</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="transferencia">Transferência</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-fino-txt1 cursor-pointer">
            <input type="checkbox" checked={form.isRecurring}
              onChange={e => setForm(f => ({ ...f, isRecurring: e.target.checked }))}
              className="rounded" />
            Transação recorrente 🔁
          </label>

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : 'Salvar lançamento'}
          </button>
        </form>
      )}

      {/* FILTROS */}
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fino-txt2" />
          <input placeholder="Buscar..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-8 text-xs" />
        </div>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="input text-xs w-auto">
          {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="input text-xs w-auto">
          <option value="ALL">Todos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Gastos</option>
        </select>
      </div>

      {/* TOTAIS */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3">
          <div className="text-xs text-fino-txt2 mb-1">Receitas</div>
          <div className="text-lg font-bold font-mono text-fino-green">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-fino-txt2 mb-1">Gastos</div>
          <div className="text-lg font-bold font-mono text-fino-red">{formatCurrency(totalExpense)}</div>
        </div>
      </div>

      {/* LISTA */}
      <div className="card divide-y divide-white/[0.05]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-fino-txt2 text-sm">
            Nenhuma transação em {monthOptions.find(m => m.val === filterMonth)?.label ?? filterMonth}.
          </div>
        ) : filtered.map(tx => (
          <div key={tx.id} className="flex items-center gap-3 p-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: `${tx.category.color}1a` }}>
              {tx.category.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-fino-txt0 truncate">{tx.description}</div>
              <div className="text-xs text-fino-txt2">
                {new Date(tx.date).toLocaleDateString('pt-BR')} · {tx.category.name}
                {tx.paymentMethod && ` · ${tx.paymentMethod.replace('_', ' ')}`}
                {tx.isRecurring && ' · 🔁'}
              </div>
            </div>
            <span className={`text-sm font-semibold font-mono flex-shrink-0 ${tx.type === 'INCOME' ? 'text-fino-green' : 'text-fino-red'}`}>
              {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
            <button onClick={() => handleDelete(tx.id)}
              className="p-1.5 rounded hover:bg-fino-red/10 text-fino-txt2 hover:text-fino-red transition-colors flex-shrink-0">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
