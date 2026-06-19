# Setup Guide

## Recommended runtime

Career-Ops is now documented OpenAI-first:
- Primary path: Codex / OpenAI via `AGENTS.md`
- Supported path: Claude via `CLAUDE.md`

Both reuse the same checked-in modes, templates, scripts, tracker flow, report generation, PDF generation, and scanner behavior.

## Prerequisites

- Codex CLI for the primary path (`codex` in PATH)
- Node.js 18+
- Playwright Chromium installed for PDF generation and browser-based job verification
- Optional: Claude CLI if you want to keep the Claude runtime path
- Optional: Go 1.21+ for the dashboard TUI

If you run Career-Ops from OpenClaw, the repo can use OpenClaw's bundled Codex binary automatically. You do not need a separate global Codex install unless you want one for direct shell usage.

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/santifer/career-ops.git
cd career-ops
npm install
npx playwright install chromium
```

### 2. Configure your profile

```bash
cp config/profile.example.yml config/profile.yml
```

Edit `config/profile.yml` with your personal details, target roles, narrative, and proof points.

### 3. Add your CV

Create `cv.md` in the project root with your full CV in markdown format. This is the source of truth for all evaluations and PDFs.

Optional: create `article-digest.md` with detailed proof points from projects, articles, or case studies.

### 4. Configure portals

```bash
cp templates/portals.example.yml portals.yml
```

Edit `portals.yml`:
- Update `title_filter.positive` for your target roles
- Add or disable tracked companies
- Adjust `search_queries` for your preferred boards and markets

### 5. Choose provider and verify

```bash
CAREER_OPS_PROVIDER=codex npm run doctor
```

Supported values: `codex`, `openai`, `claude`.

Optional override if detection needs help:

```bash
export CAREER_OPS_CODEX_BIN=/absolute/path/to/codex
```

### 6. Start using the agent

Primary path:

```bash
codex
```

Claude path still works where available:

```bash
claude
```

Then paste a job offer URL or description. Career-Ops will route into the existing mode workflow and generate a report, tailored PDF, and tracker addition when applicable.

## Batch execution

```bash
./batch/batch-runner.sh --provider codex
```

Other supported values:

```bash
./batch/batch-runner.sh --provider openai
./batch/batch-runner.sh --provider claude
```

The batch runner still preserves:
- sequential report numbering
- resumable `batch-state.tsv`
- retries and logs
- tracker TSV generation + `merge-tracker.mjs`
- the same report/PDF output contracts

## Verify setup

```bash
npm run doctor
npm run verify
```

## Optional dashboard

```bash
cd dashboard
go build -o career-dashboard .
./career-dashboard --path ..
```
