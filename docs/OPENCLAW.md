# OpenClaw Workspace Notes

This repo works cleanly inside OpenClaw and across multiple machines when you keep one private mirror for personal state.

## Runtime

- `CAREER_OPS_PROVIDER=codex` is the primary path.
- Career-Ops auto-detects the Codex binary bundled inside OpenClaw.
- If auto-detection ever fails, set:

```bash
export CAREER_OPS_CODEX_BIN=/absolute/path/to/codex
```

Then verify:

```bash
CAREER_OPS_PROVIDER=codex npm run doctor
```

## Recommended remote layout

Use three remotes with different purposes:

- `origin` → upstream open-source project
- `sync` → your private mirror for personal workspace state
- `github` → optional public remix or sanitized fork

Your day-to-day `main` branch should normally track `sync/main`, not `origin/main`, because personal state and private workflow commits do not belong on upstream.

## Multi-machine workflow

On the machine where you make changes:

```bash
git checkout main
git pull --ff-only sync main
git push sync main
```

On another machine:

```bash
git checkout main
git pull --ff-only sync main
```

Keep `origin` for upstream updates and rebases, not for your personal working state.

## Public/private split

- Personal workflow, machine notes, private automation, and anything with local state should stay on `sync`.
- Only push sanitized changes to `github`.
- Never push secrets, portal credentials, session state, or personal data to the public remote.
