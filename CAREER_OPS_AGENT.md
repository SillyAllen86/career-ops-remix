# Career-Ops Agent Instructions

This repository is a public remix of Career-Ops. It keeps the workflow and file contracts intact, but removes all private candidate data so the project can be shared as an OpenAI/Codex-first template.

## Data Contract

There are two layers. Read `DATA_CONTRACT.md` for the full list.

**User Layer (customization goes here):**
- `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, `portals.yml`
- `data/*`, `reports/*`, `output/*`, `interview-prep/*`

**System Layer (shared behavior):**
- `modes/_shared.md`, `modes/*.md`
- `CAREER_OPS_AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `*.mjs` scripts, `dashboard/*`, `templates/*`, `batch/*`

**Rule:** when the user asks to customize archetypes, narrative, negotiation scripts, proof points, location policy, or comp targets, write to `modes/_profile.md` or `config/profile.yml`. Do not put user-specific content into `modes/_shared.md`.

## Update Check

On the first message of each session, run the update checker silently:

```bash
node update-system.mjs check
```

Parse the JSON output:
- `{"status": "update-available"}` -> tell the user that an update is available and that data files will not be touched
- `{"status": "up-to-date"}` -> say nothing
- `{"status": "dismissed"}` -> say nothing
- `{"status": "offline"}` -> say nothing

The user can also say `check for updates` or `update career-ops` at any time to force a check.
To rollback: `node update-system.mjs rollback`

## What This Project Is

Career-Ops is an AI-powered job-search automation system for coding agents and AI CLIs: pipeline tracking, offer evaluation, CV generation, portal scanning, batch processing, and follow-up management.

## Main Files

| File | Function |
|------|----------|
| `data/applications.md` | Application tracker |
| `data/pipeline.md` | Inbox of pending URLs |
| `data/scan-history.tsv` | Scanner dedup history |
| `portals.yml` | Query and company config |
| `templates/cv-template.html` | HTML template for CVs |
| `generate-pdf.mjs` | HTML to PDF |
| `article-digest.md` | Compact proof points from your portfolio |
| `interview-prep/story-bank.md` | Accumulated STAR+R stories across evaluations |
| `interview-prep/{company}-{role}.md` | Company-specific interview intel reports |
| `analyze-patterns.mjs` | Pattern analysis script |
| `followup-cadence.mjs` | Follow-up cadence calculator |
| `data/follow-ups.md` | Follow-up history tracker |
| `scan.mjs` | Portal scanner |
| `check-liveness.mjs` | Job posting liveness checker |
| `reports/` | Evaluation reports |

## OpenAI/Codex Notes

- Canonical agent instructions live in this file
- `AGENTS.md` is the primary Codex/OpenAI wrapper
- `CLAUDE.md` is a thin compatibility wrapper
- Batch execution goes through `scripts/run-agent.mjs`
- `CAREER_OPS_PROVIDER` selects `codex`, `openai`, or `claude`

## First Run - Onboarding

Before doing anything else, check whether the system is set up:

1. Does `cv.md` exist?
2. Does `config/profile.yml` exist?
3. Does `modes/_profile.md` exist?
4. Does `portals.yml` exist?

If any of these is missing, enter onboarding mode and help the user create the missing file from a template. Do not proceed with evaluations, scans, or batch work until the basics are in place.

## Personalization

The system is designed to be customized by the user. When the user asks to change archetypes, translate modes, adjust scoring, add companies, or modify negotiation scripts, do it directly in the user-layer files.

## Language Modes

Default modes are in `modes/` (English). Additional language-specific modes are available in `modes/de/`, `modes/fr/`, and `modes/ja/`.

## Ethical Use

- Never submit an application without user review
- Recommend against low-fit applications
- Prefer quality over quantity
- Respect recruiters' time

## Offer Verification

Never trust generic search or fetch output alone to verify whether an offer is active. Use browser automation when available:
1. Open the job URL in a browser
2. Read the rendered page content
3. Treat only pages with a title, description, and apply action as active
