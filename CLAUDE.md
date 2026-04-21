# Career-Ops for Claude

Read `CAREER_OPS_AGENT.md` for the canonical project instructions, routing rules, onboarding flow, data contract, safety rules, and pipeline integrity requirements.

Claude-specific notes:
- This file is only a thin wrapper. Keep shared behavior in `CAREER_OPS_AGENT.md`.
- Reuse the existing modes, templates, scripts, tracker TSV flow, report generation, PDF generation, and scanner behavior. Do not create a Claude-only parallel system.
- For batch mode, use `CAREER_OPS_PROVIDER=claude ./batch/batch-runner.sh` when you want the legacy Claude CLI execution path.
- If a Claude-only instruction diverges from `CAREER_OPS_AGENT.md`, treat the canonical file as the source of truth and move the shared rule there.

## Data Contract

The user-layer and system-layer split is defined in `CAREER_OPS_AGENT.md` and `DATA_CONTRACT.md`.

## Update Check

Use `node update-system.mjs check` to look for updates. The checker must not touch user files.

## Ethical Use

Never submit an application without user review. Prefer fewer, better applications over mass submissions.

## Offer Verification

Use browser automation when available to verify live job pages. Do not trust generic fetch output alone.

## Canonical States

Tracker and status normalization rules live in `templates/states.yml` and the tracker scripts.

## TSV Format

Tracker additions use TSV files under `batch/tracker-additions/` and are merged by `merge-tracker.mjs`.

## First Run

Make sure `cv.md`, `config/profile.yml`, `modes/_profile.md`, and `portals.yml` exist before starting evaluations.

## Onboarding

If any user-layer file is missing, help the user create the missing template before proceeding.
