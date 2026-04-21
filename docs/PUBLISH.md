# Publishing Guide

Use this guide when you want to turn the remix workspace into a public GitHub repository.

## Before you publish

1. Replace placeholder repository URLs in `package.json`, `update-system.mjs`, and the docs.
2. Set the GitHub org or user that will own the public repo.
3. Decide whether to keep the original `.gitignore` behavior for user-layer files.
4. Confirm that `cv.md`, `config/profile.yml`, `modes/_profile.md`, `article-digest.md`, and `portals.yml` stay free of private data.

## Suggested repository name

`SillyAllen86/career-ops-remix`

## Suggested description

OpenAI/Codex-first job-search workflow template with evaluation, PDF generation, portal scanning, batch processing, and tracker support.

## Suggested README assets

- `docs/hero-banner.svg`
- `docs/architecture-overview.svg`
- `docs/og-image.svg`

## Suggested GitHub setup

- Enable Issues
- Enable Discussions if you want community support
- Add the `MIT` license
- Add repository topics such as `openai`, `codex`, `job-search`, `automation`, and `workflow`

## Final check

Run the repo test suite before pushing:

```bash
node test-all.mjs
```
