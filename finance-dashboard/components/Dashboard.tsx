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
}

interface PriceTick {
  symbol: string
  name: string
  price: number
  change: number
  changePct: number
  marketState: string
}

// ── Constants ──────────────────────────────────────────────────────────────
const CALENDAR_EVENTS = [
  { date: '2026-06-17', event: 'FOMC Decision',       impact: 5, category: 'FED/RATES', color: '#3b82f6' },
  { date: '2026-06-25', event: 'CPI — May 2026',       impact: 4, category: 'MACRO',     color: '#ef4444' },
  { date: '2026-07-05', event: 'NFP Payrolls — June',  impact: 5, category: 'MACRO',     color: '#ef4444' },
  { date: '2026-07-28', event: 'FOMC Decision',        impact: 5, category: 'FED/RATES', color: '#3b82f6' },
  { date: '2026-08-14', event: 'CPI — July 2026',      impact: 4, category: 'MACRO',     color: '#ef4444' },
  { date: '2026-09-01', event: 'NFP Payrolls — Aug',   impact: 5, category: 'MACRO',     color: '#ef4444' },
  { date: '2026-09-16', event: 'FOMC Decision',        impact: 5, category: 'FED/RATES', color: '#3b82f6' },
  { date: '2026-10-29', event: 'FOMC Decision',        impact: 5, category: 'FED/RATES', color: '#3b82f6' },
  { date: '2026-12-10', event: 'FOMC Decision',        impact: 5, category: 'FED/RATES', color: '#3b82f6' },
]

const CATEGORY_FILTERS = ['ALL', 'FED/RATES', 'MACRO', 'EARNINGS', 'AI/TECH', 'COMMODITIES', 'GEOPOLITICAL', 'CORPORATE']
const TABS = ['PULSE', 'WATCHLIST', 'CALENDAR', 'ALL NEWS']

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

function countdown(dateStr: string): string {
  const target = new Date(dateStr + 'T14:00:00Z').getTime()
  const diff = target - Date.now()
  if (diff <= 0) return 'NOW'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function impactDots(score: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{
      display: 'inline-block', width: 5, height: 5, borderRadius: '50%', marginRight: 2,
      background: i < score ? '#f59e0b' : '#1e293b',
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
    }}>
      {name}
    </span>
  )
}

function CategoryBadge({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      background: 'transparent', color, borderLeft: `2px solid ${color}`,
      paddingLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    }}>
      {name}
    </span>
  )
}

function NewsCard({ item, isNew, compact = false }: { item: NewsItem; isNew?: boolean; compact?: boolean }) {
  const glowClass = item.sentiment === 'bullish' ? 'glow-green' : item.sentiment === 'bearish' ? 'glow-red' : ''
  const age = Date.now() - new Date(item.pubDate).getTime()
  const stale = age > 4 * 3600 * 1000

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`${isNew ? 'item-new' : ''} ${stale ? 'item-stale' : ''} ${glowClass}`}
      style={{
        display: 'block',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: compact ? '10px 12px' : '12px 14px',
        marginBottom: 6,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
        <SourceBadge name={item.source} color={item.sourceColor} />
        <CategoryBadge name={item.category} color={item.categoryColor} />
        {age < 5 * 60 * 1000 && (
          <span style={{ background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>
            NEW
          </span>
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
    <div className={flashClass} style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>{tick.symbol.replace('^', '').replace('=F', '')}</span>
        <span style={{ fontSize: 10, color: tick.marketState === 'REGULAR' ? '#22c55e' : '#64748b' }}>
          {tick.marketState === 'REGULAR' ? '● LIVE' : tick.marketState === 'PRE' ? '◐ PRE' : tick.marketState === 'POST' ? '◑ POST' : '○ CLOSED'}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--mono)', marginBottom: 2 }}>
        {fmt(tick.price)}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: up ? '#22c55e' : dn ? '#ef4444' : '#64748b' }}>
        {up ? '+' : ''}{fmt(tick.change)} ({up ? '+' : ''}{fmt(tick.changePct)}%)
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{tick.name}</div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [news, setNews]           = useState<NewsItem[]>([])
  const [newIds, setNewIds]       = useState<Set<string>>(new Set())
  const [market, setMarket]       = useState<PriceTick[]>([])
  const [watchlist, setWatchlist] = useState<PriceTick[]>([])
  const [prevWl, setPrevWl]       = useState<Record<string, number>>({})
  const [tab, setTab]             = useState('PULSE')
  const [catFilter, setCatFilter] = useState('ALL')
  const [now, setNow]             = useState(new Date())
  const [newsAt, setNewsAt]       = useState<string | null>(null)
  const [pricesAt, setPricesAt]   = useState<string | null>(null)
  const knownIds = useRef(new Set<string>())

  // Clock tick every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Fetch news
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

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
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

  useEffect(() => {
    fetchNews()
    fetchPrices()
    const ni = setInterval(fetchNews, 90_000)
    const pi = setInterval(fetchPrices, 20_000)
    return () => { clearInterval(ni); clearInterval(pi) }
  }, [fetchNews, fetchPrices])

  const filtered = catFilter === 'ALL' ? news : news.filter(i => i.category === catFilter)
  const topImpact = [...news].sort((a, b) => b.impactScore - a.impactScore).slice(0, 10)
  const breaking = topImpact[0]
  const nextEvent = CALENDAR_EVENTS.find(e => new Date(e.date + 'T14:00:00Z').getTime() > Date.now())
  const upcomingEvents = CALENDAR_EVENTS.filter(e => new Date(e.date + 'T14:00:00Z').getTime() > Date.now()).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(to bottom, #0a0f1e, var(--surface))',
        flexShrink: 0,
      }}>
        {/* Top bar */}
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
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-dim)',
                transition: 'all 0.15s',
              }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'right' }}>
            <span className="mono">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'America/New_York' })} ET</span>
            {newsAt && <span style={{ marginLeft: 8, color: '#334155' }}>· {news.length} items</span>}
          </div>
        </div>

        {/* Ticker strip */}
        <div style={{ overflow: 'hidden', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="ticker-track" style={{ display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' }}>
            {[...market, ...market].map((t, i) => {
              const up = t.changePct > 0; const dn = t.changePct < 0
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', borderRight: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                    {t.name}
                  </span>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>
                    {fmt(t.price)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: up ? '#22c55e' : dn ? '#ef4444' : '#64748b' }}>
                    {up ? '▲' : dn ? '▼' : '▬'} {Math.abs(t.changePct).toFixed(2)}%
                  </span>
                </span>
              )
            })}
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Timeline */}
        <aside style={{
          width: 300, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Timeline header */}
          <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 8 }}>
              LIVE TIMELINE
              {newsAt && (
                <span style={{ float: 'right', fontWeight: 400, color: '#334155' }}>
                  updated {timeAgo(newsAt)}
                </span>
              )}
            </div>
            {/* Category filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {CATEGORY_FILTERS.map(c => (
                <button key={c} onClick={() => setCatFilter(c)} style={{
                  padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.05em', border: '1px solid', cursor: 'pointer',
                  background: catFilter === c ? 'var(--accent)' : 'transparent',
                  borderColor: catFilter === c ? 'var(--accent)' : 'var(--border)',
                  color: catFilter === c ? '#fff' : 'var(--text-dim)',
                  transition: 'all 0.12s',
                }}>
                  {c === 'ALL' ? 'ALL' : c.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {filtered.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: 40, fontSize: 12 }}>
                Loading live data…
              </div>
            ) : (
              filtered.map((item, idx) => {
                const age = Date.now() - new Date(item.pubDate).getTime()
                const stale = age > 4 * 3600 * 1000
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 8, position: 'relative' }} className={newIds.has(item.id) ? 'item-new' : ''}>
                    {/* Timeline dot + line */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 3 }}>
                      <div style={{
                        width: 9, height: 9, borderRadius: '50%',
                        background: item.categoryColor,
                        boxShadow: `0 0 6px ${item.categoryColor}88`,
                        flexShrink: 0,
                      }} />
                      {idx < filtered.length - 1 && (
                        <div style={{ width: 1, flex: 1, minHeight: 20, background: 'var(--border)', marginTop: 3 }} />
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, opacity: stale ? 0.38 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <CategoryBadge name={item.category} color={item.categoryColor} />
                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 10 }}>{timeAgo(item.pubDate)}</span>
                      </div>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: 12, lineHeight: 1.4, color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>
                          {item.title}
                        </div>
                      </a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <SourceBadge name={item.source} color={item.sourceColor} />
                        {age < 5 * 60 * 1000 && (
                          <span style={{ background: '#22c55e22', color: '#22c55e', borderRadius: 3, padding: '0 4px', fontSize: 9, fontWeight: 700 }}>NEW</span>
                        )}
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

            {/* PULSE TAB */}
            {tab === 'PULSE' && (
              <div>
                {/* Breaking — top item */}
                {breaking && (
                  <div style={{
                    background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))',
                    border: `1px solid ${breaking.categoryColor}55`,
                    borderRadius: 10,
                    padding: '16px 18px',
                    marginBottom: 16,
                    boxShadow: `0 0 30px ${breaking.categoryColor}18`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#ef4444' }}>⚡ BREAKING</span>
                      <SourceBadge name={breaking.source} color={breaking.sourceColor} />
                      <CategoryBadge name={breaking.category} color={breaking.categoryColor} />
                      <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11 }}>{timeAgo(breaking.pubDate)}</span>
                    </div>
                    <a href={breaking.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, color: 'var(--text)', marginBottom: 8 }}>
                        {breaking.title}
                      </div>
                    </a>
                    {breaking.summary && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                        {breaking.summary}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex' }}>{impactDots(breaking.impactScore)}</div>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>Impact</span>
                      {breaking.sentiment !== 'neutral' && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: breaking.sentiment === 'bullish' ? '#22c55e' : '#ef4444' }}>
                          {breaking.sentiment === 'bullish' ? '▲ BULLISH SIGNAL' : '▼ BEARISH SIGNAL'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>TOP IMPACT — LAST 3H</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Top impact items */}
                <div>
                  {topImpact.slice(1).map((item) => (
                    <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} />
                  ))}
                </div>

                {/* Active sources */}
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

            {/* WATCHLIST TAB */}
            {tab === 'WATCHLIST' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>WATCHLIST</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  {pricesAt && <span style={{ fontSize: 10, color: '#334155' }}>prices {timeAgo(pricesAt)}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 20 }}>
                  {watchlist.map(t => (
                    <PriceCard key={t.symbol} tick={t} prevPrice={prevWl[t.symbol]} />
                  ))}
                </div>

                {/* Related news for watchlist */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>RELATED NEWS</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {news
                  .filter(i => i.category === 'AI/TECH' || i.category === 'EARNINGS' || i.category === 'CORPORATE')
                  .slice(0, 15)
                  .map(item => <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} compact />)
                }
              </div>
            )}

            {/* CALENDAR TAB */}
            {tab === 'CALENDAR' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>ECONOMIC CALENDAR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {nextEvent && (
                  <div style={{
                    background: `linear-gradient(135deg, ${nextEvent.color}18, var(--surface-2))`,
                    border: `1px solid ${nextEvent.color}44`,
                    borderRadius: 10, padding: '16px 18px', marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: nextEvent.color, marginBottom: 6 }}>NEXT EVENT</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{nextEvent.event}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="mono" style={{ fontSize: 28, fontWeight: 900, color: nextEvent.color }}>
                        {countdown(nextEvent.date)}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{new Date(nextEvent.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div style={{ display: 'flex', marginTop: 8 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} style={{ width: 20, height: 4, borderRadius: 2, marginRight: 3, background: i < nextEvent.impact ? nextEvent.color : 'var(--border)' }} />
                      ))}
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 6 }}>Impact level</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CALENDAR_EVENTS.map(ev => {
                    const target = new Date(ev.date + 'T14:00:00Z').getTime()
                    const passed = target < Date.now()
                    return (
                      <div key={ev.date} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: 'var(--surface)', border: `1px solid ${passed ? 'var(--border)' : ev.color + '33'}`,
                        borderRadius: 8, padding: '10px 14px', opacity: passed ? 0.4 : 1,
                      }}>
                        <div style={{ width: 3, height: 36, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ev.event}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                            {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {!passed && (
                            <div className="mono" style={{ fontSize: 14, fontWeight: 800, color: ev.color }}>{countdown(ev.date)}</div>
                          )}
                          {passed && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PASSED</div>}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <div key={i} style={{ width: 8, height: 3, borderRadius: 1, marginLeft: 2, background: i < ev.impact ? ev.color : 'var(--border)' }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ALL NEWS TAB */}
            {tab === 'ALL NEWS' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--text-dim)' }}>ALL SOURCES — LAST 6H</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, color: '#334155' }}>{news.length} items</span>
                </div>
                {news.map(item => (
                  <NewsCard key={item.id} item={item} isNew={newIds.has(item.id)} compact />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* RIGHT — Signals */}
        <aside style={{
          width: 260, flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

            {/* Market indices compact */}
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

            {/* Calendar countdown */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>UPCOMING EVENTS</div>
              {upcomingEvents.map(ev => (
                <div key={ev.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500 }}>{ev.event}</div>
                    <div style={{ fontSize: 10, color: ev.color, fontWeight: 600, marginTop: 1 }}>{ev.category}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, fontWeight: 800, color: ev.color }}>{countdown(ev.date)}</div>
                </div>
              ))}
            </div>

            {/* SEC EDGAR 8-K live feed */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 8 }}>
                ⚡ SEC 8-K FILINGS
              </div>
              {news.filter(i => i.source === 'SEC EDGAR').slice(0, 8).map(item => (
                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text)', fontWeight: 500, lineHeight: 1.35, marginBottom: 2 }}>
                    {item.title.slice(0, 70)}{item.title.length > 70 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{timeAgo(item.pubDate)}</div>
                </a>
              ))}
              {news.filter(i => i.source === 'SEC EDGAR').length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Loading filings…</div>
              )}
            </div>

            {/* Bearish signals */}
            {news.filter(i => i.sentiment === 'bearish').length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#ef4444', marginBottom: 8 }}>▼ BEARISH SIGNALS</div>
                {news.filter(i => i.sentiment === 'bearish').slice(0, 4).map(item => (
                  <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 500, lineHeight: 1.35 }}>
                      {item.title.slice(0, 70)}{item.title.length > 70 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <SourceBadge name={item.source} color={item.sourceColor} />
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
                      {item.title.slice(0, 70)}{item.title.length > 70 ? '…' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <SourceBadge name={item.source} color={item.sourceColor} />
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
