#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateExperienceMap } from '../lib/job-fit/experience-map.mjs';
import { updateJobFitStage } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let slug = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
}

if (!slug) {
  console.error('Usage: node scripts/job-fit-experience-map.mjs --slug=<role-slug>');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

const mapped = generateExperienceMap(jobDir, ROOT);
updateJobFitStage(jobDir, 'experience_map', mapped.status === 'completed' ? 'completed' : 'blocked', mapped.notes);

console.log(`Experience map status: ${mapped.status}`);
console.log(`Experience map file: ${resolve(jobDir, 'experience-map.json')}`);
console.log(`Matched roles: ${mapped.matched_roles.length}`);
console.log(`Recommended evidence items: ${mapped.recommended_experience_subset.length}`);
console.log(`High-weight gaps: ${mapped.high_weight_gaps.length}`);
