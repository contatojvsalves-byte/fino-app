// src/lib/quotes.ts
// Serviço de cotações — B3, cripto, ouro, tesouro
// Usa APIs públicas gratuitas

export interface QuoteResult {
  ticker:       string
  price:        number
  change:       number   // variação % no dia
  name:         string
  currency:     string
  lastUpdated:  string
  error?:       string
}

// ── AÇÕES B3, FIIs, ETFs — via brapi.dev (gratuita, sem key) ──────────────
export async function fetchBrazilianQuote(ticker: string): Promise<QuoteResult> {
  try {
    const token = process.env.BRAPI_TOKEN ?? 'demo'
const url = `https://brapi.dev/api/quote/${ticker.toUpperCase()}?token=${token}`
    const res  = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min
    if (!res.ok) throw new Error('Erro brapi')
    const data = await res.json()
    const q    = data?.results?.[0]
    if (!q) throw new Error('Ticker não encontrado')
    return {
      ticker:      ticker.toUpperCase(),
      price:       q.regularMarketPrice ?? 0,
      change:      q.regularMarketChangePercent ?? 0,
      name:        q.longName ?? q.shortName ?? ticker,
      currency:    'BRL',
      lastUpdated: new Date().toISOString(),
    }
  } catch (e: any) {
    return { ticker, price: 0, change: 0, name: ticker, currency: 'BRL', lastUpdated: new Date().toISOString(), error: e.message }
  }
}

// ── CRIPTO — via CoinGecko (gratuita, sem key) ─────────────────────────────
const CRYPTO_IDS: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  ADA:  'cardano',
  XRP:  'ripple',
  DOGE: 'dogecoin',
  MATIC:'matic-network',
  DOT:  'polkadot',
  AVAX: 'avalanche-2',
}

export async function fetchCryptoQuote(ticker: string): Promise<QuoteResult> {
  try {
    const id  = CRYPTO_IDS[ticker.toUpperCase()] ?? ticker.toLowerCase()
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=brl&include_24hr_change=true`
    const res  = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error('Erro CoinGecko')
    const data = await res.json()
    const coin = data[id]
    if (!coin) throw new Error('Cripto não encontrada')
    return {
      ticker:      ticker.toUpperCase(),
      price:       coin.brl ?? 0,
      change:      coin.brl_24h_change ?? 0,
      name:        ticker.toUpperCase(),
      currency:    'BRL',
      lastUpdated: new Date().toISOString(),
    }
  } catch (e: any) {
    return { ticker, price: 0, change: 0, name: ticker, currency: 'BRL', lastUpdated: new Date().toISOString(), error: e.message }
  }
}

// ── OURO — via metal price API ─────────────────────────────────────────────
export async function fetchGoldQuote(): Promise<QuoteResult> {
  try {
    // Ouro em BRL por grama (aprox. 1 troy oz = 31.1g)
    // Usa brapi que tem ouro
    const token = process.env.BRAPI_TOKEN ?? 'demo'
const res = await fetch(`https://brapi.dev/api/v2/currency?currency=XAU-BRL&token=${token}`, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('Erro ouro')
    const data = await res.json()
    const rate = data?.currency?.[0]?.bidPrice ?? 0
    const pricePerGram = rate / 31.1035
    return {
      ticker:      'XAU',
      price:       pricePerGram,
      change:      data?.currency?.[0]?.percentageChange ?? 0,
      name:        'Ouro (por grama)',
      currency:    'BRL',
      lastUpdated: new Date().toISOString(),
    }
  } catch (e: any) {
    return { ticker: 'XAU', price: 0, change: 0, name: 'Ouro', currency: 'BRL', lastUpdated: new Date().toISOString(), error: e.message }
  }
}

// ── DISPATCH por tipo ──────────────────────────────────────────────────────
export async function fetchQuote(ticker: string, type: string): Promise<QuoteResult> {
  if (type === 'CRYPTO') return fetchCryptoQuote(ticker)
  if (type === 'GOLD')   return fetchGoldQuote()
  // STOCK, FII, ETF, TREASURY, FIXED → brapi
  return fetchBrazilianQuote(ticker)
}

// ── BATCH: busca múltiplas cotações em paralelo ────────────────────────────
export async function fetchQuotes(
  items: { ticker: string; type: string }[]
): Promise<Record<string, QuoteResult>> {
  const results = await Promise.allSettled(
    items.map(i => fetchQuote(i.ticker, i.type))
  )
  const map: Record<string, QuoteResult> = {}
  results.forEach((r, i) => {
    const ticker = items[i].ticker
    map[ticker]  = r.status === 'fulfilled' ? r.value : {
      ticker, price: 0, change: 0, name: ticker, currency: 'BRL',
      lastUpdated: new Date().toISOString(), error: 'Falha',
    }
  })
  return map
}
