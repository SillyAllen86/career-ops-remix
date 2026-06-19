# Mode: job-fit-pipeline — Structured JD-First Fit Workflow

This is a **separate pipeline** from the legacy A-G evaluation flow. Do not replace `oferta`, `pipeline`, `pdf`, or the existing tracker/report system with this mode.

Use this mode when the user wants:

- a JD-first tailoring workflow
- ATS extraction before CV drafting
- an ideal candidate persona
- explicit experience-to-JD mapping
- a human review gate before export or application-facing use

## Workflow Stages

1. `ingest`
   - Inputs:
     - job URL
     - master CV (`cv.md`)
     - experience bank (`data/experience-bank.md`)
   - Create a per-role workspace in `generated/jobs/<role-slug>/`

2. `jd_extract`
   - Fetch the job page HTML if possible
   - Extract / normalize:
     - company
     - role title
     - description
     - requirements
     - preferred skills
     - location
     - level / seniority
     - travel
     - visible portal tags
   - Save the normalized JD in `jd.md`

3. `ats_extract`
   - Output a structured analysis in `ats-analysis.json`:
     - core responsibilities
     - must-have hard skills
     - must-have soft skills
     - must-have domain skills
     - nice-to-have skills
     - explicit tools / tech stack
     - ATS keywords with weights `1-5`

4. `ideal_profile`
   - Create the hiring-manager persona in `ideal-profile.json`:
     - title
     - 2-3 line summary
     - years / domain background
     - 8-12 key achievements
     - skills matrix with proficiency + relevance

5. `experience_map`
   - Compare the ideal profile against the master CV and experience bank
   - Save structured output in `experience-map.json`:
     - closest matching roles
     - closest matching bullets
     - closest matching projects
     - high-weight gaps
     - allowed reframes
     - controversial edits
     - dimension-by-dimension coverage

6. `cv_draft`
   - Draft a job-specific CV from selected evidence only
   - Save:
     - tailored CV draft
     - `cv-fit-report.md` explaining why each section exists and which JD requirement it targets

7. `manager_personalization_optional`
   - Only if the user supplies:
     - a hiring manager URL
     - pasted profile text
     - or another lawful/public source
   - Do not default to LinkedIn scraping
   - Suggest:
     - 2-3 micro-tweaks
     - short outreach message

8. `human_review`
   - Stop here by default
   - Show:
     - ranking of experience vs ideal profile
     - recommended CV variant
     - controversial edits
   - Do not export PDF or advance to portal-facing output until approval is explicit

9. `approved_export`
   - Only after the human review gate is approved
   - This stage may hand off to RenderCV or other downstream export workflows

## Artifacts

All role-specific artifacts live in:

`generated/jobs/<role-slug>/`

Expected files:

- `metadata.json`
- `status.json`
- `jd.md`
- `ats-analysis.json`
- `ideal-profile.json`
- `experience-map.json`
- `cv-fit-report.md`
- `review.md`

## Commands

Initialize a job-fit workspace:

```bash
node scripts/job-fit-init.mjs --role="Role Title" --company="Company" --url="https://example.com/job"
```

Check workflow status:

```bash
node scripts/job-fit-status.mjs --slug=company-role-title
```

Generate ATS analysis from `jd.md`:

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

Generate CV draft + review artifacts:

```bash
node scripts/job-fit-cv-draft.mjs --slug=company-role-title
```

Update a stage manually:

```bash
node scripts/job-fit-stage.mjs --slug=company-role-title --stage=ats_extract --state=completed --notes="ATS analysis populated"
```

Approve the human review gate:

```bash
node scripts/job-fit-stage.mjs --slug=company-role-title --approve-review --approver=human
```

## Guardrails

- This mode does **not** replace the existing A-G evaluation flow.
- This mode does **not** automatically write to `data/applications.md`.
- This mode does **not** automatically generate a PDF.
- This mode does **not** assume LinkedIn scraping is allowed.
- This mode exists to produce better-fit evidence before the user decides whether to export or apply.
