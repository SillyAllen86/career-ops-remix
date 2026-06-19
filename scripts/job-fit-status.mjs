#!/usr/bin/env node

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readdirSync } from 'node:fs';
import { getNextRequiredStage, loadJobFitStatus } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let slug = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
}

if (!slug) {
  console.error('Usage: node scripts/job-fit-status.mjs --slug=<role-slug>');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

const status = loadJobFitStatus(jobDir);
const next = getNextRequiredStage(status);

console.log(`Job-fit workspace: ${jobDir}`);
console.log(`Workflow: ${status.workflow}`);
console.log(`Review approved: ${status.review_gate.approved ? 'yes' : 'no'}`);
console.log('');
console.log('Stages:');
for (const [stage, details] of Object.entries(status.stages)) {
  console.log(`- ${stage}: ${details.state}`);
}
console.log('');
console.log(`Next required stage: ${next.stage || 'none'}`);
if (next.reason) console.log(`Reason: ${next.reason}`);
console.log('');
console.log('Artifacts:');
for (const file of readdirSync(jobDir).sort()) {
  console.log(`- ${file}`);
}
