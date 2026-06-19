# Career-Ops for Codex / OpenAI

Read `CAREER_OPS_AGENT.md` for the canonical project instructions, routing, onboarding flow, safety rules, and pipeline integrity requirements.

This repository is OpenAI-first:
- Use Codex / OpenAI as the primary documented path.
- Reuse the existing modes, scripts, templates, tracker TSV flow, report generation, PDF generation, and scanner behavior. Do not create a parallel second system.
- Keep this wrapper minimal: include only the OpenAI-specific deltas and only the fields needed for this path.
- Keep all user-specific customization in `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, or `portals.yml` — never in `modes/_shared.md`.
- Never submit an application on the user's behalf.
- The reusable CV and assessment decision rules live in `CAREER_OPS_AGENT.md`; do not duplicate them here.

Provider notes:
- Batch execution runs through `scripts/run-agent.mjs` and defaults to `CAREER_OPS_PROVIDER=codex`.
- Claude support still exists through `CLAUDE.md` and `CAREER_OPS_PROVIDER=claude` where available.
- For Codex-specific setup and examples, see `docs/CODEX.md`.
