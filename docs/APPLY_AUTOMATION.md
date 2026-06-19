# Assisted Apply Architecture

## Goal

The old Playwright probes were useful for inspection, but they were not a reliable application engine. The new apply subsystem turns application automation into a portal-aware assisted flow with explicit manual checkpoints and no-submit defaults.

## Core separation

The new architecture splits browser automation into three concerns:

1. portal access + session management
2. apply automation
3. application status sync

These are separate commands and separate modules.

## Files

```text
apply-assist.mjs                 # assisted apply runner
status-sync.mjs                  # authenticated status sync (proposal-only)
lib/apply/config.mjs             # portal/job metadata loader
lib/apply/session-manager.mjs    # local persistent browser state
lib/apply/logger.mjs             # JSONL run logger + screenshots + HTML
lib/apply/form-targeting.mjs     # visible active-form targeting helpers
lib/apply/types.mjs              # run modes, checkpoint reasons, result helpers
lib/apply/adapters/base.mjs      # reusable portal adapter base
lib/apply/adapters/workday.mjs   # first real ATS adapter
lib/apply/adapters/successfactors.mjs
runtime/sessions/                # gitignored local browser state
runtime/runs/                    # gitignored run logs, screenshots, snapshots
```

## Portal metadata

Add assisted-apply metadata under `apply:` in `portals.yml`.

```yaml
apply:
  portals:
    - portal_id: takeda-workday
      ats_type: workday
      login_entry_url: https://takeda.wd3.myworkdayjobs.com/en-US/TakedaCareers/login
      profile_url: https://takeda.wd3.myworkdayjobs.com/en-US/TakedaCareers/userHome
      status_page_url: https://takeda.wd3.myworkdayjobs.com/en-US/TakedaCareers/userHome/applications
      job_apply_entry_mode: role_page_click
      requires_account_before_form: true
      supports_resume_autofill: true
      supports_guest_apply: false
      session_storage_key: takeda-workday-pravin

  jobs:
    - company: Takeda
      job_url: https://www.takeda.com/careers/job/example
      apply_url: https://takeda.wd3.myworkdayjobs.com/en-US/TakedaCareers/job/example/apply
      portal_id: takeda-workday
      routing_mode: role_page_click
```

Portal metadata and job routing data are intentionally separate.

## Run modes

Supported run modes:

- `inspect_only`
- `fill_until_manual_checkpoint`
- `fill_until_review`
- `never_submit`

Safe default behavior:

- `mode=fill_until_review`
- `never_submit=true`

In practice, the runner stops at the first legitimate manual checkpoint or at final review.

## Manual checkpoint reasons

The runner can return these first-class manual checkpoints:

- `mfa`
- `email_code`
- `captcha`
- `salary_input`
- `work_authorization`
- `notice_period`
- `relocation`
- `final_review`

This is intentional. The system does not try to bypass them.

## Active-form targeting

Generic `fillFirst()` probing was replaced by field targeting that prefers:

- visible elements only
- enabled fields only
- nearest active-form grouping
- duplicate responsive DOM deduplication
- ranking by label / aria / name / id / placeholder
- avoidance of hidden or unrelated search/filter inputs

## Session persistence

Browser state is kept locally under `runtime/sessions/` using a persistent Playwright context per portal/account. This helps with:

- avoiding repeated login friction
- resuming authenticated portal state
- using saved sessions for later status sync

Current limitation: storage is local-only and gitignored, but not encrypted by this repo.

## Structured logging

Every run writes machine-readable JSONL plus artifacts under `runtime/runs/<timestamp>-<portal>-<kind>/`.

Each event includes:

- timestamp
- portal
- job URL
- current step
- page title
- page URL
- key visible markers
- screenshot path
- HTML snapshot path
- detected error
- checkpoint reason

## Commands

Assisted apply:

```bash
node apply-assist.mjs --portal-id takeda-workday --job-url https://... --mode fill_until_review
```

Status sync:

```bash
node status-sync.mjs --portal-id takeda-workday
```

Status sync is proposal-only. It does not write `data/applications.md`.

## Migration note

The old Bayer probe scripts remain as debugging artifacts, but they are no longer the intended architecture. New work should go into portal adapters, the form-targeting helpers, and the separate status-sync runner rather than adding more one-off probes.
