# Career-Ops for Claude

Read `CAREER_OPS_AGENT.md` for the canonical project instructions, routing rules, onboarding flow, data contract, safety rules, and pipeline integrity requirements.

Claude-specific notes:
- This file is only a thin wrapper. Keep shared behavior in `CAREER_OPS_AGENT.md`.
- Keep this wrapper minimal: include only Claude-specific deltas and only the fields needed for Claude to follow the canonical workflow.
- Reuse the existing modes, scripts, tracker TSV flow, report generation, and scanner behavior. Do not create a Claude-only parallel system.
- For CV generation, keep `cv.md` as the unchanged master profile and generate role-specific outputs from `data/experience-bank.md` via `scripts/cv-tailor.mjs`.
- Generated role CVs should live under `generated/roles/<role-slug>/` and must not overwrite the master `cv.md`.
- Career-Ops stops at role-specific `cv.md`. If JSON, YAML, preview, or PDF output is needed, switch to the sibling `rendercv-theme-lab` workspace and run its RenderCV pipeline.
- The reusable CV and assessment decision rules live in `CAREER_OPS_AGENT.md`; treat that file as canonical and keep this wrapper thin.
- For batch mode, use `CAREER_OPS_PROVIDER=claude ./batch/batch-runner.sh` when you want the legacy Claude CLI execution path.
- If a Claude-only instruction diverges from `CAREER_OPS_AGENT.md`, treat the canonical file as the source of truth and move the shared rule there.
