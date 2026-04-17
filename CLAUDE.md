# Career-Ops for Claude

Read `CAREER_OPS_AGENT.md` for the canonical project instructions, routing rules, onboarding flow, data contract, safety rules, and pipeline integrity requirements.

Claude-specific notes:
- This file is only a thin wrapper. Keep shared behavior in `CAREER_OPS_AGENT.md`.
- Reuse the existing modes, templates, scripts, tracker TSV flow, report generation, PDF generation, and scanner behavior. Do not create a Claude-only parallel system.
- For batch mode, use `CAREER_OPS_PROVIDER=claude ./batch/batch-runner.sh` when you want the legacy Claude CLI execution path.
- If a Claude-only instruction diverges from `CAREER_OPS_AGENT.md`, treat the canonical file as the source of truth and move the shared rule there.
