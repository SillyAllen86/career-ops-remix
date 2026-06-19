#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAtsAnalysis } from '../lib/job-fit/ats.mjs';
import { updateJobFitStage } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let slug = '';
for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--slug=')) slug = arg.slice('--slug='.length);
}

if (!slug) {
  console.error('Usage: node scripts/job-fit-ats.mjs --slug=<role-slug>');
  process.exit(1);
}

const jobDir = resolve(ROOT, 'generated', 'jobs', slug);
if (!existsSync(jobDir)) {
  console.error(`Missing job-fit workspace: ${jobDir}`);
  process.exit(1);
}

const analysis = generateAtsAnalysis(jobDir);
const stageState = analysis.status === 'completed' ? 'completed' : 'blocked';
const stageNotes = analysis.notes || 'ATS analysis updated.';
updateJobFitStage(jobDir, 'ats_extract', stageState, stageNotes);

console.log(`ATS analysis status: ${analysis.status}`);
console.log(`ATS analysis file: ${resolve(jobDir, 'ats-analysis.json')}`);
console.log(`Responsibilities: ${analysis.core_responsibilities.length}`);
console.log(`Must-have hard skills: ${analysis.must_have_skills.hard.length}`);
console.log(`Must-have soft skills: ${analysis.must_have_skills.soft.length}`);
console.log(`Must-have domain skills: ${analysis.must_have_skills.domain.length}`);
console.log(`ATS keywords: ${analysis.ats_keywords.length}`);
