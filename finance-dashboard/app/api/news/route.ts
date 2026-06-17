import Parser from 'rss-parser'

export const revalidate = 90

const parser = new Parser({ timeout: 8000 })

const SOURCES = [
  // Tier 1 — Fastest breaking news
  { name: 'Reuters',          url: 'https://feeds.reuters.com/reuters/businessNews',                                                                    color: '#f97316', tier: 1 },
  { name: 'Reuters World',    url: 'https://feeds.reuters.com/reuters/worldNews',                                                                       color: '#ea580c', tier: 1 },
  { name: 'Benzinga',         url: 'https://www.benzinga.com/news/feed',                                                                               color: '#8b5cf6', tier: 1 },
  { name: 'CNBC',             url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',                                                            color: '#3b82f6', tier: 1 },
  { name: 'CNBC Markets',     url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',                                                             color: '#2563eb', tier: 1 },
  { name: 'WSJ Markets',      url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',                                                                    color: '#d97706', tier: 1 },
  { name: 'Bloomberg',        url: 'https://feeds.bloomberg.com/markets/news.rss',                                                                     color: '#1d4ed8', tier: 1 },
  { name: 'AP Business',      url: 'https://feeds.apnews.com/rss/APBusiness',                                                                          color: '#b91c1c', tier: 1 },

  // Tier 2 — High-quality, frequent updates
  { name: 'Financial Times',  url: 'https://www.ft.com/rss/home',                                                                                      color: '#f59e0b', tier: 2 },
  { name: 'MarketWatch',      url: 'https://feeds.marketwatch.com/marketwatch/topstories/',                                                            color: '#10b981', tier: 2 },
  { name: 'Yahoo Finance',    url: 'https://finance.yahoo.com/rss/topfinstories',                                                                      color: '#6366f1', tier: 2 },
  { name: 'Zero Hedge',       url: 'https://feeds.feedburner.com/zerohedge/feed',                                                                      color: '#ef4444', tier: 2 },
  { name: 'Seeking Alpha',    url: 'https://seekingalpha.com/feed.xml',                                                                                color: '#0ea5e9', tier: 2 },
  { name: 'TechCrunch',       url: 'https://techcrunch.com/feed/',                                                                                     color: '#16a34a', tier: 2 },
  { name: 'Business Insider', url: 'https://feeds.businessinsider.com/custom/all',                                                                     color: '#0284c7', tier: 2 },
  { name: 'Semafor',          url: 'https://www.semafor.com/feed',                                                                                     color: '#7c3aed', tier: 2 },

  // Tier 3 — Specialist / commodity / institutional
  { name: 'Kitco',            url: 'https://www.kitco.com/rss/kitco-news-full.rss',                                                                    color: '#fbbf24', tier: 3 },
  { name: 'OilPrice',         url: 'https://oilprice.com/rss/main',                                                                                    color: '#f59e0b', tier: 3 },
  { name: 'Globe Newswire',   url: 'https://www.globenewswire.com/RssFeed/subjectcode/17-Merger+%26+Acquisition',                                      color: '#64748b', tier: 3 },
  { name: 'Globe Newswire ER',url: 'https://www.globenewswire.com/RssFeed/subjectcode/21-Earnings',                                                    color: '#475569', tier: 3 },
  { name: 'Investing.com',    url: 'https://www.investing.com/rss/news_25.rss',                                                                        color: '#16a34a', tier: 3 },
  { name: 'TheStreet',        url: 'https://www.thestreet.com/rss/combined-rss-feed.xml',                                                              color: '#059669', tier: 3 },
  { name: 'Barrons',          url: 'https://feeds.a.dj.com/rss/RSSBarronsBestMindsBlog.xml',                                                           color: '#78716c', tier: 3 },
  { name: 'Nasdaq News',      url: 'https://www.nasdaq.com/feed/rssoutbound?category=Markets',                                                         color: '#3b82f6', tier: 3 },

  // Tier 4 — Regulatory / official
  { name: 'SEC EDGAR',        url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=40&output=atom',    color: '#dc2626', tier: 4 },
]

const CATEGORIES = [
  { name: 'FED/RATES',    color: '#3b82f6', weight: 2, kw: ['federal reserve', 'fomc', 'powell', 'rate cut', 'rate hike', 'interest rate', 'treasury yield', 'basis points', 'hawkish', 'dovish', 'monetary policy', 'fed chair', 'central bank', 'inflation target', 'rate decision', 'fed minutes', 'fed funds', 'rate pause', 'bps', 'ecb', 'bank of england', 'bank of japan', 'quantitative easing', 'quantitative tightening', 'balance sheet', 'repo rate', 'fed speak', 'yield curve', 'bond yield', 'treasury', 'treasury auction', 'bond auction', '10-year auction', '20-year auction', '30-year auction', '10y auction', '20y auction', '30y auction', 'note auction', 'bill auction', 'debt auction', 'auction stops', 'bid-to-cover', 'foreign demand', 'treasuries', 'sovereign debt', 'fiscal deficit', 'debt ceiling'] },
  { name: 'MACRO',        color: '#ef4444', weight: 2, kw: ['consumer price index', 'cpi', 'inflation', 'gross domestic', 'gdp', 'jobs report', 'non-farm', 'payroll', 'nonfarm', 'recession', 'tariff', 'purchasing managers', 'trade deficit', 'unemployment rate', 'unemployment', 'consumer spending', 'retail sales', 'housing starts', 'economic growth', 'gdp growth', 'trade war', 'sanctions', 'economy', 'economic data', 'economic outlook', 'producer price', 'ppi', 'jobless claims', 'consumer confidence', 'manufacturing index', 'industrial production', 'trade balance', 'fiscal policy', 'budget deficit', 'jobs added', 'wage growth', 'core inflation', 'pce', 'at close of trade', 'close of trade', 'stocks higher at close', 'stocks lower at close', 'stocks mixed at close', 'dow jones industrial average', 'social security trust', 'student loan', 'ev adoption', 'electric vehicle adoption', 'market close', 'market open', 'markets closed', 'markets opened'] },
  { name: 'EARNINGS',     color: '#f59e0b', weight: 1, kw: ['quarterly earnings', 'quarterly results', 'quarterly revenue', 'beats estimates', 'misses estimates', 'earnings per share', 'full-year guidance', 'first quarter', 'second quarter', 'third quarter', 'fourth quarter', 'fiscal year', 'net income', 'operating income', 'eps beat', 'eps miss', 'raised guidance', 'cut guidance', 'results top', 'q1 earnings', 'q2 earnings', 'q3 earnings', 'q4 earnings', 'earnings beat', 'earnings miss', 'earnings report', 'earnings call', 'earnings results', 'revenue growth', 'gross margin', 'reports earnings', 'reported earnings', 'posted earnings', 'profit rose', 'profit fell', 'revenue rose', 'revenue fell', 'tops estimates', 'misses forecasts', 'annual revenue', 'full year revenue', 'full year profit', 'fiscal 2025', 'fiscal 2026', 'q1 2025', 'q2 2025', 'q3 2025', 'q4 2025', 'q1 2026', 'q2 2026', 'q3 2026', 'q4 2026', 'beats expectations', 'misses expectations', 'tops expectations', 'results exceed', 'better than expected', 'worse than expected', 'consensus estimate', 'street estimate'] },
  { name: 'AI/TECH',      color: '#22c55e', weight: 1, kw: ['nvidia', 'artificial intelligence', 'machine learning', 'semiconductor', 'data center', 'openai', 'anthropic', 'generative ai', 'large language', 'chip maker', 'gpu', 'ai model', 'ai chip', 'cloud computing', 'microsoft azure', 'google cloud', 'amazon aws', 'ai infrastructure', 'deepseek', 'llm', 'microsoft', 'alphabet', 'meta platforms', 'apple inc', 'intel corp', 'amd', 'qualcomm', 'tsmc', 'arm holdings', 'palantir', 'broadcom', 'asml', 'robotics', 'autonomous', 'cybersecurity', 'software company', 'tech sector', 'tech stock', 'silicon valley', 'ai startup', 'chip shortage', 'foundry', 'cisco', 'salesforce', 'oracle', 'ibm', 'snowflake', 'servicenow', 'crowdstrike', 'datadog', 'mongodb', 'mobileye', 'robotaxi', 'self-driving', 'autonomous vehicle', 'electric vehicle', 'silicon carbide', 'ai partnership', 'ai deal', 'ai integration', 'digital twin', 'semiconductor supply', 'hyperscaler', 'inference', 'training cluster'] },
  { name: 'COMMODITIES',  color: '#f97316', weight: 1, kw: ['gold price', 'silver price', 'crude oil', 'oil prices', 'wti crude', 'brent crude', 'copper prices', 'natural gas', 'precious metals', 'commodity prices', 'opec', 'energy prices', 'gold futures', 'oil futures', 'commodity market', 'raw materials', 'spot gold', 'spot silver', 'oil production', 'oil output', 'gas prices', 'lng', 'uranium', 'lithium', 'copper market', 'iron ore', 'wheat prices', 'corn prices', 'commodity', 'gold rally', 'gold fell', 'oil rally', 'oil fell', 'gold surge', 'oil surge', 'metals market', 'energy market', 'barrel', 'drilling', 'pipeline', 'refinery', 'oilfield', 'shale', 'energy sector', 'energy company', 'oil company', 'gas company', 'oil field', 'oil well', 'energy stock', 'fossil fuel', 'renewables', 'solar energy', 'wind energy', 'gold corp', 'gold inc', 'gold mines', 'gold mining', 'silver corp', 'silver mines', 'silver mining', 'gold announces', 'silver announces', 'price of gold', 'price of silver', 'price of oil', 'price of crude', 'investing in gold', 'buying gold', 'selling gold', 'copper corp', 'mining company', 'exploration company', 'ore deposit', 'battery metal', 'grid storage', 'energy storage', 'power grid'] },
  { name: 'GEOPOLITICAL', color: '#a855f7', weight: 1, kw: ['war', 'military strike', 'iran', 'russia', 'ukraine', 'ceasefire', 'nato', 'geopolitical', 'armed conflict', 'nuclear', 'pentagon', 'weapons', 'troops', 'invasion', 'missile', 'election', 'bilateral', 'china trade', 'taiwan strait', 'north korea', 'middle east', 'hamas', 'hezbollah', 'terrorism', 'conflict zone', 'diplomatic', 'g7 summit', 'g20 summit', 'imf', 'world bank', 'un security', 'coup', 'protest', 'unrest', 'senate votes', 'congress votes', 'bill passes', 'legislation passes', 'fbi warns', 'fbi disrupts', 'fbi foils', 'doj probe', 'doj investigation', 'supreme court rules', 'supreme court rejects', 'white house', 'president signs', 'executive order', 'fisa', 'intelligence', 'cyber attack', 'cyberattack', 'data breach', 'hacking group', 'ransomware', 'state-sponsored'] },
  { name: 'CORPORATE',    color: '#64748b', weight: 0, kw: ['mergers and acquisitions', 'merger agreement', 'acquisition', 'takeover bid', 'buyout', 'ipo filing', 'going public', 'share buyback', 'stock repurchase', 'dividend increase', 'dividend cut', 'spinoff', 'ceo resigns', 'cfo departs', 'board of directors', 'sec investigation', 'class action', 'shareholder', 'merger', 'acquires', 'acquired by', 'definitive agreement', 'joint venture', 'strategic partnership', 'restructuring', 'layoffs', 'workforce reduction', 'ipo', 'initial public offering', 'spac', 'chapter 11', 'bankruptcy', 'dividend', 'special dividend', 'stock split', 'names new ceo', 'names new cfo', 'appoints', 'announces agreement', 'entered into', 'completed acquisition', 'signs agreement', 'closes acquisition', 'agrees to acquire', 'to be acquired', 'price target', 'target price', 'upgrades', 'downgrades', 'outperform', 'underperform', 'overweight', 'underweight', 'strong buy', 'buy rating', 'hold rating', 'sell rating', 'initiates coverage', 'raises target', 'cuts target', 'target raised', 'target cut', 'analyst sees', 'analyst raises', 'analyst cuts', 'analyst upgrades', 'analyst downgrades', 'wall street', 'stock forecast', 'stock outlook', 'shares outstanding', 'earnings outlook', 'company reports', 'company announces', 'company plans', 'company agrees', 'company cuts', 'company raises', 'company sees', 'investor alert', 'law firm investigates', 'investigates claims', 'm&a', 'bought deal', 'public offering', 'follow-on offering', 'secondary offering', 'private placement', 'equity offering', 'debt offering', 'bond offering', 'note offering', 'capital raise', 'capital markets', 'private credit', 'private equity', 'asset management', 'hedge fund', 'venture capital', 'series a', 'series b', 'series c', 'funding round', 'raises million', 'raises billion', 'secures funding', 'announces appointment', 'appointment of', 'names chief', 'elects director', 'board elects', 'executive vice president', 'press release', 'announces financial', 'reports financial', 'rating upgrade', 'rating downgrade', 'rating upgraded', 'rating downgraded', 'investor day', 'analyst day', 'capital day', 'analyst/investor', 'covered call', 'option strategy', 's&p 500 decline', 'market signal', 'bull case', 'bear case', 'stock falls on', 'stock surges on', 'stock rises on', 'stock drops on', 'stock jumps on', 'stock slides on', 'cfo announces', 'cfo retirement', 'preferred shares', 'overnight offering', 'minority investment', 'letter of intent', 'deal closing', 'announces deal', 'margin rebound', 'margin expansion', 'margin compression', 'market share', 'at&t', 'verizon', 'comcast', 'disney', 'walmart', 'target corp', 'home depot', 'costco', 'cvs health', 'unitedhealth', 'jpmorgan', 'goldman sachs', 'morgan stanley', 'bank of america', 'wells fargo', 'blackrock', 'blackstone'] },
]

const BULL_KW = ['beat', 'surge', 'rally', 'rises', 'soar', 'record high', 'exceed', 'strong', 'gain', 'jumps', 'tops', 'upgrade', 'outperform', 'positive']
const BEAR_KW = ['miss', 'falls', 'drops', 'plunge', 'weak', 'cut ', 'decline', 'warning', 'crash', 'below', 'downgrade', 'loss', 'disappoint', 'concern', 'fear', 'slump']

const ASSET_MAP = [
  { tag: 'OIL',    color: '#f59e0b', kw: ['crude oil', 'brent crude', 'wti crude', 'oil prices', 'oil price', 'opec', 'petroleum', 'oil output', 'oil supply', 'oil production', 'oil demand', 'strait of hormuz', 'hormuz', 'oil refinery', 'oil field', 'oil market', 'oil barrel', 'energy prices', 'oil surges', 'oil gains', 'oil falls', 'oil jumps', 'oil slips', 'oil tumbles', 'oil rebounds', 'oil rises', 'oil declines', 'oil climbs', 'oil hits', 'oil at $', 'oil up ', 'oil down ', 'oil near', 'oil above $', 'oil below $', 'oil breaks', 'oil holds', 'oil retreats', 'oil settles', 'oil trades', 'oil advances', 'oil slides', 'oil spikes', 'oil plunges', 'oil rallies', 'oil softens'] },
  { tag: 'GOLD',   color: '#fbbf24', kw: ['gold price', 'gold prices', 'spot gold', 'gold futures', 'gold rally', 'gold surge', 'gold fell', 'gold market', 'gold drops', 'bullion', 'gold mining', 'gold surges', 'gold gains', 'gold falls', 'gold jumps', 'gold slips', 'gold tumbles', 'gold rebounds', 'gold rises', 'gold declines', 'gold climbs', 'gold hits', 'gold at $', 'gold up ', 'gold down ', 'gold near', 'gold above $', 'gold below $', 'gold breaks', 'gold holds', 'gold retreats', 'gold settles', 'gold trades', 'gold advances', 'gold slides', 'gold spikes', 'gold plunges', 'gold rallies', 'gold softens', 'xauusd', 'xau/usd', 'xau usd', 'gold ounce', 'gold oz'] },
  { tag: 'SILVER', color: '#94a3b8', kw: ['silver price', 'silver prices', 'spot silver', 'silver futures', 'silver rally', 'silver market', 'silver drops', 'silver surges', 'silver gains', 'silver falls', 'silver jumps', 'silver slips', 'silver tumbles', 'silver rebounds', 'silver rises', 'silver declines', 'silver climbs', 'silver hits', 'silver at $', 'silver up ', 'silver down ', 'silver near', 'silver above $', 'silver below $', 'silver breaks', 'silver holds', 'silver retreats', 'silver settles', 'silver trades', 'silver advances', 'silver slides', 'silver spikes', 'silver plunges', 'silver rallies', 'silver softens', 'silver slumps', 'silver weakens', 'silver strengthens', 'xagusd', 'xag/usd', 'xag usd', 'silver ounce', 'silver oz', 'white metal', 'silver reversal', 'silver reverses'] },
  { tag: 'GAS',    color: '#06b6d4', kw: ['natural gas', 'henry hub', 'ng futures', 'gas inventory', 'gas storage', 'natural gas price', 'natgas', 'natural gas surges', 'natural gas falls', 'natural gas drops', 'natural gas rallies', 'natural gas slides', 'lng prices', 'gas supplies'] },
  { tag: 'COPPER', color: '#f97316', kw: ['copper price', 'copper prices', 'copper market', 'copper futures', 'copper demand', 'copper surges', 'copper falls', 'copper drops', 'copper rallies', 'copper slides', 'copper hits', 'copper retreats', 'copper rebounds', 'dr copper'] },
  { tag: 'NVDA',   color: '#22c55e', kw: ['nvidia', 'nvda', 'blackwell', 'h100', 'h200', 'gb200', 'jensen huang'] },
  { tag: 'AMD',    color: '#ef4444', kw: ['advanced micro devices', 'amd gpu', 'amd chip', 'amd stock', 'amd revenue', 'mi300', 'radeon rx', 'instinct gpu'] },
  { tag: 'PLTR',   color: '#8b5cf6', kw: ['palantir'] },
  { tag: 'CEG',    color: '#3b82f6', kw: ['constellation energy', 'calvert cliffs'] },
  { tag: 'AVGO',   color: '#0ea5e9', kw: ['broadcom'] },
  { tag: 'ARM',    color: '#f97316', kw: ['arm holdings', 'arm chip', 'arm architecture', 'arm-based'] },
  { tag: 'VRT',    color: '#10b981', kw: ['vertiv'] },
  { tag: 'APP',    color: '#ec4899', kw: ['applovin'] },
  { tag: 'MU',     color: '#6366f1', kw: ['micron technology', 'micron memory', 'micron stock', 'dram market', 'nand flash market'] },
  { tag: 'TSLA',   color: '#cc2222', kw: ['tesla', 'tsla', 'cybertruck', 'model y', 'giga factory', 'elon musk tesla'] },
  { tag: 'BTC',    color: '#f97316', kw: ['bitcoin price', 'bitcoin market', 'btc cryptocurrency', 'crypto market cap', 'bitcoin surge', 'bitcoin falls'] },
  { tag: 'USD',    color: '#22c55e', kw: ['dollar index', 'dxy', 'us dollar falls', 'us dollar rises', 'dollar weakens', 'dollar strengthens', 'dollar index falls', 'dollar index rises'] },
  { tag: '10Y',    color: '#3b82f6', kw: ['10-year yield', '10yr yield', '10-year treasury', 'treasury yield rises', 'treasury yield falls', 'bond yield rises', 'bond yield falls', '10y auction', '20y auction', '30y auction'] },
  { tag: 'FED',    color: '#3b82f6', kw: ['federal reserve decision', 'fomc decision', 'fomc meeting', 'powell speech', 'fed rate decision', 'rate hike decision', 'rate cut decision', 'fed funds rate decision'] },
  { tag: 'SPX',    color: '#64748b', kw: ['s&p 500 falls', 's&p 500 rises', 's&p 500 drops', 's&p 500 rally', 'nasdaq falls', 'nasdaq rises', 'dow jones falls', 'dow jones rises', 'equities rally', 'equities fall', 'stock market crash', 'market selloff'] },
]

function detectAsset(title: string, summary: string): string | null {
  const text = (title + ' ' + summary).toLowerCase()
  for (const at of ASSET_MAP) {
    if (at.kw.some(k => text.includes(k))) return at.tag
  }
  return null
}

function categorize(title: string, summary: string, sourceName?: string) {
  const text = (title + ' ' + summary).toLowerCase()
  for (const cat of CATEGORIES) {
    if (cat.kw.some(k => text.includes(k))) return cat
  }
  if (sourceName === 'SEC EDGAR') return CATEGORIES.find(c => c.name === 'CORPORATE') ?? { name: 'CORPORATE', color: '#64748b', weight: 0, kw: [] }
  return { name: 'GENERAL', color: '#475569', weight: 0 }
}

const QUESTION_STARTERS = [
  'will ', 'can ', 'could ', 'should ', 'is ', 'are ', 'was ', 'were ',
  'what ', 'why ', 'how ', 'when ', 'who ', 'which ', 'do ', 'does ', 'did ',
  'have ', 'has ', 'had ',
]

const VAGUE_PHRASES = [
  "here's why", "here's what", "here's how", "here's the",
  'what you need to know', 'what to know about', 'everything you need',
  'all you need to know', 'you need to know', 'need to know:',
  'how to ', 'watch:', 'listen:', 'opinion:', 'analysis by', 'video:',
  'explainer:', 'podcast:', 'roundup:', 'morning briefing', 'afternoon briefing',
  'market wrap', 'weekly recap', 'this is why', 'this is what',
  'what it means for', 'what this means',
]

function isStatement(title: string): boolean {
  if (!title || title.trim().length < 22) return false
  if (title.trim().endsWith('?')) return false
  const t = title.toLowerCase()
  if (QUESTION_STARTERS.some(s => t.startsWith(s))) return false
  if (VAGUE_PHRASES.some(p => t.includes(p))) return false
  return true
}

function sentiment(title: string) {
  const t = title.toLowerCase()
  if (BULL_KW.some(k => t.includes(k))) return 'bullish'
  if (BEAR_KW.some(k => t.includes(k))) return 'bearish'
  return 'neutral'
}

function impactScore(tier: number, catWeight: number) {
  return Math.min(5, (4 - tier) + catWeight + 1)
}

function stripHtml(html: string) {
  return (html || '').replace(/<[^>]+>/g, '').slice(0, 160).trim()
}

async function fetchSource(src: typeof SOURCES[0]) {
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketPulse/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const feed = await parser.parseString(xml)
    const cutoff = Date.now() - 6 * 60 * 60 * 1000 // last 6 hours

    return (feed.items || [])
      .filter(item => {
        const pub = new Date(item.pubDate || item.isoDate || '').getTime()
        return pub > cutoff && isStatement(item.title || '')
      })
      .map(item => {
        const title = item.title || ''
        const summary = stripHtml(item.contentSnippet || item.content || item.summary || '')
        const cat = categorize(title, summary, src.name)
        const pub = item.pubDate || item.isoDate || new Date().toISOString()
        return {
          id: Buffer.from(title + pub).toString('base64').slice(0, 16),
          title,
          link: item.link || '',
          pubDate: new Date(pub).toISOString(),
          source: src.name,
          sourceColor: src.color,
          category: cat.name,
          categoryColor: cat.color,
          sentiment: sentiment(title),
          impactScore: impactScore(src.tier, cat.weight),
          summary,
          asset: detectAsset(title, summary),
        }
      })
  } catch {
    return []
  }
}

export async function GET() {
  const results = await Promise.allSettled(SOURCES.map(fetchSource))

  const all: ReturnType<typeof fetchSource> extends Promise<(infer T)[]> ? T[] : never[] = []
  const seen = new Set<string>()

  for (const r of results) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        const key = item.title.toLowerCase().slice(0, 60)
        if (!seen.has(key)) {
          seen.add(key)
          all.push(item)
        }
      }
    }
  }

  all.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

  return Response.json({ items: all.slice(0, 250), fetchedAt: new Date().toISOString() })
}
