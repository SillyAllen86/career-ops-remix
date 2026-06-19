#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateIdealProfile } from '../lib/job-fit/ideal-profile.mjs';
import { updateJobFitStage } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let slug = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
}

if (!slug) {
  console.error('Usage: node scripts/job-fit-ideal-profile.mjs --slug=<role-slug>');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

const ideal = generateIdealProfile(jobDir);
updateJobFitStage(jobDir, 'ideal_profile', ideal.status === 'completed' ? 'completed' : 'blocked', ideal.notes);

console.log(`Ideal profile status: ${ideal.status}`);
console.log(`Ideal profile file: ${resolve(jobDir, 'ideal-profile.json')}`);
console.log(`Achievements: ${ideal.key_achievements.length}`);
console.log(`Skills matrix rows: ${ideal.skills_matrix.length}`);
