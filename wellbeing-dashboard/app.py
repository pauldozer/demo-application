"""
Wellbeing Survey Dashboard v2 — single chart, AND-stacked filters.
Run:  python app.py   →   http://localhost:8050
"""
import dash
from dash import dcc, html, Input, Output
import plotly.graph_objects as go

from data_loader import (
    load_funnel_by_country, get_bases_funnel,
    compute_filtered, COLORS, FILTER_GROUPS, MULTI_SELECT_QUESTIONS,
)

# ── data ─────────────────────────────────────────────────────────────────────
funnel_data  = load_funnel_by_country()
bases_funnel = get_bases_funnel()
Q_IDS        = list(funnel_data.keys())


# ── rounding ──────────────────────────────────────────────────────────────────

def round_to_100(pcts):
    floors     = [int(p) for p in pcts]
    remainders = [(pcts[i] - floors[i], i) for i in range(len(pcts))]
    deficit    = 100 - sum(floors)
    for _, i in sorted(remainders, reverse=True)[:deficit]:
        floors[i] += 1
    return floors


# ── chart ─────────────────────────────────────────────────────────────────────

def make_chart(qid, mkt_sel, gender_sel, age_sel):
    q         = funnel_data.get(qid, {})
    responses = q.get("responses", [])
    is_multi  = qid in MULTI_SELECT_QUESTIONS

    if not responses:
        return _empty_fig("No data for this question")

    results, n_total = compute_filtered(qid, mkt_sel, gender_sel, age_sel, responses)

    if n_total == 0:
        return _empty_fig("No respondents match the selected filters")

    # Sort by value descending (highest at top)
    order     = sorted(range(len(results)), key=lambda i: results[i]["pct"])
    labels    = [results[i]["text"] for i in order]
    pcts_raw  = [results[i]["pct"]  for i in order]
    ns        = [results[i]["n"]    for i in order]

    pcts_disp = round_to_100(pcts_raw) if not is_multi else [round(p) for p in pcts_raw]
    texts     = [f" {p}%  (n={n})" for p, n in zip(pcts_disp, ns)]

    fig = go.Figure(go.Bar(
        x=pcts_raw,
        y=labels,
        orientation="h",
        text=texts,
        textposition="outside",
        textfont=dict(size=12, color="#444"),
        marker_color=COLORS["primary"],
        marker_line_width=0,
        cliponaxis=False,
        hovertemplate="%{y}<br><b>%{x:.1f}%</b><extra></extra>",
    ))

    xmax   = (max(pcts_raw) * 1.62) if pcts_raw else 100
    height = max(280, len(responses) * 54)

    fig.update_layout(
        plot_bgcolor  = COLORS["white"],
        paper_bgcolor = COLORS["white"],
        font=dict(family="Inter, Helvetica Neue, sans-serif", size=12, color="#333"),
        hoverlabel=dict(bgcolor="white", font_size=12),
        margin=dict(t=10, b=10, l=10, r=175),
        height=height,
        xaxis=dict(
            range=[0, xmax], tickformat=".0f", ticksuffix="%",
            showgrid=True, gridcolor=COLORS["gray2"], gridwidth=1,
            showline=False, zeroline=False,
        ),
        yaxis=dict(showgrid=False, showline=False, automargin=True,
                   tickfont=dict(size=12), ticklabelstandoff=12),
    )
    return fig, n_total


def _empty_fig(msg="No data"):
    fig = go.Figure()
    fig.update_layout(
        plot_bgcolor=COLORS["white"], paper_bgcolor=COLORS["white"],
        xaxis=dict(visible=False), yaxis=dict(visible=False), height=200,
        annotations=[dict(text=msg, x=0.5, y=0.5, showarrow=False,
                          font=dict(size=14, color=COLORS["gray3"]),
                          xref="paper", yref="paper")],
    )
    return fig, 0


# ── filter label ─────────────────────────────────────────────────────────────

def filter_summary(mkt_sel, gender_sel, age_sel, n_total):
    parts = []
    specific = [c for c in (mkt_sel or []) if c != "All countries"]
    if specific:
        parts.append(specific[0])        # only one country ever selected
    if gender_sel:
        parts.append(" + ".join(gender_sel))
    if age_sel:
        parts.append(" + ".join(age_sel))
    label = "  ·  ".join(parts) if parts else "All countries"
    return f"{label}  —  n = {n_total:,}"


# ── UI helpers ────────────────────────────────────────────────────────────────

def kpi_card(title, value, sub=None):
    children = [html.Div(title, className="kpi-title"),
                html.Div(value, className="kpi-value")]
    if sub:
        children.append(html.Div(sub, className="kpi-sub"))
    return html.Div(children, className="kpi-card")


def filter_panel():
    # Market — radio (single selection)
    market_group = html.Div([
        html.Div("MARKET", className="filter-group-label"),
        dcc.RadioItems(
            id="radio-Market",
            options=[{"label": lbl, "value": lbl} for lbl in FILTER_GROUPS["Market"]],
            value="All countries",
            className="chk-group chk-market",
            labelClassName="chk-label",
            inputClassName="radio-input",
        ),
    ], className="filter-group")

    # Gender — checkbox (OR, can pick both)
    gender_group = html.Div([
        html.Div("GENDER", className="filter-group-label"),
        dcc.Checklist(
            id="chk-Gender",
            options=[{"label": lbl, "value": lbl} for lbl in FILTER_GROUPS["Gender"]],
            value=[],
            className="chk-group chk-gender",
            labelClassName="chk-label",
            inputClassName="chk-input",
        ),
    ], className="filter-group")

    # Age — checkbox (OR, can pick multiple bands)
    age_group = html.Div([
        html.Div("AGE", className="filter-group-label"),
        dcc.Checklist(
            id="chk-Age",
            options=[{"label": lbl, "value": lbl} for lbl in FILTER_GROUPS["Age"]],
            value=[],
            className="chk-group chk-age",
            labelClassName="chk-label",
            inputClassName="chk-input",
        ),
    ], className="filter-group")

    return html.Div([market_group, gender_group, age_group], className="filter-row")


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

    dcc.Store(id="active-qid", data="Q1"),
    html.Div(id="sidebar-hl-sink", style={"display": "none"}),

    html.Header([
        html.Div([
            html.Div("Wellbeing Platform Survey", className="brand"),
            html.Div("Market Research · MENA · n = 293", className="brand-sub"),
        ], className="brand-block"),
        html.Div("Kuwait · KSA · UAE", className="topbar-right"),
    ], className="topbar"),

    html.Div([

        html.Nav([
            html.Div("Survey Questions", className="sidebar-section-title"),
            html.Div(sidebar_items(), id="q-nav-list"),
        ], className="sidebar"),

        html.Main([

            html.Div([
                kpi_card("Total Respondents", "293",  "Qualified & complete"),
                kpi_card("Markets Covered",   "3",    "Kuwait · KSA · UAE"),
                kpi_card("Survey Questions",  "17",   "Single & multi-select"),
            ], className="kpi-row"),

            filter_panel(),

            html.Div(id="question-panel"),

        ], className="main-panel"),

    ], className="body-row"),

], className="app-shell")


# ── callbacks ─────────────────────────────────────────────────────────────────

@app.callback(
    Output("active-qid", "data"),
    [Input(f"nav-{qid}", "n_clicks") for qid in Q_IDS],
    prevent_initial_call=True,
)
def set_active_q(*_):
    from dash import callback_context
    ctx = callback_context
    if not ctx.triggered:
        return dash.no_update
    return ctx.triggered[0]["prop_id"].split(".")[0].replace("nav-", "")


@app.callback(
    Output("question-panel", "children"),
    Input("active-qid",    "data"),
    Input("radio-Market",  "value"),
    Input("chk-Gender",    "value"),
    Input("chk-Age",       "value"),
)
def render_question(qid, mkt_val, gender_sel, age_sel):
    # radio returns a single string; wrap for compute_filtered
    mkt_sel = [mkt_val] if mkt_val else ["All countries"]

    q     = funnel_data.get(qid, {})
    label = q.get("label", "")
    multi = q.get("multi", False)
    note  = ("Multi-select — % of respondents; totals may exceed 100%"
             if multi else "Single choice — % of respondents")

    result = make_chart(qid, mkt_sel, gender_sel, age_sel)
    fig, n_total = result

    summary = filter_summary(mkt_sel, gender_sel, age_sel, n_total)

    return html.Div([
        html.Div([html.Span(qid, className="q-badge"),
                  html.H2(label, className="q-title")],
                 className="q-header"),
        html.Div([html.Span(note, className="chart-note"),
                  html.Span(summary, className="chart-n")],
                 className="chart-meta"),
        dcc.Graph(figure=fig, config={"displayModeBar": False},
                  className="main-chart"),
    ], className="chart-card")


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


server = app.server   # expose Flask server for gunicorn

if __name__ == "__main__":
    app.run(debug=False, port=8050)
