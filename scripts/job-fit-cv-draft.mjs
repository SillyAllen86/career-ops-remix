#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCvDraft } from '../lib/job-fit/cv-draft.mjs';
import { updateJobFitStage } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let slug = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
}

if (!slug) {
  console.error('Usage: node scripts/job-fit-cv-draft.mjs --slug=<role-slug>');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

const result = generateCvDraft(jobDir, ROOT);
updateJobFitStage(jobDir, 'cv_draft', 'completed', result.notes);
updateJobFitStage(jobDir, 'manager_personalization_optional', 'skipped', 'No hiring-manager profile text or lawful public profile source was supplied.');
updateJobFitStage(jobDir, 'human_review', 'pending', 'Review the ranked evidence, fit report, and controversial edits before any export.');

console.log(`CV draft status: ${result.status}`);
console.log(`Draft file: ${result.draft_path}`);
console.log(`Fit report: ${result.fit_report_path}`);
console.log(`Review file: ${result.review_path}`);
