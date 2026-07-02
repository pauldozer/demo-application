"""
Wellbeing Survey Dashboard  —  executive-level interactive explorer.
Run:  python app.py   →   http://localhost:8050
"""
import dash
from dash import dcc, html, Input, Output, State, callback_context
import plotly.graph_objects as go

from data_loader import (
    load_funnel_by_country, get_bases_funnel,
    compute_segment_breakdown, get_raw_df,
    COLORS, PROFILE_SEGMENTS, CTRY_REVERSE,
)

# ── data ─────────────────────────────────────────────────────────────────────
funnel_data  = load_funnel_by_country()
bases_funnel = get_bases_funnel()
Q_IDS        = list(funnel_data.keys())
SEG_OPTIONS  = list(PROFILE_SEGMENTS.keys())   # ["Gender", "Age"]

COUNTRIES = ["Total", "Kuwait", "KSA", "UAE"]
CTRY_LABELS = {
    "Total":  "All countries",
    "Kuwait": "Kuwait",
    "KSA":    "KSA",
    "UAE":    "UAE",
}


# ── rounding ──────────────────────────────────────────────────────────────────

def round_to_100(pcts):
    """Largest-remainder rounding — returned integers sum to exactly 100."""
    floors     = [int(p) for p in pcts]
    remainders = [(pcts[i] - floors[i], i) for i in range(len(pcts))]
    deficit    = 100 - sum(floors)
    # give the remaining 1s to the entries with the biggest remainders
    for _, i in sorted(remainders, reverse=True)[:deficit]:
        floors[i] += 1
    return floors


# ── chart helpers ─────────────────────────────────────────────────────────────

def _base_layout(height=300):
    return dict(
        plot_bgcolor  = COLORS["white"],
        paper_bgcolor = COLORS["white"],
        font          = dict(family="Inter, Helvetica Neue, sans-serif",
                             size=12, color="#333"),
        hoverlabel    = dict(bgcolor="white", font_size=12),
        margin        = dict(t=10, b=10, l=10, r=170),
        height        = height,
    )


def make_hbar(responses, country, multi=False):
    labels    = [r["text"] for r in responses]
    pcts_raw  = [r[country]["pct"] * 100 for r in responses]
    ns        = [r[country]["n"] for r in responses]
    # single-select: use largest-remainder so displayed integers sum to 100
    pcts_disp = round_to_100(pcts_raw) if not multi else [round(p) for p in pcts_raw]
    texts     = [f" {p}%  (n={n})" for p, n in zip(pcts_disp, ns)]
    pcts      = pcts_raw   # use raw floats for bar length

    order  = sorted(range(len(pcts)), key=lambda i: pcts[i])
    labels = [labels[i] for i in order]
    pcts   = [pcts[i]   for i in order]
    texts  = [texts[i]  for i in order]

    if multi:
        mx = max(pcts) if pcts else 1
        bar_colors = [COLORS["accent"] if p == mx else COLORS["secondary"] for p in pcts]
    else:
        bar_colors = COLORS["primary"]

    fig = go.Figure(go.Bar(
        x=pcts, y=labels, orientation="h",
        text=texts, textposition="outside",
        textfont=dict(size=12, color="#444"),
        marker_color=bar_colors, marker_line_width=0,
        cliponaxis=False,
        hovertemplate="%{y}<br><b>%{x:.1f}%</b><extra></extra>",
    ))

    xmax   = (max(pcts) * 1.60) if pcts else 100
    layout = _base_layout(max(260, len(responses) * 54))
    layout.update(
        xaxis=dict(range=[0, xmax], tickformat=".0f", ticksuffix="%",
                   showgrid=True, gridcolor=COLORS["gray2"], gridwidth=1,
                   showline=False, zeroline=False),
        yaxis=dict(showgrid=False, showline=False, automargin=True,
                   tickfont=dict(size=12)),
    )
    fig.update_layout(**layout)
    return fig


def make_segment_chart(qid, country, segment):
    q = funnel_data.get(qid)
    if not q or not q.get("responses"):
        return _empty_fig()

    seg_map    = PROFILE_SEGMENTS[segment]["map"]
    seg_labels = list(seg_map.values())
    results, _ = compute_segment_breakdown(qid, country, segment, q["responses"])

    palette = ["#1F4E79", "#4E7C59", "#7A8CA5", "#C0774A",
               "#8E6BAD", "#3D8FB5", "#A3C4BC", "#2C6E49"]

    fig = go.Figure()
    is_multi = funnel_data.get(qid, {}).get("multi", False)
    for ci, seg in enumerate(seg_labels):
        vals_raw  = [r.get(seg, 0) * 100 for r in results]
        # single-select: round so each segment column sums to 100%
        vals_disp = round_to_100(vals_raw) if not is_multi else [round(v) for v in vals_raw]
        fig.add_trace(go.Bar(
            name=seg,
            x=[r["text"] for r in results],
            y=vals_raw,
            text=[f"{v}%" for v in vals_disp],
            textposition="outside",
            textfont=dict(size=11),
            marker_color=palette[ci % len(palette)],
            marker_line_width=0,
            cliponaxis=False,
            hovertemplate=f"<b>{seg}</b><br>%{{x}}<br>%{{y:.1f}}%<extra></extra>",
        ))

    layout = _base_layout(max(360, len(results) * 60))
    layout.update(
        barmode="group",
        margin=dict(t=20, b=120, l=10, r=10),
        xaxis=dict(showline=False, tickangle=-30, automargin=True,
                   tickfont=dict(size=11)),
        yaxis=dict(tickformat=".0f", ticksuffix="%",
                   gridcolor=COLORS["gray2"], gridwidth=1,
                   showline=False, zeroline=False),
        legend=dict(orientation="h", yanchor="bottom", y=1.02,
                    xanchor="right", x=1, font=dict(size=11)),
    )
    fig.update_layout(**layout)
    return fig


def _empty_fig():
    fig = go.Figure()
    fig.update_layout(
        plot_bgcolor=COLORS["white"], paper_bgcolor=COLORS["white"],
        xaxis=dict(visible=False), yaxis=dict(visible=False), height=180,
        annotations=[dict(text="No data", x=0.5, y=0.5, showarrow=False,
                          font=dict(size=14, color=COLORS["gray3"]),
                          xref="paper", yref="paper")],
    )
    return fig


def _seg_bases_str(country, segment):
    seg_map = PROFILE_SEGMENTS[segment]["map"]
    seg_col = PROFILE_SEGMENTS[segment]["col"]
    df = get_raw_df()
    if country != "Total":
        df = df[df["ctry"] == CTRY_REVERSE[country]]
    parts = []
    for code, label in seg_map.items():
        n = int((df[seg_col] == code).sum())
        parts.append(f"{label} (n={n})")
    return "  ·  ".join(parts)


# ── UI helpers ────────────────────────────────────────────────────────────────

def kpi_card(title, value, sub=None):
    children = [html.Div(title, className="kpi-title"),
                html.Div(value, className="kpi-value")]
    if sub:
        children.append(html.Div(sub, className="kpi-sub"))
    return html.Div(children, className="kpi-card")


def sidebar_items():
    return [
        html.Div(
            [html.Span(qid, className="q-nav-id"),
             html.Span(
                 (funnel_data[qid]["label"][:45] + "…")
                 if len(funnel_data[qid]["label"]) > 47
                 else funnel_data[qid]["label"],
                 className="q-nav-label",
             )],
            id=f"nav-{qid}",
            className="q-nav-item",
            n_clicks=0,
        )
        for qid in Q_IDS
    ]


# ── app ───────────────────────────────────────────────────────────────────────

app = dash.Dash(
    __name__,
    title="Wellbeing Survey · Dashboard",
    suppress_callback_exceptions=True,
)
app.index_string = open("assets/index_template.html").read()

app.layout = html.Div([

    dcc.Store(id="active-qid",     data="Q1"),
    dcc.Store(id="active-country", data="Total"),
    dcc.Store(id="active-segment", data="Gender"),
    # hidden sinks for clientside callbacks
    html.Div(id="sidebar-hl-sink",  style={"display": "none"}),
    html.Div(id="ctry-hl-sink",     style={"display": "none"}),
    html.Div(id="seg-hl-sink",      style={"display": "none"}),

    # top bar
    html.Header([
        html.Div([
            html.Div("Wellbeing Platform Survey", className="brand"),
            html.Div("Market Research · MENA · n = 293", className="brand-sub"),
        ], className="brand-block"),
        html.Div("Kuwait · KSA · UAE", className="topbar-right"),
    ], className="topbar"),

    html.Div([

        # sidebar
        html.Nav([
            html.Div("Survey Questions", className="sidebar-section-title"),
            html.Div(sidebar_items(), id="q-nav-list"),
        ], className="sidebar"),

        # main
        html.Main([

            # KPIs
            html.Div([
                kpi_card("Total Respondents", "293",  "Qualified & complete"),
                kpi_card("Markets Covered",   "3",    "Kuwait · KSA · UAE"),
                kpi_card("Survey Questions",  "17",   "Single & multi-select"),
            ], className="kpi-row"),

            # country filter
            html.Div([
                html.Span("Country", className="filter-label"),
                html.Div(
                    [html.Button(CTRY_LABELS[c], id=f"ctry-btn-{c}",
                                 className="ctry-btn", n_clicks=0)
                     for c in COUNTRIES],
                    id="ctry-btn-row",
                    className="ctry-btn-row",
                ),
            ], className="filter-row"),

            html.Div(id="question-panel"),

        ], className="main-panel"),

    ], className="body-row"),

], className="app-shell")


# ── server callbacks ──────────────────────────────────────────────────────────

@app.callback(
    Output("active-country", "data"),
    [Input(f"ctry-btn-{c}", "n_clicks") for c in COUNTRIES],
    prevent_initial_call=True,
)
def set_country(*_):
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update
    return ctx.triggered[0]["prop_id"].split(".")[0].replace("ctry-btn-", "")


@app.callback(
    Output("active-qid", "data"),
    [Input(f"nav-{qid}", "n_clicks") for qid in Q_IDS],
    prevent_initial_call=True,
)
def set_active_q(*_):
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update
    return ctx.triggered[0]["prop_id"].split(".")[0].replace("nav-", "")


@app.callback(
    Output("question-panel", "children"),
    Input("active-qid", "data"),
    Input("active-country", "data"),
)
def render_question(qid, country):
    q      = funnel_data.get(qid, {})
    label  = q.get("label", "")
    multi  = q.get("multi", False)
    resps  = q.get("responses", [])
    base_n = bases_funnel.get(country, 293)

    fig  = make_hbar(resps, country, multi=multi)
    note = ("Multi-select — % of respondents; totals may exceed 100%"
            if multi else "Single choice — % of respondents")

    main_card = html.Div([
        html.Div([html.Span(qid, className="q-badge"),
                  html.H2(label, className="q-title")],
                 className="q-header"),
        html.Div([html.Span(note, className="chart-note"),
                  html.Span(f"n = {base_n:,}", className="chart-n")],
                 className="chart-meta"),
        dcc.Graph(figure=fig, config={"displayModeBar": False},
                  className="main-chart"),
    ], className="chart-card")

    seg_card = html.Div([
        html.Div("Breakdown by Segment", className="section-title"),
        html.Div(
            [html.Button(seg, id=f"seg-btn-{seg}",
                         className="seg-btn", n_clicks=0)
             for seg in SEG_OPTIONS],
            id="seg-btn-row",
            className="seg-btn-row",
        ),
        html.Div(id="profile-chart-area"),
    ], className="chart-card profile-section")

    return [main_card, seg_card]


@app.callback(
    Output("profile-chart-area", "children"),
    Output("active-segment", "data"),
    [Input(f"seg-btn-{seg}", "n_clicks") for seg in SEG_OPTIONS],
    Input("active-qid", "data"),
    Input("active-country", "data"),
    State("active-segment", "data"),
)
def render_profile(*args):
    n_segs   = len(SEG_OPTIONS)
    qid      = args[n_segs]
    country  = args[n_segs + 1]
    prev_seg = args[n_segs + 2]

    ctx     = callback_context
    segment = prev_seg
    if ctx.triggered:
        tid = ctx.triggered[0]["prop_id"].split(".")[0]
        if tid.startswith("seg-btn-"):
            segment = tid.replace("seg-btn-", "")

    fig      = make_segment_chart(qid, country, segment)
    base_str = _seg_bases_str(country, segment)

    return [
        html.Div(base_str, className="chart-n seg-bases"),
        dcc.Graph(figure=fig, config={"displayModeBar": False}),
    ], segment


# ── clientside callbacks ──────────────────────────────────────────────────────

app.clientside_callback(
    """
    function(qid) {
        document.querySelectorAll('.q-nav-item').forEach(function(el) {
            var active = el.id === 'nav-' + qid;
            el.classList.toggle('active', active);
            if (active) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        return '';
    }
    """,
    Output("sidebar-hl-sink", "children"),
    Input("active-qid", "data"),
)

app.clientside_callback(
    """
    function(country) {
        ['Total','Kuwait','KSA','UAE'].forEach(function(c) {
            var el = document.getElementById('ctry-btn-' + c);
            if (el) el.classList.toggle('ctry-btn--active', c === country);
        });
        return '';
    }
    """,
    Output("ctry-hl-sink", "children"),
    Input("active-country", "data"),
)

app.clientside_callback(
    """
    function(segment) {
        ['Gender','Age'].forEach(function(s) {
            var el = document.getElementById('seg-btn-' + s);
            if (el) el.classList.toggle('seg-btn--active', s === segment);
        });
        return '';
    }
    """,
    Output("seg-hl-sink", "children"),
    Input("active-segment", "data"),
)


if __name__ == "__main__":
    app.run(debug=False, port=8050)
