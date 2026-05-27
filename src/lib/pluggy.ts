// src/lib/pluggy.ts
// Serviço Pluggy — Open Finance Brasil
// API key NUNCA vai ao frontend

const PLUGGY_CLIENT_ID     = process.env.PLUGGY_CLIENT_ID     ?? ''
const PLUGGY_CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET ?? ''
const PLUGGY_BASE_URL      = 'https://api.pluggy.ai'

// ── AUTH — gerar API Key (válida por 2h) ──────────────────────────────────

let cachedApiKey:   string | null = null
let apiKeyExpiresAt: number       = 0

export async function getPluggyApiKey(): Promise<string> {
  // Reusar se ainda válida
  if (cachedApiKey && Date.now() < apiKeyExpiresAt - 60_000) {
    return cachedApiKey
  }

  const res = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      clientId:     PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    }),
  })

  if (!res.ok) throw new Error(`Pluggy auth failed: ${res.status}`)

  const data = await res.json()
  cachedApiKey   = data.apiKey
  apiKeyExpiresAt = Date.now() + 2 * 60 * 60 * 1000 // 2h

  return cachedApiKey!
}

// ── CONNECT TOKEN — para o widget no frontend ─────────────────────────────

export async function createConnectToken(itemId?: string): Promise<string> {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/connect_token`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY':    apiKey,
    },
    body: JSON.stringify({
      ...(itemId ? { itemId } : {}),
    }),
  })

  if (!res.ok) throw new Error(`Pluggy connect token failed: ${res.status}`)
  const data = await res.json()
  return data.accessToken
}

// ── ITEM — buscar item (conexão bancária) ────────────────────────────────

export async function getItem(itemId: string) {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) throw new Error(`Pluggy getItem failed: ${res.status}`)
  return res.json()
}

// ── ACCOUNTS — contas do item ────────────────────────────────────────────

export async function getAccounts(itemId: string) {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/accounts?itemId=${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) throw new Error(`Pluggy getAccounts failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

// ── TRANSACTIONS — transações de uma conta ───────────────────────────────

export async function getTransactions(
  accountId: string,
  from?: string,
  to?: string
) {
  const apiKey = await getPluggyApiKey()

  const params = new URLSearchParams({ accountId })
  if (from) params.append('from', from)
  if (to)   params.append('to',   to)

  const res = await fetch(`${PLUGGY_BASE_URL}/transactions?${params}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) throw new Error(`Pluggy getTransactions failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

// ── DELETE ITEM ───────────────────────────────────────────────────────────

export async function deleteItem(itemId: string) {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
    method:  'DELETE',
    headers: { 'X-API-KEY': apiKey },
  })

  return res.ok
}

// ── CONNECTORS — listar bancos disponíveis ───────────────────────────────

export async function getConnectors() {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/connectors?countries=BR`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) throw new Error(`Pluggy getConnectors failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

// ── CATEGORIZAÇÃO AUTO ────────────────────────────────────────────────────

// Mapeia categorias do Pluggy para categorias do Fino
export function mapPluggyCategory(pluggyCategory: string): string {
  const map: Record<string, string> = {
    'Food and Beverage':    'cat-alimentacao',
    'Transport':            'cat-transporte',
    'Health':               'cat-saude',
    'Entertainment':        'cat-lazer',
    'Education':            'cat-educacao',
    'Housing':              'cat-moradia',
    'Subscription':         'cat-assinatura',
    'Income':               'cat-salario',
    'Transfer':             'cat-outros-inc',
    'Financial Services':   'cat-outros-exp',
  }
  return map[pluggyCategory] ?? 'cat-outros-exp'
}
