// src/components/open-finance/open-finance-client.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Trash2, Building2, Loader2, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'

interface BankAccount {
  id:          string
  name:        string
  type:        string
  number:      string | null
  balance:     number
  creditLimit: number | null
  lastSyncAt:  string | null
}

interface BankConnection {
  id:          string
  bankName:    string
  bankLogo:    string | null
  status:      string
  lastSyncAt:  string | null
  accounts:    BankAccount[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  UPDATED:   { label: 'Sincronizado',  color: 'var(--green)', icon: <CheckCircle size={13} /> },
  UPDATING:  { label: 'Atualizando',  color: 'var(--amber)', icon: <Loader2 size={13} className="animate-spin" /> },
  OUTDATED:  { label: 'Desatualizado', color: 'var(--amber)', icon: <AlertCircle size={13} /> },
  ERROR:     { label: 'Erro',          color: 'var(--red)',   icon: <AlertCircle size={13} /> },
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS:  'Poupança',
  CREDIT:   'Cartão de crédito',
}

export function OpenFinanceClient({ connections: initial }: { connections: BankConnection[] }) {
  const router      = useRouter()
  const [connections, setConnections] = useState<BankConnection[]>(initial)
  const [loading,    setLoading]      = useState(false)
  const [syncing,    setSyncing]      = useState(false)
  const [syncResult, setSyncResult]   = useState<{ imported: number; skipped: number } | null>(null)
  const [pluggyLoaded, setPluggyLoaded] = useState(false)

  // Carregar SDK do Pluggy
  useEffect(() => {
    if (document.getElementById('pluggy-sdk')) { setPluggyLoaded(true); return }
    const script    = document.createElement('script')
    script.id       = 'pluggy-sdk'
    script.src      = 'https://cdn.pluggy.ai/pluggy-connect/v2.1.1/pluggy-connect.js'
    script.onload   = () => setPluggyLoaded(true)
    script.onerror  = () => console.error('Falha ao carregar SDK Pluggy')
    document.head.appendChild(script)
  }, [])

  async function handleConnect() {
    setLoading(true)
    try {
      // Gerar connect token no servidor
      const tokenRes = await fetch('/api/open-finance/connect-token', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const tokenData = await tokenRes.json()
      if (!tokenData.success) { alert(tokenData.error); return }

      const { connectToken } = tokenData.data

      // Abrir widget do Pluggy
      const PluggyConnect = (window as any).PluggyConnect
      if (!PluggyConnect) { alert('SDK do Pluggy não carregou. Recarregue a página.'); return }

      PluggyConnect({
        connectToken,
        includeSandbox: process.env.NODE_ENV !== 'production',
        onSuccess: async (itemData: any) => {
          // Salvar conexão no Fino
          const connectRes = await fetch('/api/open-finance/connect', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ itemId: itemData.item.id }),
          })
          const connectData = await connectRes.json()
          if (connectData.success) {
            router.refresh()
            // Recarregar conexões
            const syncRes = await fetch('/api/open-finance/sync')
            const syncData = await syncRes.json()
            if (syncData.success) setConnections(syncData.data)
          }
        },
        onError: (err: any) => {
          console.error('Pluggy error:', err)
          alert('Erro ao conectar. Tente novamente.')
        },
        onClose: () => setLoading(false),
      })
    } catch (err) {
      console.error(err)
      alert('Erro ao iniciar conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res  = await fetch('/api/open-finance/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (data.success) {
        setSyncResult(data.data)
        router.refresh()
      } else {
        alert(data.error)
      }
    } catch { alert('Erro ao sincronizar.') }
    finally { setSyncing(false) }
  }

  async function handleDisconnect(connectionId: string, bankName: string) {
    if (!confirm(`Desconectar ${bankName}? As transações importadas serão mantidas.`)) return
    setConnections(prev => prev.filter(c => c.id !== connectionId))
    await fetch('/api/open-finance/disconnect', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ connectionId }),
    })
    router.refresh()
  }

  const totalBalance = connections
    .flatMap(c => c.accounts)
    .filter(a => a.type !== 'CREDIT')
    .reduce((s, a) => s + a.balance, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Open Finance</h1>
          <p className="page-sub">Conecte seus bancos e importe transações automaticamente</p>
        </div>
        {connections.length > 0 && (
          <button onClick={handleSync} disabled={syncing}
            className="btn-primary flex items-center gap-2"
            style={{ width: 'auto', padding: '8px 16px' }}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
        )}
      </div>

      {/* Resultado da sync */}
      {syncResult && (
        <div className="card p-4 mb-4 flex items-center gap-3 animate-fade-up"
          style={{ border: '1px solid rgba(0,230,118,0.2)', background: 'var(--green-dim)' }}>
          <CheckCircle size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
              Sincronização concluída!
            </div>
            <div className="text-xs" style={{ color: 'var(--txt2)' }}>
              {syncResult.imported} transações importadas · {syncResult.skipped} já existiam
            </div>
          </div>
        </div>
      )}

      {/* Saldo consolidado */}
      {connections.length > 0 && (
        <div className="hero-card p-5 mb-4">
          <p className="text-xs font-semibold mb-1"
            style={{ color: 'var(--green)', opacity: 0.7, letterSpacing: '0.08em' }}>
            SALDO CONSOLIDADO
          </p>
          <div className="text-3xl font-bold font-mono mb-1" style={{ color: 'var(--txt0)' }}>
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs" style={{ color: 'var(--txt2)' }}>
            {connections.length} banco{connections.length !== 1 ? 's' : ''} conectado{connections.length !== 1 ? 's' : ''} ·
            {connections.flatMap(c => c.accounts).length} conta{connections.flatMap(c => c.accounts).length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Bancos conectados */}
      {connections.length > 0 && (
        <>
          <p className="section-label">Bancos conectados</p>
          <div className="space-y-3 mb-4">
            {connections.map(conn => {
              const status = STATUS_CONFIG[conn.status] ?? STATUS_CONFIG.ERROR
              return (
                <div key={conn.id} className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {conn.bankLogo ? (
                      <img src={conn.bankLogo} alt={conn.bankName}
                        className="w-10 h-10 rounded-xl object-contain"
                        style={{ background: '#fff', padding: 4 }} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--bg-card2)' }}>
                        <Building2 size={20} style={{ color: 'var(--txt2)' }} />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: 'var(--txt0)' }}>
                        {conn.bankName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: status.color }}>
                        {status.icon} {status.label}
                        {conn.lastSyncAt && (
                          <span style={{ color: 'var(--txt2)' }}>
                            · {new Date(conn.lastSyncAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDisconnect(conn.id, conn.bankName)}
                      className="btn-danger flex items-center gap-1">
                      <Trash2 size={12} /> Desconectar
                    </button>
                  </div>

                  {/* Contas */}
                  <div className="space-y-2">
                    {conn.accounts.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between p-2.5 rounded-xl"
                        style={{ background: 'var(--bg-card2)' }}>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: 'var(--txt0)' }}>
                            {acc.name}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--txt2)' }}>
                            {ACCOUNT_TYPE_LABEL[acc.type] ?? acc.type}
                            {acc.number && ` · ****${acc.number.slice(-4)}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold font-mono"
                            style={{ color: acc.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {formatCurrency(acc.balance)}
                          </div>
                          {acc.creditLimit && (
                            <div className="text-xs" style={{ color: 'var(--txt2)' }}>
                              Limite: {formatCurrency(acc.creditLimit)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* CTA conectar */}
      <div className="card p-6 text-center"
        style={{ border: '1px solid rgba(124,77,255,0.2)', background: 'var(--purple-dim)' }}>
        {connections.length === 0 ? (
          <>
            <div className="text-4xl mb-3">🏦</div>
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--txt0)' }}>
              Conecte seu banco
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--txt2)', lineHeight: 1.6 }}>
              Importe transações automaticamente de mais de 200 instituições financeiras brasileiras.
              Seus dados são protegidos — você autentica direto no banco.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--txt2)' }}>
              Conecte mais um banco ou instituição financeira
            </p>
          </>
        )}

        <button onClick={handleConnect} disabled={loading || !pluggyLoaded}
          className="btn-purple flex items-center justify-center gap-2 mx-auto"
          style={{ width: 'auto', padding: '12px 28px' }}>
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Abrindo...</>
          ) : (
            <><Zap size={15} /> Conectar banco</>
          )}
        </button>

        <p className="text-xs mt-3" style={{ color: 'var(--txt2)' }}>
          🔒 Powered by Pluggy · Open Finance Brasil · Regulado pelo Banco Central
        </p>
      </div>

      {/* Bancos disponíveis */}
      <p className="section-label">Instituições suportadas</p>
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {[
            'Nubank', 'Itaú', 'Bradesco', 'Santander', 'Banco do Brasil',
            'Caixa', 'Inter', 'C6 Bank', 'XP', 'BTG', 'Rico', 'Clear',
            'Mercado Pago', 'PicPay', 'Neon', 'Sicoob', 'Sicredi',
          ].map(bank => (
            <span key={bank} className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'var(--bg-card2)', color: 'var(--txt1)', border: '1px solid var(--border)' }}>
              {bank}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{ background: 'var(--purple-dim)', color: 'var(--purple)', border: '1px solid rgba(124,77,255,0.2)' }}>
            +200 mais
          </span>
        </div>
      </div>
    </div>
  )
}
