'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
interface NewsItem {
  id: string
  title: string
  link: string
  pubDate: string
  source: string
  sourceColor: string
  category: string
  categoryColor: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  impactScore: number
  summary: string
  asset: string | null
}

interface PriceTick {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  marketState: string
}

interface CalEvent {
  date: string
  time: string
  event: string
  impact: number
  category: string
  color: string
  previous: string
  forecast: string
  actual?: string
}

interface PriceAlert {
  id: string
  symbol: string
  asset: string
  name: string
  price: number
  changePct: number
  window: '2min' | '10min'
  timestamp: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const TABS = ['PULSE', 'FLASH', 'WATCHLIST', 'CALENDAR', 'ALL NEWS']
const CATEGORY_FILTERS = ['ALL', 'FED/RATES', 'MACRO', 'EARNINGS', 'AI/TECH', 'COMMODITIES', 'GEOPOLITICAL', 'CORPORATE']
const ASSET_FILTERS = ['ALL', 'OIL', 'GOLD', 'SILVER', 'GAS', 'COPPER', 'VIX', 'NVDA', 'AMD', 'PLTR', 'CEG', 'AVGO', 'MU', 'TSLA', 'BTC', 'FED', '10Y', 'USD', 'SPX']

const ASSET_COLORS: Record<string, string> = {
  OIL: '#f59e0b', GOLD: '#fbbf24', SILVER: '#94a3b8', GAS: '#06b6d4', COPPER: '#f97316',
  VIX: '#a855f7', NVDA: '#22c55e', AMD: '#ef4444', PLTR: '#8b5cf6', CEG: '#3b82f6',
  AVGO: '#0ea5e9', ARM: '#f97316', VRT: '#10b981', APP: '#ec4899', MU: '#6366f1',
  TSLA: '#cc2222', BTC: '#f97316', USD: '#22c55e', '10Y': '#3b82f6', FED: '#3b82f6', SPX: '#64748b',
}

const SYMBOL_TO_ASSET: Record<string, string> = {
  'SI=F':     'SILVER',
  'GC=F':     'GOLD',
  'CL=F':     'OIL',
  '^VIX':     'VIX',
  '^GSPC':    'SPX',
  '^TNX':     '10Y',
  'DX-Y.NYB': 'USD',
  'NVDA': 'NVDA', 'MU': 'MU', 'PLTR': 'PLTR', 'CEG': 'CEG',
  'AMD': 'AMD', 'AVGO': 'AVGO', 'APP': 'APP', 'ARM': 'ARM', 'VRT': 'VRT',
}

const MOVE_THRESHOLDS: Record<string, { short: number; long: number }> = {
  SILVER: { short: 0.4,  long: 1.0  },
  GOLD:   { short: 0.3,  long: 0.8  },
  OIL:    { short: 0.4,  long: 1.0  },
  VIX:    { short: 3.0,  long: 7.0  },
  SPX:    { short: 0.2,  long: 0.5  },
  '10Y':  { short: 0.5,  long: 1.2  },
  USD:    { short: 0.2,  long: 0.5  },
  NVDA:   { short: 0.8,  long: 2.0  },
  MU:     { short: 0.8,  long: 2.0  },
  PLTR:   { short: 0.8,  long: 2.0  },
  AMD:    { short: 0.8,  long: 2.0  },
  AVGO:   { short: 0.6,  long: 1.5  },
  CEG:    { short: 0.8,  long: 2.0  },
  APP:    { short: 0.8,  long: 2.0  },
  ARM:    { short: 0.8,  long: 2.0  },
  VRT:    { short: 0.8,  long: 2.0  },
  default: { short: 0.5, long: 1.5  },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function countdown(dateStr: string, timeUtc = '14:00'): string {
  const target = new Date(`${dateStr}T${timeUtc}:00Z`).getTime()
  const diff = target - Date.now()
  if (diff <= 0) return 'NOW'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function resultVibe(event: string, actual = '', forecast = ''): 'beat' | 'miss' | 'inline' | null {
  if (!actual || !forecast) return null
  const a = parseFloat(actual.replace(/[^-\d.]/g, ''))
  const f = parseFloat(forecast.replace(/[^-\d.]/g, ''))
  if (isNaN(a) || isNaN(f)) return null
  if (Math.abs(a - f) < 0.05) return 'inline'
  const lowerIsBetter = /cpi|pce|ppi|inflation|unemployment|jobless|claims|deficit/i.test(event)
  return (lowerIsBetter ? a < f : a > f) ? 'beat' : 'miss'
}

function impactDots(score: number, color = '#f59e0b') {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{
      display: 'inline-block', width: 5, height: 5, borderRadius: '50%', marginRight: 2,
      background: i < score ? color : '#1e293b',
    }} />
  ))
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SourceBadge({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{name}</span>
  )
}

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      background: 'transparent', color, borderLeft: `2px solid ${color}`,
      paddingLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    }}>{name}</span>
  )
}

function AssetChip({ tag, size = 'sm' }: { tag: string; size?: 'sm' | 'md' }) {
  const color = ASSET_COLORS[tag] ?? '#64748b'
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 4, padding: size === 'md' ? '2px 8px' : '1px 5px',
      fontSize: size === 'md' ? 11 : 9, fontWeight: 800, letterSpacing: '0.07em',
    }}>{tag}</span>
  )
}

function NewsCard({ item, isNew, compact = false }: { item: NewsItem; isNew?: boolean; compact?: boolean }) {
  const glowClass = item.sentiment === 'bullish' ? 'glow-green' : item.sentiment === 'bearish' ? 'glow-red' : ''
  const age = Date.now() - new Date(item.pubDate).getTime()
  const stale = age > 4 * 3600 * 1000
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className={`${isNew ? 'item-new' : ''} ${stale ? 'item-stale' : ''} ${glowClass}`}
      style={{
        display: 'block', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 8, padding: compact ? '10px 12px' : '12px 14px', marginBottom: 6,
        textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <SourceBadge name={item.source} color={item.sourceColor} />
        <CategoryBadge name={item.category} color={item.categoryColor} />
        {item.asset && <AssetChip tag={item.asset} />}
        {age < 5 * 60 * 1000 && (
          <span style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>NEW</span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11 }}>{timeAgo(item.pubDate)}</span>
      </div>
      <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: compact ? 12 : 13, lineHeight: 1.45, marginBottom: compact ? 0 : 4 }}>
        {item.title}
      </div>
      {!compact && item.summary && (
        <div style={{ color: 'var(--text-dim)', fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>
          {item.summary.slice(0, 120)}{item.summary.length > 120 ? '…' : ''}
        </div>
      )}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>{impactDots(item.impactScore)}</div>
          {item.sentiment !== 'neutral' && (
            <span style={{ fontSize: 10, color: item.sentiment === 'bullish' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
              {item.sentiment === 'bullish' ? '▲ BULLISH' : '▼ BEARISH'}
            </span>
          )}
        </div>
      )}
    </a>
  )
}

function PriceCard({ tick, prevPrice }: { tick: PriceTick; prevPrice?: number }) {
  const up = tick.changePct > 0
  const dn = tick.changePct < 0
  const changed = prevPrice !== undefined && prevPrice !== tick.price
  const flashClass = changed ? (tick.price > (prevPrice ?? 0) ? 'flash-up' : 'flash-down') : ''
  return (
    <div className={flashClass} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>{tick.symbol.replace('^', '').replace('=F', '')}</span>
        <span style={{ fontSize: 10, color: tick.marketState === 'REGULAR' ? '#22c55e' : '#64748b' }}>
          {tick.marketState === 'REGULAR' ? '● LIVE' : tick.marketState === 'PRE' ? '◐ PRE' : tick.marketState === 'POST' ? '◑ POST' : '○ CLOSED'}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', marginBottom: 2 }}>{fmt(tick.price)}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: up ? '#22c55e' : dn ? '#ef4444' : '#64748b' }}>
        {up ? '+' : ''}{fmt(tick.change)} ({up ? '+' : ''}{fmt(tick.changePct)}%)
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tick.name}</div>
    </div>
  )
}

// Flash card — executive trading intelligence format
function FlashCard({ item }: { item: NewsItem }) {
  const color = item.asset ? (ASSET_COLORS[item.asset] ?? '#64748b') : '#64748b'
  const age = Date.now() - new Date(item.pubDate).getTime()
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 6 }}>
      <div style={{
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(90deg, ${color}0d 0%, transparent 100%)`,
        borderRadius: '0 8px 8px 0', padding: '10px 14px', cursor: 'pointer',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${color}1a 0%, transparent 100%)`}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `linear-gradient(90deg, ${color}0d 0%, transparent 100%)`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          {item.asset && (
            <span style={{
              background: color + '22', color, border: `1px solid ${color}66`,
              borderRadius: 5, padding: '3px 9px', fontSize: 12, fontWeight: 900,
              letterSpacing: '0.08em', minWidth: 48, textAlign: 'center', display: 'inline-block',
            }}>{item.asset}</span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
            color: item.sentiment === 'bullish' ? '#22c55e' : item.sentiment === 'bearish' ? '#ef4444' : '#64748b',
          }}>
            {item.sentiment === 'bullish' ? '▲ BULLISH' : item.sentiment === 'bearish' ? '▼ BEARISH' : '⬌ NEUTRAL'}
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <SourceBadge name={item.source} color={item.sourceColor} />
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{timeAgo(item.pubDate)}</span>
          </span>
          {age < 5 * 60 * 1000 && (
            <span style={{ background: '#22c55e22', color: '#22c55e', borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>NEW</span>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: 'var(--text)', marginBottom: 4 }}>
          {item.title}
        </div>
        {item.summary && (
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {item.summary.slice(0, 100)}{item.summary.length > 100 ? '…' : ''}
          </div>
        )}
      </div>
    </a>
  )
}

function PriceAlertCard({ alert: a }: { alert: PriceAlert }) {
  const color = ASSET_COLORS[a.asset] ?? '#64748b'
  const up = a.changePct > 0
  const moveColor = up ? '#22c55e' : '#ef4444'
  return (
    <div style={{
      borderLeft: `3px solid ${moveColor}`,
      background: `linear-gradient(90deg, ${moveColor}10 0%, transparent 60%)`,
      borderRadius: '0 8px 8px 0', padding: '10px 14px', marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span style={{
          background: color + '22', color, border: `1px solid ${color}66`,
          borderRadius: 5, padding: '3px 9px', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em',
        }}>{a.asset}</span>
        <span style={{ fontWeight: 800, fontSize: 15, color: moveColor }}>
          {up ? '▲' : '▼'} {Math.abs(a.changePct).toFixed(2)}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>in {a.window}</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>⚡ PRICE ALERT</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(a.timestamp)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{fmt(a.price)}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.name} · {a.window} price move detected</span>
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [news, setNews]               = useState<NewsItem[]>([])
  const [newIds, setNewIds]           = useState<Set<string>>(new Set())
  const [market, setMarket]           = useState<PriceTick[]>([])
  const [watchlist, setWatchlist]     = useState<PriceTick[]>([])
  const [prevWl, setPrevWl]           = useState<Record<string, number>>({})
  const [calEvents, setCalEvents]     = useState<CalEvent[]>([])
  const [pastCalEvents, setPastCalEvents] = useState<CalEvent[]>([])
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [tab, setTab]                 = useState('PULSE')
  const [catFilter, setCatFilter]     = useState('ALL')
  const [assetFilter, setAssetFilter] = useState('ALL')
  const [now, setNow]                 = useState(new Date())
  const [newsAt, setNewsAt]           = useState<string | null>(null)
  const [pricesAt, setPricesAt]       = useState<string | null>(null)
  const knownIds       = useRef(new Set<string>())
  const priceHistoryRef = useRef<Record<string, { price: number; t: number }[]>>({})

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      const items: NewsItem[] = data.items ?? []
      const fresh = items.filter(i => !knownIds.current.has(i.id))
      fresh.forEach(i => knownIds.current.add(i.id))
      if (fresh.length > 0) {
        setNewIds(new Set(fresh.map(i => i.id)))
        setNews(prev => {
          const merged = [...fresh, ...prev]
          const seen = new Set<string>()
          return merged.filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true }).slice(0, 200)
        })
        setTimeout(() => setNewIds(new Set()), 4000)
      }
      setNewsAt(data.fetchedAt)
    } catch { /* silent */ }
  }, [])

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
      const nowMs = Date.now()

      // Price movement detection
      const allTicks: PriceTick[] = [...(data.market ?? []), ...(data.watchlist ?? [])]
      const newAlerts: PriceAlert[] = []

      for (const tick of allTicks) {
        const asset = SYMBOL_TO_ASSET[tick.symbol]
        if (!asset) continue

        const hist = priceHistoryRef.current[tick.symbol] ?? []
        hist.push({ price: tick.price, t: nowMs })
        if (hist.length > 45) hist.splice(0, hist.length - 45) // keep 15 min
        priceHistoryRef.current[tick.symbol] = hist

        const thr = MOVE_THRESHOLDS[asset] ?? MOVE_THRESHOLDS['default']

        // 2-min window (6 readings × 20s)
        if (hist.length >= 6) {
          const ref = hist[hist.length - 6]
          const pct = ((tick.price - ref.price) / ref.price) * 100
          if (Math.abs(pct) >= thr.short) {
            newAlerts.push({
              id: `${tick.symbol}-2m-${Math.floor(nowMs / 120000)}`,
              symbol: tick.symbol, asset, name: tick.name,
              price: tick.price, changePct: pct, window: '2min',
              timestamp: new Date(nowMs).toISOString(),
            })
          }
        }

        // 10-min window (30 readings × 20s)
        if (hist.length >= 30) {
          const ref = hist[hist.length - 30]
          const pct = ((tick.price - ref.price) / ref.price) * 100
          if (Math.abs(pct) >= thr.long) {
            newAlerts.push({
              id: `${tick.symbol}-10m-${Math.floor(nowMs / 600000)}`,
              symbol: tick.symbol, asset, name: tick.name,
              price: tick.price, changePct: pct, window: '10min',
              timestamp: new Date(nowMs).toISOString(),
            })
          }
        }
      }

      if (newAlerts.length > 0 || true) {
        setPriceAlerts(prev => {
          const map = new Map([...prev, ...newAlerts].map(a => [a.id, a]))
          const cutoff = nowMs - 20 * 60 * 1000 // expire after 20 min
          return Array.from(map.values())
            .filter(a => new Date(a.timestamp).getTime() > cutoff)
            .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
            .slice(0, 15)
        })
      }

      setPrevWl(prev => {
        const next = { ...prev }
        ;(data.watchlist ?? []).forEach((t: PriceTick) => { next[t.symbol] = t.price })
        return next
      })
      setMarket(data.market ?? [])
      setWatchlist(data.watchlist ?? [])
      setPricesAt(data.fetchedAt)
    } catch { /* silent */ }
  }, [])

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar')
      const data = await res.json()
      setCalEvents(data.events ?? [])
      setPastCalEvents(data.pastEvents ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNews(); fetchPrices(); fetchCalendar()
    const ni = setInterval(fetchNews, 90_000)
    const pi = setInterval(fetchPrices, 20_000)
    const ci = setInterval(fetchCalendar, 3_600_000)
    return () => { clearInterval(ni); clearInterval(pi); clearInterval(ci) }
  }, [fetchNews, fetchPrices, fetchCalendar])

  // Derived data
  const timelineItems = news.filter(i => {
    if (catFilter !== 'ALL' && i.category !== catFilter) return false
    if (assetFilter !== 'ALL' && i.asset !== assetFilter) return false
    return true
  })
  const flashItems = assetFilter === 'ALL'
    ? news.filter(i => i.asset !== null)
    : news.filter(i => i.asset === assetFilter)
  const topImpact  = [...news].sort((a, b) => b.impactScore - a.impactScore).slice(0, 10)
  const breaking   = topImpact[0]
  const upcoming   = calEvents.filter(e => new Date(`${e.date}T${e.time}:00Z`).getTime() > Date.now()).slice(0, 5)
  const nextEvent  = upcoming[0]

  // Filter pill button helper
  const filterBtn = (label: string, active: boolean, onClick: () => void, color?: string) => (
    <button key={label} onClick={onClick} style={{
      padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.05em', border: '1px solid', cursor: 'pointer',
      background: active ? (color ?? 'var(--accent)') : 'transparent',
      borderColor: active ? (color ?? 'var(--accent)') : 'var(--border)',
      color: active ? '#fff' : 'var(--text-dim)',
      transition: 'all 0.12s',
    }}>{label}</button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(to bottom, #0a0f1e, var(--surface))', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="live-dot" />
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.12em', color: 'var(--accent)' }}>MARKET PULSE</span>
            <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>LIVE</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                letterSpacing: '0.06em', border: 'none', cursor: 'pointer',
                background: tab === t ? (t === 'FLASH' ? '#f59e0b' : 'var(--accent)') : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-dim)', transition: 'all 0.15s',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
            <span className="mono">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' })} ET</span>
            {newsAt && <span style={{ marginLeft: 8, color: '#334155' }}>· {news.length} items</span>}
          </div>
        </div>
        {/* Ticker strip */}
        <div style={{ overflow: 'hidden', padding: '5px 0' }}>
          <div className="ticker-track" style={{ display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' }}>
            {[...market, ...market].map((t, i) => {
              const up = t.changePct > 0; const dn = t.changePct < 0
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', borderRight: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>{t.name}</span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{fmt(t.price)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#22c55e' : dn ? '#ef4444' : '#64748b' }}>
                    {up ? '▲' : dn ? '▼' : '▬'} {Math.abs(t.changePct).toFixed(2)}%
                  </span>
                </span>
              )
            })}
          </div>
        </div>
        {/* Price alert banner — visible on all tabs */}
        {priceAlerts.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px',
            background: '#080e18', borderTop: '1px solid #1e293b', overflowX: 'auto', flexShrink: 0,
          }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', letterSpacing: '0.12em', whiteSpace: 'nowrap', marginRight: 4 }}>⚡ MOVES</span>
            {priceAlerts.map(a => {
              const color = ASSET_COLORS[a.asset] ?? '#64748b'
              const up = a.changePct > 0
              const mc = up ? '#22c55e' : '#ef4444'
              return (
                <button key={a.id} onClick={() => { setTab('FLASH'); setAssetFilter(a.asset) }} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                  background: mc + '15', border: `1px solid ${mc}40`,
                  borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                }}>
                  <span style={{ color, fontWeight: 800, fontSize: 10 }}>{a.asset}</span>
                  <span style={{ color: mc, fontWeight: 700, fontSize: 10 }}>
                    {up ? '▲' : '▼'}{Math.abs(a.changePct).toFixed(2)}%
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>{a.window}</span>
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Timeline */}
        <aside style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 7 }}>
              LIVE TIMELINE
              {newsAt && <span style={{ float: 'right', fontWeight: 400, color: '#334155' }}>updated {timeAgo(newsAt)}</span>}
            </div>
            {/* Category filter row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 5 }}>
              {CATEGORY_FILTERS.map(c => filterBtn(
                c === 'ALL' ? 'ALL' : c.split('/')[0],
                catFilter === c,
                () => setCatFilter(c)
              ))}
            </div>
            {/* Asset filter row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', marginRight: 2 }}>ASSET</span>
              {ASSET_FILTERS.map(a => {
                const color = ASSET_COLORS[a] ?? 'var(--accent)'
                return filterBtn(a, assetFilter === a, () => setAssetFilter(a), assetFilter === a ? color : undefined)
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {timelineItems.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: 40, fontSize: 12 }}>
                {assetFilter !== 'ALL' ? `No ${assetFilter} news in last 6h` : 'Loading live data…'}
              </div>
            ) : (
              timelineItems.map((item, idx) => {
                const age = Date.now() - new Date(item.pubDate).getTime()
                const stale = age > 4 * 3600 * 1000
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 8 }} className={newIds.has(item.id) ? 'item-new' : ''}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.categoryColor, boxShadow: `0 0 6px ${item.categoryColor}88`, flexShrink: 0 }} />
                      {idx < timelineItems.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--border)', marginTop: 3 }} />}
                    </div>
                    <div style={{ flex: 1, opacity: stale ? 0.38 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <CategoryBadge name={item.category} color={item.categoryColor} />
                        {item.asset && <AssetChip tag={item.asset} />}
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 10 }}>{timeAgo(item.pubDate)}</span>
                      </div>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>{item.title}</div>
                      </a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SourceBadge name={item.source} color={item.sourceColor} />
                        {age < 5 * 60 * 1000 && <span style={{ background: '#22c55e22', color: '#22c55e', borderRadius: 3, padding: '0 4px', fontSize: 9, fontWeight: 700 }}>NEW</span>}
                        {item.sentiment !== 'neutral' && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: item.sentiment === 'bullish' ? '#22c55e' : '#ef4444' }}>
                            {item.sentiment === 'bullish' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* CENTER — Main panel */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

            {/* ── PULSE TAB ── */}
            {tab === 'PULSE' && (
              <div>
                {breaking && (
                  <div style={{
                    background: 'linear-gradient(135deg, var(--surface-2), var(--surface))',
                    border: `1px solid ${breaking.categoryColor}55`, borderRadius: 10,
                    padding: '16px 18px', marginBottom: 16,
                    boxShadow: `0 0 30px ${breaking.categoryColor}18`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#ef4444' }}>⚡ BREAKING</span>
                      <SourceBadge name={breaking.source} color={breaking.sourceColor} />
                      <CategoryBadge name={breaking.category} color={breaking.categoryColor} />
                      {breaking.asset && <AssetChip tag={breaking.asset} size="md" />}
                      <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11 }}>{timeAgo(breaking.pubDate)}</span>
                    </div>
                    <a href={breaking.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', marginBottom: 8 }}>{breaking.title}</div>
                    </a>
                    {breaking.summary && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>{breaking.summary}</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex' }}>{impactDots(breaking.impactScore)}</div>
                      {breaking.sentiment !== 'neutral' && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: breaking.sentiment === 'bullish' ? '#22c55e' : '#ef4444' }}>
                          {breaking.sentiment === 'bullish' ? '▲ BULLISH SIGNAL' : '▼ BEARISH SIGNAL'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>TOP IMPACT — LAST 6H</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {topImpact.slice(1).map(item => <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} />)}
                <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>ACTIVE SOURCES</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Array.from(new Set(news.map(i => i.source))).map(src => {
                      const item = news.find(i => i.source === src)
                      if (!item) return null
                      const age = Date.now() - new Date(item.pubDate).getTime()
                      return (
                        <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: age < 300000 ? '#22c55e' : '#64748b', display: 'inline-block' }} />
                          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{src}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(item.pubDate)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── FLASH TAB — Trading Intelligence ── */}
            {tab === 'FLASH' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#f59e0b' }}>⚡ TRADING INTELLIGENCE</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{flashItems.length} asset-tagged items</span>
                </div>

                {/* Asset filter pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14, padding: '10px 12px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', marginRight: 4 }}>FILTER BY ASSET</span>
                  {ASSET_FILTERS.map(a => {
                    const color = ASSET_COLORS[a] ?? '#64748b'
                    const active = assetFilter === a
                    const count = a === 'ALL' ? news.filter(i => i.asset !== null).length : news.filter(i => i.asset === a).length
                    return (
                      <button key={a} onClick={() => setAssetFilter(a)} style={{
                        padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800,
                        letterSpacing: '0.05em', border: '1px solid', cursor: 'pointer',
                        background: active ? (a === 'ALL' ? 'var(--accent)' : color + '33') : 'transparent',
                        borderColor: active ? (a === 'ALL' ? 'var(--accent)' : color) : 'var(--border)',
                        color: active ? (a === 'ALL' ? '#fff' : color) : 'var(--text-dim)',
                        transition: 'all 0.12s',
                      }}>
                        {a} {count > 0 && <span style={{ opacity: 0.7, fontSize: 9 }}>({count})</span>}
                      </button>
                    )
                  })}
                </div>

                {/* Live price alerts — always first */}
                {(() => {
                  const visibleAlerts = assetFilter === 'ALL'
                    ? priceAlerts
                    : priceAlerts.filter(a => a.asset === assetFilter)
                  return visibleAlerts.length > 0 ? (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', letterSpacing: '0.1em' }}>⚡ LIVE PRICE MOVES</span>
                        <div style={{ flex: 1, height: 1, background: '#f59e0b33' }} />
                        <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>real-time · no news delay</span>
                      </div>
                      {visibleAlerts.map(a => <PriceAlertCard key={a.id} alert={a} />)}
                    </div>
                  ) : null
                })()}

                {/* Flash news feed */}
                {flashItems.length === 0 && priceAlerts.filter(a => assetFilter === 'ALL' || a.asset === assetFilter).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', marginTop: 60, fontSize: 13 }}>
                    No asset-tagged news in the last 6 hours
                    {assetFilter !== 'ALL' && <div style={{ marginTop: 8, fontSize: 11 }}>No {assetFilter} items yet — price alerts will appear above when a move is detected</div>}
                  </div>
                ) : (
                  flashItems.length > 0 && (
                    <div>
                      {flashItems.length > 0 && priceAlerts.filter(a => assetFilter === 'ALL' || a.asset === assetFilter).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>NEWS FEED</span>
                          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        </div>
                      )}
                      {flashItems.map(item => <FlashCard key={item.id} item={item} />)}
                    </div>
                  )
                )}
              </div>
            )}

            {/* ── WATCHLIST TAB ── */}
            {tab === 'WATCHLIST' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>WATCHLIST</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  {pricesAt && <span style={{ fontSize: 10, color: '#334155' }}>prices {timeAgo(pricesAt)}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 20 }}>
                  {watchlist.map(t => <PriceCard key={t.symbol} tick={t} prevPrice={prevWl[t.symbol]} />)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>RELATED NEWS</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {news.filter(i => i.category === 'AI/TECH' || i.category === 'EARNINGS' || i.category === 'CORPORATE').slice(0, 15).map(item => (
                  <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} compact />
                ))}
              </div>
            )}

            {/* ── CALENDAR TAB ── */}
            {tab === 'CALENDAR' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>ECONOMIC CALENDAR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{calEvents.length} events · times in UTC</span>
                </div>

                {nextEvent && (
                  <div style={{
                    background: `linear-gradient(135deg, ${nextEvent.color}18, var(--surface-2))`,
                    border: `1px solid ${nextEvent.color}44`, borderRadius: 10, padding: '16px 18px', marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: nextEvent.color, marginBottom: 6 }}>NEXT EVENT</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{nextEvent.event}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 26, fontWeight: 900, color: nextEvent.color }}>
                        {countdown(nextEvent.date, nextEvent.time)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {' · '}{nextEvent.time} UTC
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                      {nextEvent.previous && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Prev: <strong style={{ color: 'var(--text)' }}>{nextEvent.previous}</strong></span>}
                      {nextEvent.forecast && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Fcst: <strong style={{ color: nextEvent.color }}>{nextEvent.forecast}</strong></span>}
                    </div>
                    <div style={{ display: 'flex', marginTop: 8, alignItems: 'center', gap: 6 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} style={{ width: 20, height: 4, borderRadius: 2, background: i < nextEvent.impact ? nextEvent.color : 'var(--border)' }} />
                      ))}
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Impact</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {calEvents.map((ev, i) => {
                    const target = new Date(`${ev.date}T${ev.time}:00Z`).getTime()
                    const passed = target < Date.now()
                    const isToday = ev.date === new Date().toISOString().slice(0, 10)
                    return (
                      <div key={`${ev.date}-${ev.event}-${i}`} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--surface)', border: `1px solid ${passed ? 'var(--border)' : isToday ? ev.color + '55' : ev.color + '22'}`,
                        borderRadius: 8, padding: '9px 14px', opacity: passed ? 0.35 : 1,
                      }}>
                        <div style={{ width: 3, height: 32, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.event}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>
                            {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {ev.time !== '00:00' && ` · ${ev.time} UTC`}
                          </div>
                        </div>
                        {(ev.previous || ev.forecast) && (
                          <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', minWidth: 60 }}>
                            {ev.previous && <div>Prev: <span style={{ color: 'var(--text)' }}>{ev.previous}</span></div>}
                            {ev.forecast && <div>Fcst: <span style={{ color: ev.color, fontWeight: 700 }}>{ev.forecast}</span></div>}
                          </div>
                        )}
                        <div style={{ textAlign: 'right', minWidth: 58 }}>
                          {!passed && <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: ev.color }}>{countdown(ev.date, ev.time)}</div>}
                          {passed && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>PASSED</div>}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 3 }}>
                            {Array.from({ length: 5 }, (_, j) => (
                              <div key={j} style={{ width: 7, height: 3, borderRadius: 1, background: j < ev.impact ? ev.color : 'var(--border)' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* ── COMPLETED — PAST 15 DAYS ── */}
                {pastCalEvents.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>✓ COMPLETED — PAST 15 DAYS</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>BLS · Fed · TradingEconomics</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {pastCalEvents.map((ev, i) => {
                        const vibe = resultVibe(ev.event, ev.actual, ev.forecast)
                        const vibeColor = vibe === 'beat' ? '#22c55e' : vibe === 'miss' ? '#ef4444' : '#64748b'
                        return (
                          <div key={`past-${ev.date}-${ev.event}-${i}`} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: 'var(--surface)',
                            border: `1px solid ${vibe === 'beat' ? '#22c55e33' : vibe === 'miss' ? '#ef444433' : 'var(--border)'}`,
                            borderRadius: 8, padding: '9px 14px',
                          }}>
                            <div style={{ width: 3, height: 36, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.event}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                                {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                <span style={{ marginLeft: 6, color: ev.color, fontWeight: 700 }}>{ev.category}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'right', lineHeight: 1.7, minWidth: 72 }}>
                              {ev.previous && <div>Prev <span style={{ color: 'var(--text)' }}>{ev.previous}</span></div>}
                              {ev.forecast && <div>Fcst <span style={{ color: ev.color, fontWeight: 700 }}>{ev.forecast}</span></div>}
                              {ev.actual
                                ? <div>Act <span style={{ color: vibeColor, fontWeight: 800 }}>{ev.actual}</span></div>
                                : <div style={{ color: '#334155' }}>Act —</div>
                              }
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 48 }}>
                              {vibe ? (
                                <div style={{
                                  fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
                                  color: vibeColor,
                                  background: vibeColor + '1a',
                                  border: `1px solid ${vibeColor}44`,
                                  borderRadius: 4, padding: '2px 5px',
                                }}>
                                  {vibe === 'beat' ? '▲ BEAT' : vibe === 'miss' ? '▼ MISS' : '= IN LINE'}
                                </div>
                              ) : (
                                <div style={{ fontSize: 9, color: '#1e293b' }}>—</div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
                                {Array.from({ length: 5 }, (_, j) => (
                                  <div key={j} style={{ width: 6, height: 3, borderRadius: 1, background: j < ev.impact ? ev.color : 'var(--border)' }} />
                                ))}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ALL NEWS TAB ── */}
            {tab === 'ALL NEWS' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>ALL SOURCES — LAST 6H</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, color: '#334155' }}>{news.length} items</span>
                </div>
                {news.map(item => <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} compact />)}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — Signals */}
        <aside style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

            {/* Market indices */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>INDICES</div>
              {market.map(t => {
                const up = t.changePct > 0; const dn = t.changePct < 0
                return (
                  <div key={t.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)' }}>{t.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{fmt(t.price)}</div>
                      <div style={{ fontSize: 10, color: up ? '#22c55e' : dn ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                        {up ? '+' : ''}{fmt(t.changePct)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upcoming events */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>📅 UPCOMING</div>
              {upcoming.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Loading calendar…</div>}
              {upcoming.map((ev, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, lineHeight: 1.3 }}>{ev.event}</div>
                      <div style={{ fontSize: 10, color: ev.color, fontWeight: 600, marginTop: 1 }}>
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {ev.time !== '00:00' && ` ${ev.time}`}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 800, color: ev.color, marginLeft: 8, whiteSpace: 'nowrap' }}>
                      {countdown(ev.date, ev.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SEC 8-K filings */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>⚡ SEC 8-K FILINGS</div>
              {news.filter(i => i.source === 'SEC EDGAR').slice(0, 6).map(item => (
                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, lineHeight: 1.35, marginBottom: 2 }}>
                    {item.title.slice(0, 65)}{item.title.length > 65 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{timeAgo(item.pubDate)}</div>
                </a>
              ))}
            </div>

            {/* Bearish signals */}
            {news.filter(i => i.sentiment === 'bearish').length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#ef4444', marginBottom: 8 }}>▼ BEARISH SIGNALS</div>
                {news.filter(i => i.sentiment === 'bearish').slice(0, 4).map(item => (
                  <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 500, lineHeight: 1.35 }}>
                      {item.title.slice(0, 65)}{item.title.length > 65 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <SourceBadge name={item.source} color={item.sourceColor} />
                      {item.asset && <AssetChip tag={item.asset} />}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(item.pubDate)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Bullish signals */}
            {news.filter(i => i.sentiment === 'bullish').length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#22c55e', marginBottom: 8 }}>▲ BULLISH SIGNALS</div>
                {news.filter(i => i.sentiment === 'bullish').slice(0, 4).map(item => (
                  <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 500, lineHeight: 1.35 }}>
                      {item.title.slice(0, 65)}{item.title.length > 65 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <SourceBadge name={item.source} color={item.sourceColor} />
                      {item.asset && <AssetChip tag={item.asset} />}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(item.pubDate)}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
