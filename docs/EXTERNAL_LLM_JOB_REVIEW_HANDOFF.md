# External LLM Job Review Handoff

Use this when asking a separate LLM chat to review a job fit, CV tailoring, cover letter angle, or application strategy outside this workspace.

## What to Provide to the External LLM

### Minimum package for one job review

Provide these files or paste their contents:

1. `career-ops/cv.md`
   - Master CV and main public-facing source of truth.
   - Best file for general review, role-fit analysis, and suggested CV changes.

2. The job description for the role.
   - If it already exists in this repo, use the relevant file:
     - `career-ops/Head of IT Software Solutions (m:w:d).txt`
     - `career-ops/Scientific Digital Product Lead, Assay Workflows.txt`
     - `career-ops/Sub-chapter Lead, Marketing Vault and Product Hub.txt`
   - If the job is new, paste the full job description text into the external chat.

3. `career-ops/data/experience-bank.md`
   - Context for what can be pulled into role-specific CVs.
   - Important because it separates reusable CV claims from proof points, sensitive context, and interview ammunition.

4. `career-ops/config/profile.yml`
   - Target roles, positioning, location, compensation notes, and candidate metadata.
   - Redact phone/email/salary if you do not want to share personal details with the external LLM.

### Add these when asking for pipeline or application advice

5. `career-ops/data/pipeline.md`
   - Current application pipeline/status context.

6. `career-ops/data/applications.md`
   - Application history and notes.

7. Existing generated application note, if the role already has one:
   - `career-ops/output/application-*.md`

### Add these when asking to review a generated CV

Provide the generated role-specific CV or PDF in addition to the source files:

- `career-ops/output/cv-pravin-sail-<company-role-date>.pdf`
- `career-ops/output/cv-pravin-sail-<company-role-date>.html`
- `rendercv-theme-lab/generated/roles/<role-slug>/cv.md`
- `rendercv-theme-lab/generated/roles/<role-slug>/cv.normalized.md`
- `rendercv-theme-lab/generated/roles/<role-slug>/rendercv/input.yaml`

For text review, prefer the Markdown files. For layout/design review, provide the PDF or HTML.

## What Not to Provide Unless Needed

Do not provide these by default:

- `.git/`, `node_modules/`, `.DS_Store`, generated caches, or dependency lockfiles.
- `career-ops/output/` as a whole. It contains many past generated artifacts; send only the relevant role output.
- `rendercv-theme-lab/generated/` as a whole. Send only the specific role folder if needed.
- Any confidential internal details, salary expectations, phone number, or email unless the external LLM needs them.

## Prompt to Paste into the External LLM

```text
You are reviewing my fit for a specific job and helping improve my CV/application strategy.

Use the attached/pasted files:
- Master CV: cv.md
- Experience bank: data/experience-bank.md
- Candidate profile: config/profile.yml
- Job description: [paste or attach]
- Optional generated role CV/application note: [attach if available]

Please produce:
1. Role-fit verdict: strong fit / partial fit / weak fit, with reasoning.
2. Top 8-12 job requirements and where my CV currently proves or fails to prove them.
3. Missing or weak evidence that should be strengthened.
4. Suggested changes to cv.md, grouped by section.
5. Suggested additions from experience-bank.md, only where defensible.
6. Claims that sound inflated, risky, vague, confidential, or unsupported.
7. ATS keywords that should be added naturally.
8. A short positioning summary for this role.
9. Optional cover letter or recruiter message angle.

Important:
- Do not invent facts.
- Mark every suggested change as one of:
  - update master CV
  - add to experience bank
  - role-specific only
  - interview prep only
  - do not use / risky
- If you suggest a CV edit, quote the old wording and provide replacement wording.
```

## Files to Update After External LLM Feedback

Update only the source file that matches the type of feedback.

### Master CV changes

Update:

- `career-ops/cv.md`

Use for:

- Better summary wording.
- Stronger reusable bullets.
- Safer or clearer claims.
- Skills/systems wording that should apply across most roles.
- Removing vague, inflated, or repetitive content.

Then run:

```sh
cd /Users/pravinsail/selfhosted/career/career-ops
npm run cv:validate
```

### Experience-bank changes

Update:

- `career-ops/data/experience-bank.md`

Use for:

- Proof points that are useful but too detailed for the default CV.
- Sensitive or role-specific evidence.
- Interview examples.
- Role-overlay bullets that should only appear for matching jobs.

### Profile and targeting changes

Update:

- `career-ops/config/profile.yml`

Use for:

- Target role changes.
- Headline/positioning changes.
- Location, compensation, or work-arrangement constraints.
- Candidate metadata.

### Pipeline/application tracking changes

Update:

- `career-ops/data/pipeline.md`
- `career-ops/data/applications.md`

Use for:

- Status updates.
- New applications.
- Follow-up notes.
- Interview outcomes.
- Recruiter/contact notes.

### Job description storage

For new roles, add the job description as a text file:

- `career-ops/jds/<company-role>.txt`

Current root-level job description files can remain where they are, but new ones should go under `career-ops/jds/` to keep future reviews cleaner.

### Role-specific generated CV changes

Prefer updating the source files first:

- `career-ops/cv.md`
- `career-ops/data/experience-bank.md`
- `career-ops/config/profile.yml`

Then regenerate a role-specific CV instead of manually editing generated files.

Generated files that may be overwritten:

- `career-ops/output/*.pdf`
- `career-ops/output/*.html`
- `rendercv-theme-lab/generated/roles/<role-slug>/*`

Only manually edit generated files for a one-off application when you know you do not need the change to persist.

## Practical Update Flow

1. Save the external LLM's comments.
2. Classify each comment:
   - master CV
   - experience bank
   - profile/targeting
   - role-specific generated output
   - pipeline/application tracking
   - reject
3. Update source files first.
4. Validate:

```sh
cd /Users/pravinsail/selfhosted/career/career-ops
npm run cv:validate
```

5. If creating a tailored role CV:

```sh
cd /Users/pravinsail/selfhosted/career/career-ops
npm run cv:tailor -- --role="<role title>" --focus="<important keywords>"
```

6. Export/render from `rendercv-theme-lab` only after the source CV content is stable.

## Short Rule

External LLM reviews should produce recommendations, not direct edits. The durable edit targets are:

- `career-ops/cv.md`
- `career-ops/data/experience-bank.md`
- `career-ops/config/profile.yml`
- `career-ops/data/pipeline.md`
- `career-ops/data/applications.md`
- `career-ops/jds/<company-role>.txt`

Everything under `output/` or `rendercv-theme-lab/generated/` should be treated as generated unless there is a deliberate one-off reason to edit it manually.
