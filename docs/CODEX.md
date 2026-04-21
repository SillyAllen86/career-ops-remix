# Codex / OpenAI Setup

Career-Ops Remix treats Codex / OpenAI as the primary documented runtime.

## Entry points

- `AGENTS.md` - primary wrapper for Codex/OpenAI
- `CAREER_OPS_AGENT.md` - canonical shared instructions
- `CLAUDE.md` - supported wrapper for Claude users

The key rule: Codex must reuse the existing modes, templates, scripts, tracker flow, report generation, PDF generation, and scanner behavior. Do not introduce a parallel automation layer.

## Prerequisites

- Codex CLI available as `codex`
- Node.js 18+
- Playwright Chromium installed
- Optional: Go 1.21+ for the dashboard
- Optional: Claude CLI if you want the Claude compatibility path

## Install

```bash
npm install
npx playwright install chromium
CAREER_OPS_PROVIDER=codex npm run doctor
```

## Recommended starting prompts

- `Evaluate this job URL with Career-Ops Remix and run the full pipeline.`
- `Scan my configured portals for new roles that match my profile.`
- `Generate the tailored ATS PDF for this role using Career-Ops Remix.`
- `Batch-process the offers in batch/batch-input.tsv using provider codex.`

## Routing map

| User intent | Files to read |
|-------------|---------------|
| Raw JD text or job URL | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/auto-pipeline.md` |
| Single evaluation only | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/oferta.md` |
| Multiple offers | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/ofertas.md` |
| Portal scan | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/scan.md` |
| PDF generation | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/pdf.md` |
| Live application help | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/apply.md` |
| Pipeline inbox processing | `CAREER_OPS_AGENT.md` + `modes/_shared.md` + `modes/pipeline.md` |
| Tracker status | `CAREER_OPS_AGENT.md` + `modes/tracker.md` |
| Deep company research | `CAREER_OPS_AGENT.md` + `modes/deep.md` |
| Training / certification review | `CAREER_OPS_AGENT.md` + `modes/training.md` |
| Project evaluation | `CAREER_OPS_AGENT.md` + `modes/project.md` |

## Batch runtime selection

```bash
./batch/batch-runner.sh --provider codex
./batch/batch-runner.sh --provider openai
./batch/batch-runner.sh --provider claude
```

`openai` currently routes through the Codex CLI with `--provider openai`. This is the supported OpenAI path in this repository today.

## Behavioral rules

- Treat raw JD text or a job URL as the full auto-pipeline path unless the user asks for evaluation only
- Keep personalization in `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, or `portals.yml`
- Never rely on generic web fetch alone when browser automation is available for job verification
- Never submit an application for the user
- Never add new tracker rows directly to `data/applications.md`; use the TSV addition flow and `merge-tracker.mjs`

## Verification

```bash
npm run doctor
npm run verify
```
