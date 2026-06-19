#!/usr/bin/env node

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { createJobFitWorkspace } from '../lib/job-fit/workspace.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const options = {
  url: '',
  role: '',
  company: '',
  source: 'manual',
  location: '',
  seniority: '',
  notes: '',
  jdFile: '',
};

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--url=')) options.url = arg.slice('--url='.length);
  else if (arg.startsWith('--role=')) options.role = arg.slice('--role='.length);
  else if (arg.startsWith('--company=')) options.company = arg.slice('--company='.length);
  else if (arg.startsWith('--source=')) options.source = arg.slice('--source='.length);
  else if (arg.startsWith('--location=')) options.location = arg.slice('--location='.length);
  else if (arg.startsWith('--seniority=')) options.seniority = arg.slice('--seniority='.length);
  else if (arg.startsWith('--notes=')) options.notes = arg.slice('--notes='.length);
  else if (arg.startsWith('--jd-file=')) options.jdFile = arg.slice('--jd-file='.length);
}

if (!options.role) {
  console.error('Usage: node scripts/job-fit-init.mjs --role="<role>" [--company="<company>"] [--url="<url>"] [--jd-file=path/to/jd.md]');
  process.exit(1);
}

let jdText = '';
if (options.jdFile) {
  const jdPath = resolve(ROOT, options.jdFile);
  if (!existsSync(jdPath)) {
    console.error(`Missing JD file: ${jdPath}`);
    process.exit(1);
  }
  jdText = readFileSync(jdPath, 'utf8');
}

const result = createJobFitWorkspace({
  root: ROOT,
  role: options.role,
  company: options.company,
  url: options.url,
  source: options.source,
  location: options.location,
  seniority: options.seniority,
  notes: options.notes,
  jdText,
});

console.log(`Job-fit workspace created: ${result.jobDir}`);
console.log(`Status: ${result.statusPath}`);
console.log('Created artifacts: jd.md, ats-analysis.json, ideal-profile.json, experience-map.json, cv-fit-report.md, review.md');
