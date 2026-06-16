# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo contains independent projects:

1. **Browser games** — standalone HTML files (no build tools, no server needed)
2. **Clinic EHR** — full-stack medical records system (`clinic-ehr/`)
3. **Research workflow** — structured research workflow definition (`workflows/`)

## Personal Assistant

Use `/pa <your question>` to invoke the personal assistant agent for any general question — research, lookups, comparisons, calculations, planning, or analysis. This is a global command (works in any folder), defined in `~/.claude/commands/pa.md`.

Example: `/pa what are the best free tools for recording gameplay on Mac?`

## Git Workflow

After completing any meaningful unit of work — a new feature, a bug fix, a gameplay tweak — commit and push to GitHub immediately so no progress is ever lost.

```bash
git add <changed files>
git commit -m "short, specific description of what changed and why"
git push
```

Commit message rules:
- Use present tense, imperative mood: "add reload animation" not "added reload animation"
- Be specific about what changed: "increase rusher speed to 160 and cap spawn interval at 0.4s" not "tweak values"
- One logical change per commit — don't bundle unrelated edits

Push after every commit. This is a hard rule, not optional.

## Directory Layout

```
dj-prototype.html     — AI DJ prototype with auto-mix and transition engine
clinic-ehr/           — full-stack clinic EHR (React + Node.js + PostgreSQL)
workflows/            — reusable AI workflow definitions
  research-report.md  — 5-phase workflow: clarify → research → organize → write → QA
```

## Research Workflow

`workflows/research-report.md` defines the standard process for any research task. Follow it in full when the user asks to research a topic or write a report:

1. **Clarify** — ask scope, audience, angle, and output preferences before starting
2. **Research** — 4–6 searches, minimum 5 credible sources (≥2 research-based)
3. **Organize** — sort findings into: core facts / nuance / debate / takeaways / gaps
4. **Write** — use the defined report template; save to a file agreed with user
5. **QA** — verify every claim is cited, no undefined jargon, file saved correctly

Never skip to research without completing Phase 1 clarification first.

