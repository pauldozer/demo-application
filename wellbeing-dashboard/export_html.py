"""
Generates a fully self-contained interactive HTML dashboard.
All filter combinations are pre-computed and embedded as JSON.
Plotly.js is embedded inline — works from file://, offline, anywhere.

Run:  python3 export_html.py
Output: output/wellbeing_survey_dashboard.html
"""

import json
import itertools
import urllib.request
from pathlib import Path
from data_loader import (
    compute_filtered, load_funnel_by_country,
    MULTI_SELECT_QUESTIONS,
)

# ── Pre-compute every filter state ────────────────────────────────────────────

funnel_data = load_funnel_by_country()
Q_IDS       = list(funnel_data.keys())

MARKETS    = ["All countries", "Kuwait", "KSA", "UAE"]
GENDERS    = [[], ["Male"], ["Female"], ["Male", "Female"]]
AGE_BANDS  = ["18–24", "25–34", "35–44", "45–54", "55–64"]

# All subsets of age bands (2^5 = 32 combos, including empty = no filter)
age_combos = [list(c) for r in range(len(AGE_BANDS) + 1)
              for c in itertools.combinations(AGE_BANDS, r)]

def make_key(mkt, genders, ages):
    g = ",".join(sorted(genders)) if genders else ""
    a = ",".join(ages) if ages else ""
    return f"{mkt}|{g}|{a}"

# ── Download Plotly.js (cached locally after first run) ───────────────────────

PLOTLY_CACHE = Path("/tmp/plotly-2.27.0.min.js")
if not PLOTLY_CACHE.exists():
    print("Downloading Plotly.js...")
    urllib.request.urlretrieve(
        "https://cdn.plot.ly/plotly-2.27.0.min.js", PLOTLY_CACHE)
PLOTLY_JS = PLOTLY_CACHE.read_text(encoding="utf-8")
print(f"Plotly.js ready ({len(PLOTLY_JS)//1024} KB)")

print("Pre-computing all filter combinations...")
total_states = len(Q_IDS) * len(MARKETS) * len(GENDERS) * len(age_combos)
print(f"  {len(Q_IDS)} questions × {len(MARKETS)} markets × "
      f"{len(GENDERS)} gender combos × {len(age_combos)} age combos "
      f"= {total_states:,} states")

def round_to_100(pcts):
    floors     = [int(p) for p in pcts]
    remainders = [(pcts[i] - floors[i], i) for i in range(len(pcts))]
    deficit    = 100 - sum(floors)
    for _, i in sorted(remainders, reverse=True)[:deficit]:
        floors[i] += 1
    return floors

embedded = {}   # {qid: {key: {labels, pcts_raw, pcts_disp, ns, n_total}}}

for qid in Q_IDS:
    q         = funnel_data[qid]
    responses = q["responses"]
    is_multi  = qid in MULTI_SELECT_QUESTIONS
    embedded[qid] = {}

    for mkt in MARKETS:
        for genders in GENDERS:
            for ages in age_combos:
                key = make_key(mkt, genders, ages)
                results, n_total = compute_filtered(
                    qid, [mkt], genders, ages, responses)

                if n_total == 0:
                    embedded[qid][key] = None
                    continue

                # Sort descending by pct (highest bar at top)
                order      = sorted(range(len(results)), key=lambda i: results[i]["pct"])
                labels     = [results[i]["text"]    for i in order]
                pcts_raw   = [results[i]["pct"]     for i in order]
                ns         = [results[i]["n"]        for i in order]
                pcts_disp  = (round_to_100(pcts_raw) if not is_multi
                              else [round(p) for p in pcts_raw])

                embedded[qid][key] = {
                    "labels":     labels,
                    "pcts_raw":   [round(p, 2) for p in pcts_raw],
                    "pcts_disp":  pcts_disp,
                    "ns":         ns,
                    "n_total":    n_total,
                }

print("  Done.")

# ── Question metadata for sidebar / titles ────────────────────────────────────

questions_meta = {
    qid: {
        "label": funnel_data[qid]["label"],
        "multi": funnel_data[qid]["multi"],
    }
    for qid in Q_IDS
}

# ── Build HTML ────────────────────────────────────────────────────────────────

DATA_JSON  = json.dumps(embedded,        separators=(",", ":"))
Q_JSON     = json.dumps(questions_meta,  separators=(",", ":"))
Q_IDS_JSON = json.dumps(Q_IDS,          separators=(",", ":"))
AGE_JSON   = json.dumps(AGE_BANDS,       separators=(",", ":"))

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wellbeing Platform Survey · Dashboard</title>
<script>{PLOTLY_JS}</script>
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif;background:#F5F6F8;color:#1A2330;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;height:100vh;overflow:hidden;display:flex;flex-direction:column}}
/* topbar */
.topbar{{background:#1F4E79;padding:0 28px;height:56px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.15)}}
.brand{{color:#fff;font-weight:700;font-size:15px;letter-spacing:.3px}}
.brand-sub{{color:rgba(255,255,255,.55);font-size:11px;margin-top:1px}}
.topbar-right{{color:rgba(255,255,255,.45);font-size:12px}}
/* layout */
.body-row{{display:flex;flex:1;overflow:hidden}}
/* sidebar */
.sidebar{{width:224px;flex-shrink:0;background:#fff;border-right:1px solid #E8EAED;overflow-y:auto;padding:16px 0 24px}}
.sidebar-title{{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#9AA3AE;padding:0 16px 10px}}
.q-item{{display:flex;flex-direction:column;padding:8px 16px;cursor:pointer;border-left:3px solid transparent;transition:background .12s,border-color .12s;gap:2px}}
.q-item:hover{{background:#F0F5FA}}
.q-item.active{{background:#EBF3FB;border-left-color:#1F4E79}}
.q-id{{font-size:10px;font-weight:700;color:#1F4E79;letter-spacing:.5px;text-transform:uppercase}}
.q-label{{font-size:12px;color:#4A5568;line-height:1.35}}
/* main */
.main-panel{{flex:1;overflow-y:auto;padding:24px 28px 48px;display:flex;flex-direction:column;gap:18px}}
/* kpi */
.kpi-row{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}
.kpi-card{{background:#fff;border-radius:10px;padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #E8EAED}}
.kpi-title{{font-size:10px;font-weight:700;color:#9AA3AE;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px}}
.kpi-value{{font-size:30px;font-weight:700;color:#1F4E79;line-height:1;margin-bottom:4px}}
.kpi-sub{{font-size:12px;color:#9AA3AE}}
/* filter row */
.filter-row{{background:#fff;border-radius:10px;padding:14px 20px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #E8EAED;display:flex;align-items:flex-start;gap:28px;flex-wrap:wrap}}
.filter-group{{display:flex;flex-direction:column;gap:8px}}
.filter-group-label{{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#9AA3AE}}
.opts{{display:flex;flex-direction:column;gap:5px}}
.opt-label{{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:500;cursor:pointer;user-select:none;line-height:1}}
/* radio + checkbox inputs */
.opt-label input{{-webkit-appearance:none;appearance:none;width:15px;height:15px;border:1.5px solid #D1D5DB;background:#fff;cursor:pointer;flex-shrink:0;transition:background .12s,border-color .12s;background-position:center;background-repeat:no-repeat;background-size:10px 8px}}
.opt-label input[type=radio]{{border-radius:50%;border-color:#7A8CA5}}
.opt-label input[type=radio]:checked{{background-color:#1F4E79;border-color:#1F4E79;background-image:radial-gradient(circle,#fff 33%,#1F4E79 38%)}}
.market-group .opt-label{{color:#1F4E79}}
.opt-label input[type=checkbox]{{border-radius:3px}}
.opt-label input[type=checkbox]:checked{{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 10 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 4l3 3 5-6' stroke='%23fff' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")}}
.gender-group .opt-label{{color:#4E7C59}}
.gender-group .opt-label input{{border-color:#82B494}}
.gender-group .opt-label input:checked{{background-color:#4E7C59;border-color:#4E7C59}}
.age-group .opt-label{{color:#8B4513}}
.age-group .opt-label input{{border-color:#D4956A}}
.age-group .opt-label input:checked{{background-color:#C0774A;border-color:#C0774A}}
/* chart card */
.chart-card{{background:#fff;border-radius:10px;padding:22px 24px 40px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #E8EAED;overflow:visible}}
.q-header{{display:flex;align-items:baseline;gap:10px;margin-bottom:10px;flex-wrap:wrap}}
.q-badge{{font-size:10px;font-weight:700;letter-spacing:.8px;color:#fff;background:#1F4E79;padding:3px 9px;border-radius:4px;white-space:nowrap}}
.q-title{{font-size:15px;font-weight:600;color:#1A2330;line-height:1.3}}
.chart-meta{{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:4px}}
.chart-note{{font-size:11px;color:#9AA3AE;font-style:italic}}
.chart-n{{font-size:11px;font-weight:600;color:#7A8CA5}}
.empty-msg{{text-align:center;color:#9AA3AE;padding:40px;font-size:14px}}
/* scrollbar */
::-webkit-scrollbar{{width:6px;height:6px}}
::-webkit-scrollbar-track{{background:transparent}}
::-webkit-scrollbar-thumb{{background:#D1D5DB;border-radius:3px}}
</style>
</head>
<body>

<header class="topbar">
  <div style="display:flex;flex-direction:column">
    <div class="brand">Wellbeing Platform Survey</div>
    <div class="brand-sub">Market Research · MENA · n = 293</div>
  </div>
  <div class="topbar-right">Kuwait · KSA · UAE</div>
</header>

<div class="body-row">

  <!-- Sidebar -->
  <nav class="sidebar">
    <div class="sidebar-title">Survey Questions</div>
    <div id="q-nav"></div>
  </nav>

  <!-- Main -->
  <main class="main-panel">

    <!-- KPI cards -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-title">Total Respondents</div>
        <div class="kpi-value">293</div>
        <div class="kpi-sub">Qualified &amp; complete</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Markets Covered</div>
        <div class="kpi-value">3</div>
        <div class="kpi-sub">Kuwait · KSA · UAE</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Survey Questions</div>
        <div class="kpi-value">17</div>
        <div class="kpi-sub">Single &amp; multi-select</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-row">
      <!-- Market -->
      <div class="filter-group market-group">
        <div class="filter-group-label">Market</div>
        <div class="opts" id="market-opts">
          <label class="opt-label"><input type="radio" name="market" value="All countries" checked> All countries</label>
          <label class="opt-label"><input type="radio" name="market" value="Kuwait"> Kuwait</label>
          <label class="opt-label"><input type="radio" name="market" value="KSA"> KSA</label>
          <label class="opt-label"><input type="radio" name="market" value="UAE"> UAE</label>
        </div>
      </div>
      <!-- Gender -->
      <div class="filter-group gender-group">
        <div class="filter-group-label">Gender</div>
        <div class="opts">
          <label class="opt-label"><input type="checkbox" class="gender-chk" value="Male"> Male</label>
          <label class="opt-label"><input type="checkbox" class="gender-chk" value="Female"> Female</label>
        </div>
      </div>
      <!-- Age -->
      <div class="filter-group age-group">
        <div class="filter-group-label">Age</div>
        <div class="opts" id="age-opts"></div>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-card">
      <div class="q-header">
        <span class="q-badge" id="chart-qid">Q1</span>
        <h2 class="q-title" id="chart-title"></h2>
      </div>
      <div class="chart-meta">
        <span class="chart-note" id="chart-note"></span>
        <span class="chart-n"   id="chart-n"></span>
      </div>
      <div id="chart"></div>
    </div>

  </main>
</div>

<script>
const DATA      = {DATA_JSON};
const QUESTIONS = {Q_JSON};
const Q_IDS     = {Q_IDS_JSON};
const AGE_BANDS = {AGE_JSON};
const COLOR     = '#1F4E79';

let activeQid = Q_IDS[0];

// ── Build age checkboxes ──────────────────────────────────────────────────────
const ageOpts = document.getElementById('age-opts');
AGE_BANDS.forEach(band => {{
  const lbl = document.createElement('label');
  lbl.className = 'opt-label';
  lbl.innerHTML = `<input type="checkbox" class="age-chk" value="${{band}}"> ${{band}}`;
  ageOpts.appendChild(lbl);
}});

// ── Build sidebar ─────────────────────────────────────────────────────────────
const nav = document.getElementById('q-nav');
Q_IDS.forEach(qid => {{
  const div = document.createElement('div');
  div.className = 'q-item' + (qid === activeQid ? ' active' : '');
  div.id = 'nav-' + qid;
  const label = QUESTIONS[qid].label;
  div.innerHTML = `<span class="q-id">${{qid}}</span><span class="q-label">${{label.length > 47 ? label.slice(0,45)+'…' : label}}</span>`;
  div.addEventListener('click', () => setQuestion(qid));
  nav.appendChild(div);
}});

// ── State helpers ─────────────────────────────────────────────────────────────
function getMkt() {{
  return document.querySelector('input[name="market"]:checked')?.value || 'All countries';
}}
function getGenders() {{
  return [...document.querySelectorAll('.gender-chk:checked')].map(e => e.value).sort();
}}
function getAges() {{
  return [...document.querySelectorAll('.age-chk:checked')].map(e => e.value);
}}
function makeKey(mkt, genders, ages) {{
  const g = genders.sort().join(',');
  const a = ages.join(',');
  return `${{mkt}}|${{g}}|${{a}}`;
}}

// ── Filter summary label ──────────────────────────────────────────────────────
function filterLabel(mkt, genders, ages, n) {{
  const parts = [];
  if (mkt !== 'All countries') parts.push(mkt);
  if (genders.length) parts.push(genders.join(' + '));
  if (ages.length)    parts.push(ages.join(' + '));
  const label = parts.length ? parts.join('  ·  ') : 'All countries';
  return label + '  —  n = ' + n.toLocaleString();
}}

// ── Render chart ──────────────────────────────────────────────────────────────
function renderChart() {{
  const qid     = activeQid;
  const mkt     = getMkt();
  const genders = getGenders();
  const ages    = getAges();
  const key     = makeKey(mkt, genders, ages);
  const d       = DATA[qid] && DATA[qid][key];
  const meta    = QUESTIONS[qid];

  document.getElementById('chart-qid').textContent   = qid;
  document.getElementById('chart-title').textContent = meta.label;
  document.getElementById('chart-note').textContent  =
    meta.multi ? 'Multi-select — % of respondents; totals may exceed 100%'
               : 'Single choice — % of respondents';

  const chartEl = document.getElementById('chart');

  if (!d) {{
    document.getElementById('chart-n').textContent = 'n = 0';
    Plotly.purge(chartEl);
    chartEl.innerHTML = '<div class="empty-msg">No respondents match the selected filters.</div>';
    return;
  }}

  document.getElementById('chart-n').textContent = filterLabel(mkt, genders, ages, d.n_total);

  const texts = d.pcts_disp.map((p, i) => ` ${{p}}%  (n=${{d.ns[i]}})`);
  const xmax  = Math.max(...d.pcts_raw) * 1.62;
  const height = Math.max(280, d.labels.length * 54);

  const trace = {{
    type: 'bar',
    orientation: 'h',
    x: d.pcts_raw,
    y: d.labels,
    text: texts,
    textposition: 'outside',
    textfont: {{ size: 12, color: '#444' }},
    marker: {{ color: COLOR, line: {{ width: 0 }} }},
    cliponaxis: false,
    hovertemplate: '%{{y}}<br><b>%{{x:.1f}}%</b><extra></extra>',
  }};

  const layout = {{
    plot_bgcolor:  '#fff',
    paper_bgcolor: '#fff',
    font: {{ family: 'Inter, Helvetica Neue, sans-serif', size: 12, color: '#333' }},
    margin: {{ t: 10, b: 56, l: 10, r: 175 }},
    height: height,
    xaxis: {{
      range: [0, xmax], tickformat: '.0f', ticksuffix: '%',
      showgrid: true, gridcolor: '#E8EAED', gridwidth: 1,
      showline: false, zeroline: false,
    }},
    yaxis: {{
      showgrid: false, showline: false, automargin: true,
      tickfont: {{ size: 12 }}, ticklabelstandoff: 12,
    }},
    hoverlabel: {{ bgcolor: 'white', font: {{ size: 12 }} }},
  }};

  Plotly.react(chartEl, [trace], layout, {{displayModeBar: false, responsive: true}});
}}

// ── Set active question ───────────────────────────────────────────────────────
function setQuestion(qid) {{
  document.querySelectorAll('.q-item').forEach(el => el.classList.remove('active'));
  const nav = document.getElementById('nav-' + qid);
  if (nav) {{ nav.classList.add('active'); nav.scrollIntoView({{block:'nearest',behavior:'smooth'}}); }}
  activeQid = qid;
  renderChart();
}}

// ── Event listeners ───────────────────────────────────────────────────────────
document.querySelectorAll('input[name="market"]').forEach(el =>
  el.addEventListener('change', renderChart));
document.addEventListener('change', e => {{
  if (e.target.classList.contains('gender-chk') ||
      e.target.classList.contains('age-chk')) renderChart();
}});

// ── Initial render ────────────────────────────────────────────────────────────
renderChart();
</script>
</body>
</html>"""

# ── Write output ──────────────────────────────────────────────────────────────
out_dir = Path(__file__).parent / "output"
out_dir.mkdir(exist_ok=True)
out_path = out_dir / "wellbeing_survey_dashboard.html"
out_path.write_text(html, encoding="utf-8")

size_kb = out_path.stat().st_size / 1024
print(f"\n  Saved → {out_path}  ({size_kb:.0f} KB)")
print("  Open in any browser — no server required.\n")
