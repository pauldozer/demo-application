export const revalidate = 3600

interface TEEvent {
  Date: string
  Event: string
  Country: string
  Category: string
  Importance: number
  Previous: string
  Forecast: string
  TEForecast: string
  Actual?: string
}

type CalEvent = {
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

function mapCat(cat: string): { name: string; color: string } {
  if (/interest rate|fed |fomc|monetary/i.test(cat)) return { name: 'FED/RATES', color: '#3b82f6' }
  if (/crude oil|gasoline|distillate|petroleum|natural gas storage/i.test(cat)) return { name: 'COMMODITIES', color: '#f97316' }
  if (/inflation|cpi|pce|ppi|price index/i.test(cat)) return { name: 'MACRO', color: '#ef4444' }
  if (/payroll|nonfarm|employment|jobless|unemployment|job/i.test(cat)) return { name: 'MACRO', color: '#ef4444' }
  if (/gdp|gross domestic/i.test(cat)) return { name: 'MACRO', color: '#ef4444' }
  if (/earnings|eps|quarterly/i.test(cat)) return { name: 'EARNINGS', color: '#f59e0b' }
  return { name: 'MACRO', color: '#ef4444' }
}

// Comprehensive hardcoded fallback — FOMC, CPI, NFP, PCE, PPI, EIA, ISM, GDP
const FALLBACK: CalEvent[] = [
  // ── June 2026 ──
  { date: '2026-06-17', time: '18:00', event: 'FOMC Rate Decision', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '4.50%', forecast: '4.50%' },
  { date: '2026-06-17', time: '18:30', event: 'Fed Press Conference', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-06-18', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '221K', forecast: '220K' },
  { date: '2026-06-18', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.8M', forecast: '-1.2M' },
  { date: '2026-06-18', time: '14:30', event: 'EIA Natural Gas Storage', impact: 2, category: 'COMMODITIES', color: '#06b6d4', previous: '+98B', forecast: '+95B' },
  { date: '2026-06-19', time: '14:30', event: 'EIA Natural Gas Storage', impact: 2, category: 'COMMODITIES', color: '#06b6d4', previous: '+98B', forecast: '+92B' },
  { date: '2026-06-25', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '221K', forecast: '220K' },
  { date: '2026-06-25', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.8M', forecast: '-1.5M' },
  { date: '2026-06-25', time: '12:30', event: 'CPI — May 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.3%', forecast: '2.4%' },
  { date: '2026-06-25', time: '12:30', event: 'Core CPI — May 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.8%', forecast: '2.8%' },
  { date: '2026-06-27', time: '12:30', event: 'PCE Price Index — May', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.2%', forecast: '2.3%' },
  { date: '2026-06-27', time: '12:30', event: 'Core PCE — May 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.6%', forecast: '2.6%' },
  { date: '2026-06-30', time: '14:00', event: 'Chicago PMI', impact: 2, category: 'MACRO', color: '#ef4444', previous: '45.2', forecast: '46.0' },
  // ── July 2026 ──
  { date: '2026-07-01', time: '14:00', event: 'ISM Manufacturing PMI', impact: 3, category: 'MACRO', color: '#ef4444', previous: '48.5', forecast: '49.0' },
  { date: '2026-07-02', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '220K', forecast: '219K' },
  { date: '2026-07-02', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.5M', forecast: '-1.0M' },
  { date: '2026-07-03', time: '12:30', event: 'NFP Payrolls — June', impact: 5, category: 'MACRO', color: '#ef4444', previous: '177K', forecast: '180K' },
  { date: '2026-07-03', time: '12:30', event: 'Unemployment Rate — June', impact: 4, category: 'MACRO', color: '#ef4444', previous: '4.1%', forecast: '4.1%' },
  { date: '2026-07-03', time: '12:30', event: 'Average Hourly Earnings', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+0.3%', forecast: '+0.3%' },
  { date: '2026-07-07', time: '14:00', event: 'ISM Services PMI', impact: 3, category: 'MACRO', color: '#ef4444', previous: '52.1', forecast: '52.5' },
  { date: '2026-07-09', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '219K', forecast: '220K' },
  { date: '2026-07-09', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.0M', forecast: '-1.2M' },
  { date: '2026-07-10', time: '12:30', event: 'CPI — June 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.4%', forecast: '2.4%' },
  { date: '2026-07-10', time: '12:30', event: 'Core CPI — June 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.8%', forecast: '2.7%' },
  { date: '2026-07-11', time: '12:30', event: 'PPI — June 2026', impact: 3, category: 'MACRO', color: '#ef4444', previous: '2.1%', forecast: '2.1%' },
  { date: '2026-07-15', time: '12:30', event: 'Retail Sales — June', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+0.1%', forecast: '+0.3%' },
  { date: '2026-07-15', time: '12:30', event: 'Empire State Mfg Index', impact: 2, category: 'MACRO', color: '#ef4444', previous: '-11.9', forecast: '-9.0' },
  { date: '2026-07-16', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '220K', forecast: '219K' },
  { date: '2026-07-16', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.2M', forecast: '-1.0M' },
  { date: '2026-07-17', time: '12:30', event: 'Housing Starts — June', impact: 2, category: 'MACRO', color: '#ef4444', previous: '1.36M', forecast: '1.38M' },
  { date: '2026-07-17', time: '12:30', event: 'Building Permits — June', impact: 2, category: 'MACRO', color: '#ef4444', previous: '1.42M', forecast: '1.43M' },
  { date: '2026-07-23', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '219K', forecast: '220K' },
  { date: '2026-07-23', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.0M', forecast: '-0.8M' },
  { date: '2026-07-24', time: '12:30', event: 'GDP Q2 2026 (Advance)', impact: 5, category: 'MACRO', color: '#ef4444', previous: '+1.2%', forecast: '+1.5%' },
  { date: '2026-07-25', time: '12:30', event: 'PCE Price Index — June', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.3%', forecast: '2.3%' },
  { date: '2026-07-29', time: '18:00', event: 'FOMC Rate Decision', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '4.50%', forecast: '4.25%' },
  { date: '2026-07-29', time: '18:30', event: 'Fed Press Conference', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-07-30', time: '12:30', event: 'Initial Jobless Claims', impact: 3, category: 'MACRO', color: '#ef4444', previous: '220K', forecast: '220K' },
  { date: '2026-07-30', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-0.8M', forecast: '-1.0M' },
  { date: '2026-07-31', time: '14:00', event: 'Chicago PMI', impact: 2, category: 'MACRO', color: '#ef4444', previous: '46.0', forecast: '46.5' },
  // ── August 2026 ──
  { date: '2026-08-03', time: '14:00', event: 'ISM Manufacturing PMI', impact: 3, category: 'MACRO', color: '#ef4444', previous: '49.0', forecast: '49.5' },
  { date: '2026-08-06', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.0M', forecast: '-0.9M' },
  { date: '2026-08-07', time: '12:30', event: 'NFP Payrolls — July', impact: 5, category: 'MACRO', color: '#ef4444', previous: '180K', forecast: '175K' },
  { date: '2026-08-07', time: '12:30', event: 'Unemployment Rate — July', impact: 4, category: 'MACRO', color: '#ef4444', previous: '4.1%', forecast: '4.1%' },
  { date: '2026-08-12', time: '12:30', event: 'CPI — July 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.4%', forecast: '2.3%' },
  { date: '2026-08-12', time: '12:30', event: 'Core CPI — July 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.7%', forecast: '2.7%' },
  { date: '2026-08-13', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-0.9M', forecast: '-1.0M' },
  { date: '2026-08-14', time: '12:30', event: 'PPI — July 2026', impact: 3, category: 'MACRO', color: '#ef4444', previous: '2.1%', forecast: '2.0%' },
  { date: '2026-08-14', time: '12:30', event: 'Retail Sales — July', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+0.3%', forecast: '+0.2%' },
  { date: '2026-08-20', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-1.0M', forecast: '-0.8M' },
  { date: '2026-08-25', time: '00:00', event: 'Jackson Hole Symposium', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-08-26', time: '00:00', event: 'Jackson Hole — Powell Speech', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-08-27', time: '14:30', event: 'EIA Crude Oil Inventories', impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-0.8M', forecast: '-1.0M' },
  { date: '2026-08-28', time: '12:30', event: 'PCE Price Index — July', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.3%', forecast: '2.2%' },
  { date: '2026-08-28', time: '12:30', event: 'Core PCE — July 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.6%', forecast: '2.5%' },
  // ── September 2026 ──
  { date: '2026-09-01', time: '14:00', event: 'ISM Manufacturing PMI', impact: 3, category: 'MACRO', color: '#ef4444', previous: '49.5', forecast: '50.0' },
  { date: '2026-09-04', time: '12:30', event: 'NFP Payrolls — Aug', impact: 5, category: 'MACRO', color: '#ef4444', previous: '175K', forecast: '172K' },
  { date: '2026-09-04', time: '12:30', event: 'Unemployment Rate — Aug', impact: 4, category: 'MACRO', color: '#ef4444', previous: '4.1%', forecast: '4.1%' },
  { date: '2026-09-10', time: '12:30', event: 'CPI — Aug 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.3%', forecast: '2.3%' },
  { date: '2026-09-11', time: '12:30', event: 'PPI — Aug 2026', impact: 3, category: 'MACRO', color: '#ef4444', previous: '2.0%', forecast: '2.0%' },
  { date: '2026-09-16', time: '18:00', event: 'FOMC Rate Decision', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '4.25%', forecast: '4.00%' },
  { date: '2026-09-16', time: '18:30', event: 'Fed Press Conference', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-09-17', time: '12:30', event: 'Retail Sales — Aug', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+0.2%', forecast: '+0.3%' },
  { date: '2026-09-25', time: '12:30', event: 'GDP Q2 2026 (Final)', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+1.5%', forecast: '+1.5%' },
  { date: '2026-09-26', time: '12:30', event: 'PCE Price Index — Aug', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.2%', forecast: '2.2%' },
  // ── October 2026 ──
  { date: '2026-10-02', time: '12:30', event: 'NFP Payrolls — Sep', impact: 5, category: 'MACRO', color: '#ef4444', previous: '172K', forecast: '170K' },
  { date: '2026-10-09', time: '12:30', event: 'CPI — Sep 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.3%', forecast: '2.2%' },
  { date: '2026-10-15', time: '12:30', event: 'Retail Sales — Sep', impact: 3, category: 'MACRO', color: '#ef4444', previous: '+0.3%', forecast: '+0.2%' },
  { date: '2026-10-28', time: '18:00', event: 'FOMC Rate Decision', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '4.00%', forecast: '3.75%' },
  { date: '2026-10-28', time: '18:30', event: 'Fed Press Conference', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-10-30', time: '12:30', event: 'PCE Price Index — Sep', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.2%', forecast: '2.1%' },
  { date: '2026-10-30', time: '12:30', event: 'GDP Q3 2026 (Advance)', impact: 4, category: 'MACRO', color: '#ef4444', previous: '+1.5%', forecast: '+1.8%' },
  // ── November 2026 ──
  { date: '2026-11-06', time: '12:30', event: 'NFP Payrolls — Oct', impact: 5, category: 'MACRO', color: '#ef4444', previous: '170K', forecast: '172K' },
  { date: '2026-11-12', time: '12:30', event: 'CPI — Oct 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.2%', forecast: '2.1%' },
  { date: '2026-11-13', time: '12:30', event: 'PPI — Oct 2026', impact: 3, category: 'MACRO', color: '#ef4444', previous: '2.0%', forecast: '1.9%' },
  { date: '2026-11-25', time: '12:30', event: 'PCE Price Index — Oct', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.1%', forecast: '2.0%' },
  // ── December 2026 ──
  { date: '2026-12-04', time: '12:30', event: 'NFP Payrolls — Nov', impact: 5, category: 'MACRO', color: '#ef4444', previous: '172K', forecast: '170K' },
  { date: '2026-12-10', time: '12:30', event: 'CPI — Nov 2026', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.1%', forecast: '2.0%' },
  { date: '2026-12-11', time: '12:30', event: 'PPI — Nov 2026', impact: 3, category: 'MACRO', color: '#ef4444', previous: '1.9%', forecast: '1.8%' },
  { date: '2026-12-16', time: '18:00', event: 'FOMC Rate Decision', impact: 5, category: 'FED/RATES', color: '#3b82f6', previous: '3.75%', forecast: '3.50%' },
  { date: '2026-12-16', time: '18:30', event: 'Fed Press Conference', impact: 4, category: 'FED/RATES', color: '#3b82f6', previous: '', forecast: '' },
  { date: '2026-12-19', time: '12:30', event: 'PCE Price Index — Nov', impact: 4, category: 'MACRO', color: '#ef4444', previous: '2.0%', forecast: '2.0%' },
]

// Past 15 days — key US economic events (actuals populated by live API; fallback shows schedule only)
const FALLBACK_PAST: CalEvent[] = [
  { date: '2026-06-17', time: '18:00', event: 'FOMC Rate Decision',         impact: 5, category: 'FED/RATES',   color: '#3b82f6', previous: '4.50%',  forecast: '4.50%',  actual: '' },
  { date: '2026-06-17', time: '18:30', event: 'Fed Press Conference',        impact: 4, category: 'FED/RATES',   color: '#3b82f6', previous: '',        forecast: '',       actual: '' },
  { date: '2026-06-12', time: '12:30', event: 'PPI — May 2026',              impact: 3, category: 'MACRO',       color: '#ef4444', previous: '2.4%',   forecast: '2.5%',   actual: '' },
  { date: '2026-06-11', time: '12:30', event: 'CPI — May 2026',              impact: 4, category: 'MACRO',       color: '#ef4444', previous: '2.3%',   forecast: '2.4%',   actual: '' },
  { date: '2026-06-11', time: '12:30', event: 'Core CPI — May 2026',         impact: 4, category: 'MACRO',       color: '#ef4444', previous: '2.8%',   forecast: '2.8%',   actual: '' },
  { date: '2026-06-11', time: '12:30', event: 'Initial Jobless Claims',      impact: 3, category: 'MACRO',       color: '#ef4444', previous: '229K',   forecast: '224K',   actual: '' },
  { date: '2026-06-10', time: '14:30', event: 'EIA Crude Oil Inventories',   impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '-4.3M',  forecast: '-1.5M',  actual: '' },
  { date: '2026-06-06', time: '12:30', event: 'NFP Payrolls — May',          impact: 5, category: 'MACRO',       color: '#ef4444', previous: '177K',   forecast: '180K',   actual: '' },
  { date: '2026-06-06', time: '12:30', event: 'Unemployment Rate — May',     impact: 4, category: 'MACRO',       color: '#ef4444', previous: '4.2%',   forecast: '4.2%',   actual: '' },
  { date: '2026-06-06', time: '12:30', event: 'Average Hourly Earnings',     impact: 3, category: 'MACRO',       color: '#ef4444', previous: '+0.2%',  forecast: '+0.3%',  actual: '' },
  { date: '2026-06-04', time: '12:30', event: 'Initial Jobless Claims',      impact: 3, category: 'MACRO',       color: '#ef4444', previous: '242K',   forecast: '230K',   actual: '' },
  { date: '2026-06-04', time: '14:00', event: 'ISM Services PMI — May',      impact: 3, category: 'MACRO',       color: '#ef4444', previous: '51.6',   forecast: '51.5',   actual: '' },
  { date: '2026-06-03', time: '14:30', event: 'EIA Crude Oil Inventories',   impact: 3, category: 'COMMODITIES', color: '#f97316', previous: '+1.3M',  forecast: '-0.8M',  actual: '' },
  { date: '2026-06-03', time: '14:00', event: 'ISM Manufacturing PMI — May', impact: 3, category: 'MACRO',       color: '#ef4444', previous: '48.7',   forecast: '48.8',   actual: '' },
]

export async function GET() {
  try {
    const past  = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    const end   = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
    const url   = `https://api.tradingeconomics.com/calendar/country/united+states/${past}/${end}?c=guest:guest`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketPulse/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) throw new Error(`status ${res.status}`)

    const raw: TEEvent[] = await res.json()
    if (!Array.isArray(raw) || raw.length < 5) throw new Error('insufficient data')

    const allEvents: CalEvent[] = raw
      .filter(e => e.Importance >= 2)
      .map(e => {
        const { name, color } = mapCat(e.Category)
        const imp = e.Importance === 3 ? 5 : e.Importance === 2 ? 3 : 2
        return {
          date: e.Date.slice(0, 10),
          time: e.Date.length >= 16 ? e.Date.slice(11, 16) : '14:00',
          event: e.Event,
          impact: /interest rate|fomc|payroll|nonfarm|gdp.*advance/i.test(e.Event) ? 5 : imp,
          category: name,
          color,
          previous: e.Previous ?? '',
          forecast: e.Forecast || e.TEForecast || '',
          actual: e.Actual ?? '',
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

    const nowMs = Date.now()
    const events     = allEvents.filter(e => new Date(`${e.date}T${e.time}:00Z`).getTime() > nowMs)
    const pastEvents = allEvents
      .filter(e => new Date(`${e.date}T${e.time}:00Z`).getTime() <= nowMs && e.impact >= 3)
      .reverse()
      .slice(0, 25)

    return Response.json({ events, pastEvents, source: 'live', fetchedAt: new Date().toISOString() })
  } catch {
    const today = new Date().toISOString().slice(0, 10)
    const past  = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10)
    const events = FALLBACK.filter(e => e.date >= today)
    const pastEvents = [...FALLBACK_PAST, ...FALLBACK.filter(e => e.date < today && e.date >= past)]
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      .slice(0, 20)
    return Response.json({ events, pastEvents, source: 'fallback', fetchedAt: new Date().toISOString() })
  }
}
