import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const JOB_FIT_STAGES = [
  'ingest',
  'jd_extract',
  'ats_extract',
  'ideal_profile',
  'experience_map',
  'cv_draft',
  'manager_personalization_optional',
  'human_review',
  'approved_export',
];

export const TERMINAL_STAGE_STATES = new Set(['completed', 'skipped', 'blocked']);

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createJobFitWorkspace({
  root,
  role,
  company = '',
  url = '',
  source = 'manual',
  location = '',
  seniority = '',
  notes = '',
  jdText = '',
}) {
  const slugBase = [company, role].filter(Boolean).join(' ');
  const slug = slugify(slugBase || role || 'job-fit-role');
  const jobDir = resolve(root, 'generated', 'jobs', slug);
  mkdirSync(jobDir, { recursive: true });

  const metadata = {
    role_slug: slug,
    role,
    company,
    url,
    source,
    location,
    seniority,
    created_at: new Date().toISOString(),
    master_cv_path: 'cv.md',
    experience_bank_path: 'data/experience-bank.md',
    notes,
  };

  const status = {
    role_slug: slug,
    workflow: 'job-fit-pipeline-v1',
    created_at: metadata.created_at,
    updated_at: metadata.created_at,
    review_gate: {
      required_before_export: true,
      approved: false,
      approved_at: null,
      approved_by: null,
      notes: '',
    },
    stages: Object.fromEntries(
      JOB_FIT_STAGES.map((stage, index) => [
        stage,
        {
          order: index + 1,
          state: stage === 'ingest' ? 'completed' : 'pending',
          updated_at: metadata.created_at,
          notes: stage === 'ingest' ? 'Job URL / role intake recorded.' : '',
        },
      ]),
    ),
  };

  writeJsonIfMissing(resolve(jobDir, 'metadata.json'), metadata);
  writeJsonIfMissing(resolve(jobDir, 'status.json'), status);
  writeTextIfMissing(resolve(jobDir, 'jd.md'), defaultJdMarkdown(metadata, jdText));
  writeJsonIfMissing(resolve(jobDir, 'ats-analysis.json'), defaultAtsAnalysis(metadata));
  writeJsonIfMissing(resolve(jobDir, 'ideal-profile.json'), defaultIdealProfile(metadata));
  writeJsonIfMissing(resolve(jobDir, 'experience-map.json'), defaultExperienceMap(metadata));
  writeTextIfMissing(resolve(jobDir, 'cv-fit-report.md'), defaultCvFitReport(metadata));
  writeTextIfMissing(resolve(jobDir, 'review.md'), defaultReviewMarkdown(metadata));

  return { slug, jobDir, metadataPath: resolve(jobDir, 'metadata.json'), statusPath: resolve(jobDir, 'status.json') };
}

export function loadJobFitStatus(jobDir) {
  const statusPath = resolve(jobDir, 'status.json');
  if (!existsSync(statusPath)) {
    throw new Error(`Missing status.json in ${jobDir}`);
  }
  return JSON.parse(readFileSync(statusPath, 'utf8'));
}

export function saveJobFitStatus(jobDir, status) {
  status.updated_at = new Date().toISOString();
  writeFileSync(resolve(jobDir, 'status.json'), `${JSON.stringify(status, null, 2)}\n`);
}

export function updateJobFitStage(jobDir, stage, state, notes = '') {
  const status = loadJobFitStatus(jobDir);
  if (!status.stages?.[stage]) {
    throw new Error(`Unknown stage "${stage}". Expected one of: ${JOB_FIT_STAGES.join(', ')}`);
  }
  status.stages[stage].state = state;
  status.stages[stage].updated_at = new Date().toISOString();
  if (notes) status.stages[stage].notes = notes;
  saveJobFitStatus(jobDir, status);
  return status;
}

export function approveJobFitReview(jobDir, approver = 'human', notes = '') {
  const status = loadJobFitStatus(jobDir);
  status.review_gate.approved = true;
  status.review_gate.approved_at = new Date().toISOString();
  status.review_gate.approved_by = approver;
  status.review_gate.notes = notes;
  status.stages.human_review.state = 'completed';
  status.stages.human_review.updated_at = status.review_gate.approved_at;
  if (notes) status.stages.human_review.notes = notes;
  saveJobFitStatus(jobDir, status);
  return status;
}

export function getNextRequiredStage(status) {
  for (const stage of JOB_FIT_STAGES) {
    if (stage === 'approved_export' && !status.review_gate?.approved) {
      return {
        stage: 'human_review',
        reason: 'Export is gated until a human approves the recommended CV variant and controversial edits.',
      };
    }
    const stageState = status.stages?.[stage]?.state;
    if (!TERMINAL_STAGE_STATES.has(stageState)) {
      return {
        stage,
        reason: status.stages?.[stage]?.notes || '',
      };
    }
  }
  return { stage: null, reason: 'All stages are complete.' };
}

function writeJsonIfMissing(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  }
}

function writeTextIfMissing(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, value);
  }
}

function defaultJdMarkdown(metadata, jdText) {
  const body = jdText?.trim() || '<Paste the normalized job description here>';
  return `# Job Description\n\n- Company: ${metadata.company || '<Company>'}\n- Role: ${metadata.role || '<Role>'}\n- Source URL: ${metadata.url || '<URL>'}\n- Location: ${metadata.location || '<Unknown>'}\n- Seniority: ${metadata.seniority || '<Unknown>'}\n\n## Source Notes\n\n- Original source: ${metadata.source}\n- Keep this file as the normalized JD source of truth for this role.\n\n## Normalized JD\n\n${body}\n`;
}

function defaultAtsAnalysis(metadata) {
  return {
    role_slug: metadata.role_slug,
    status: 'pending',
    extracted_from: 'jd.md',
    core_responsibilities: [],
    must_have_skills: {
      hard: [],
      soft: [],
      domain: [],
    },
    nice_to_have_skills: [],
    tools_and_stack: [],
    ats_keywords: [],
    notes: 'Populate after analyzing the JD and visible portal tags.',
  };
}

function defaultIdealProfile(metadata) {
  return {
    role_slug: metadata.role_slug,
    status: 'pending',
    title: metadata.role || '',
    summary: '',
    background_years: '',
    domain_background: '',
    key_achievements: [],
    skills_matrix: [],
    notes: 'Create the internal hiring-manager persona for this role before tailoring the CV.',
  };
}

function defaultExperienceMap(metadata) {
  return {
    role_slug: metadata.role_slug,
    status: 'pending',
    similarity_method: 'tbd',
    matched_roles: [],
    matched_projects: [],
    recommended_experience_subset: [],
    coverage_by_dimension: [],
    high_weight_gaps: [],
    controversial_edits: [],
    notes: 'Store ranked evidence, gaps, and reframing guidance here.',
  };
}

function defaultCvFitReport(metadata) {
  return `# CV Fit Report\n\n## Role\n\n- Company: ${metadata.company || '<Company>'}\n- Role: ${metadata.role || '<Role>'}\n\n## Section-to-JD Trace\n\n| CV Section | Why It Exists | JD Requirement Targeted | Evidence Confidence | Notes |\n|------------|---------------|-------------------------|---------------------|-------|\n| Summary | TBD | TBD | TBD | |\n\n## Selected Bullets\n\n| Experience Bullet | JD Requirement | Why Included | Confidence |\n|-------------------|----------------|--------------|------------|\n| TBD | TBD | TBD | TBD |\n\n## Excluded / Controversial Items\n\n| Item | Why Excluded or Flagged | Suggested Reframe |\n|------|--------------------------|-------------------|\n| TBD | TBD | TBD |\n`;
}

function defaultReviewMarkdown(metadata) {
  return `# Human Review Gate\n\n## Role\n\n- Company: ${metadata.company || '<Company>'}\n- Role: ${metadata.role || '<Role>'}\n\n## Review Checklist\n\n- [ ] ATS analysis looks accurate\n- [ ] Ideal profile is believable and useful\n- [ ] Experience mapping reflects actual evidence\n- [ ] Tailored CV does not overclaim\n- [ ] Controversial edits are explicitly listed\n- [ ] Export approved\n\n## Reviewer Notes\n\n<Add approval notes or requested changes here>\n`;
}
