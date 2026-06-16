export const revalidate = 20

const MARKET_TICKERS = [
  { symbol: '^GSPC',    name: 'S&P 500'  },
  { symbol: '^IXIC',    name: 'NASDAQ'   },
  { symbol: '^DJI',     name: 'DOW'      },
  { symbol: '^VIX',     name: 'VIX'      },
  { symbol: 'GC=F',     name: 'Gold'     },
  { symbol: 'CL=F',     name: 'Oil'      },
  { symbol: 'SI=F',     name: 'Silver'   },
  { symbol: '^TNX',     name: '10Y'      },
  { symbol: 'DX-Y.NYB', name: 'DXY'     },
]

const WATCHLIST = [
  { symbol: 'NVDA',  name: 'NVIDIA'         },
  { symbol: 'MU',    name: 'Micron'         },
  { symbol: 'PLTR',  name: 'Palantir'       },
  { symbol: 'CEG',   name: 'Constellation'  },
  { symbol: 'AMD',   name: 'AMD'            },
  { symbol: 'AVGO',  name: 'Broadcom'       },
  { symbol: 'APP',   name: 'AppLovin'       },
  { symbol: 'ARM',   name: 'ARM Holdings'   },
  { symbol: 'VRT',   name: 'Vertiv'         },
  { symbol: 'ALAB',  name: 'Astera Labs'    },
]

async function fetchTicker(symbol: string, name: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice ?? meta.previousClose
    const prev  = meta.chartPreviousClose ?? meta.previousClose
    const change = price - prev
    const changePct = prev ? (change / prev) * 100 : 0

    return {
      symbol,
      name,
      price: +price.toFixed(symbol.startsWith('^') ? 2 : 2),
      change: +change.toFixed(2),
      changePct: +changePct.toFixed(2),
      marketState: meta.marketState ?? 'CLOSED',
    }
  } catch {
    return null
  }
}

export async function GET() {
  const all = [...MARKET_TICKERS, ...WATCHLIST]
  const results = await Promise.allSettled(all.map(t => fetchTicker(t.symbol, t.name)))

  const market: Record<string, unknown>[] = []
  const watchlist: Record<string, unknown>[] = []

  results.forEach((r, i) => {
    const tick = r.status === 'fulfilled' ? r.value : null
    if (!tick) return
    if (i < MARKET_TICKERS.length) market.push(tick)
    else watchlist.push(tick)
  })

  return Response.json({ market, watchlist, fetchedAt: new Date().toISOString() })
}
