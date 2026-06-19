# Job-Fit Pipeline

This document defines the new **separate JD-first pipeline** for `career-ops`.

It exists because the legacy `oferta` / `pipeline` flow is optimized for:

- narrative role evaluation
- A-G reports
- optional PDF generation
- tracker updates

That flow is useful, but it is not the same as a structured job-fit workflow.

## Why this exists

The new pipeline supports a different contract:

1. ingest the JD and normalize it
2. infer ATS criteria
3. generate the ideal candidate persona
4. map actual experience against that persona
5. draft a tailored CV using selected evidence only
6. stop for human review before export

## Separation from the legacy system

This pipeline is intentionally separate.

It should **not**:

- overwrite the legacy A-G report structure
- auto-advance into PDF generation
- auto-update the applications tracker
- pretend that simple keyword heuristics are the same as evidence mapping

## Storage layout

Each job gets its own workspace:

```text
generated/jobs/<role-slug>/
  metadata.json
  status.json
  jd.md
  ats-analysis.json
  ideal-profile.json
  experience-map.json
  cv-fit-report.md
  review.md
```

## Stage model

The stage sequence is:

1. `ingest`
2. `jd_extract`
3. `ats_extract`
4. `ideal_profile`
5. `experience_map`
6. `cv_draft`
7. `manager_personalization_optional`
8. `human_review`
9. `approved_export`

`approved_export` is gated. A role cannot be treated as export-ready until `human_review` is explicitly approved.

## Current implementation status

This commit adds:

- pipeline documentation
- per-role workspace scaffolding
- stage tracking
- review-gate tracking

It does **not yet** implement:

- automatic ATS extraction
- automatic ideal-profile generation
- real embedding-based similarity scoring
- automatic CV drafting from the structured fit artifacts

Those should be built next on top of the new artifacts, rather than forced into the legacy flow.

## CLI helpers

Initialize a role workspace:

```bash
node scripts/job-fit-init.mjs --role="Role Title" --company="Company" --url="https://example.com/job"
```

Check status:

```bash
node scripts/job-fit-status.mjs --slug=company-role-title
```

Generate ATS analysis:

```bash
node scripts/job-fit-ats.mjs --slug=company-role-title
```

Generate ideal profile:

```bash
node scripts/job-fit-ideal-profile.mjs --slug=company-role-title
```

Generate experience map:

```bash
node scripts/job-fit-experience-map.mjs --slug=company-role-title
```

Generate CV draft and review artifacts:

```bash
node scripts/job-fit-cv-draft.mjs --slug=company-role-title
```

Mark a stage:

```bash
node scripts/job-fit-stage.mjs --slug=company-role-title --stage=ideal_profile --state=completed
```

Approve review:

```bash
node scripts/job-fit-stage.mjs --slug=company-role-title --approve-review --approver=human
```
