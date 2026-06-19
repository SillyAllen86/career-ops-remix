#!/usr/bin/env node

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { JOB_FIT_STAGES, approveJobFitReview, updateJobFitStage } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const options = {
  slug: '',
  stage: '',
  state: '',
  notes: '',
  approveReview: false,
  approver: 'human',
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) options.slug = arg.slice('--slug='.length);
  else if (arg.startsWith('--stage=')) options.stage = arg.slice('--stage='.length);
  else if (arg.startsWith('--state=')) options.state = arg.slice('--state='.length);
  else if (arg.startsWith('--notes=')) options.notes = arg.slice('--notes='.length);
  else if (arg === '--approve-review') options.approveReview = true;
  else if (arg.startsWith('--approver=')) options.approver = arg.slice('--approver='.length);
}

if (!options.slug) {
  console.error('Usage: node scripts/job-fit-stage.mjs --slug=<role-slug> [--stage=<stage> --state=<pending|in_progress|completed|blocked|skipped>] [--approve-review]');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', options.slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

if (options.approveReview) {
  const status = approveJobFitReview(jobDir, options.approver, options.notes);
  console.log(`Human review approved for ${options.slug}`);
  console.log(`Approved at: ${status.review_gate.approved_at}`);
  process.exit(0);
}

if (!options.stage || !options.state) {
  console.error(`Expected --stage and --state. Valid stages: ${JOB_FIT_STAGES.join(', ')}`);
  process.exit(1);
}

const status = updateJobFitStage(jobDir, options.stage, options.state, options.notes);
console.log(`Updated ${options.stage} -> ${options.state}`);
if (status.stages?.[options.stage]?.notes) {
  console.log(`Notes: ${status.stages[options.stage].notes}`);
}
