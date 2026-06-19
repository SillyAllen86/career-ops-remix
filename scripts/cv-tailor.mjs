#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCvMarkdown, renderNormalizedMarkdown } from '../lib/cv/markdown.mjs';
import { validateCvJson } from '../lib/cv/validate.mjs';
import { loadExperienceBank } from '../lib/cv/experience-bank.mjs';
import { tailorCvForRole } from '../lib/cv/tailor.mjs';
import { buildEditorialFailureMessage, runCvEditorialPass } from '../lib/cv/final-pass.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const options = {
  role: '',
  focus: '',
  input: resolve(ROOT, 'cv.md'),
  bank: resolve(ROOT, 'data', 'experience-bank.md'),
  output: '',
  dryRun: false,
};

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg.startsWith('--role=')) options.role = arg.split('=')[1];
  else if (arg.startsWith('--focus=')) options.focus = arg.split('=')[1];
  else if (arg.startsWith('--input=')) options.input = resolve(ROOT, arg.split('=')[1]);
  else if (arg.startsWith('--bank=')) options.bank = resolve(ROOT, arg.split('=')[1]);
  else if (arg.startsWith('--output=')) options.output = resolve(ROOT, arg.split('=')[1]);
  else if (arg === '--dry-run') options.dryRun = true;
}

if (!options.role) {
  console.error('Usage: node scripts/cv-tailor.mjs --role="<role>" [--focus="<keywords>"] [--input=cv.md] [--output=generated/roles/.../cv.md] [--dry-run]');
  process.exit(1);
}

if (!existsSync(options.input)) {
  console.error(`Missing master CV: ${options.input}`);
  process.exit(1);
}

if (!existsSync(options.bank)) {
  console.error(`Missing experience bank: ${options.bank}`);
  process.exit(1);
}

const slug = slugify(options.role);
const outputPath = options.output || resolve(ROOT, 'generated', 'roles', slug, 'cv.md');
mkdirSync(dirname(outputPath), { recursive: true });

const masterMarkdown = readFileSync(options.input, 'utf8');
const masterStats = await import('node:fs/promises').then((fs) => fs.stat(options.input));
const masterCv = parseCvMarkdown(masterMarkdown, {
  sourcePath: basename(options.input),
  lastModified: masterStats.mtime.toISOString(),
});
validateCvJson(masterCv);

const bank = loadExperienceBank(options.bank);
const tailored = tailorCvForRole(masterCv, bank, {
  role: options.role,
  focus: options.focus,
});

validateCvJson(tailored.cv);

const editorial = runCvEditorialPass(tailored.cv, {
  experienceBank: bank,
  mode: 'lint',
});

if (editorial.hasErrors) {
  console.error(buildEditorialFailureMessage(editorial.report));
  process.exit(1);
}

const tailoredMarkdown = renderNormalizedMarkdown(editorial.cv);

if (!options.dryRun) {
  writeFileSync(outputPath, `${tailoredMarkdown}\n`);
}

const sparseWarnings = checkSparseSection(editorial.cv);
for (const warning of sparseWarnings) {
  console.warn(`Warning: ${warning}`);
}

console.log(options.dryRun ? `Role CV validated: ${outputPath}` : `Role CV written: ${outputPath}`);
console.log(`Role profile: ${tailored.profile.name}`);
console.log(`Matched keywords: ${tailored.keywords.join(', ')}`);
console.log(`Next step: cd ../rendercv-theme-lab && node scripts/cv-role-export.mjs --input=${outputPath}`);

function checkSparseSection(cv) {
  const warnings = [];
  if (!cv.coreAreasOfExpertise?.length) {
    warnings.push('coreAreasOfExpertise is empty — "Core Areas of Expertise" will be omitted from the rendered CV. Add at least 5 items in the cv.md.');
  } else if (cv.coreAreasOfExpertise.length < 3) {
    warnings.push(`coreAreasOfExpertise has only ${cv.coreAreasOfExpertise.length} item(s) — aim for at least 5.`);
  }
  const domains = cv.domainsAndSystemsKnowledge?.domains || [];
  const systems = cv.domainsAndSystemsKnowledge?.systems || [];
  if (!domains.length && !systems.length) {
    warnings.push('domainsAndSystemsKnowledge is empty — "Domains & Systems Knowledge" will be omitted from the rendered CV. Add at least 3 domains and 5 systems/platforms.');
  } else {
    if (!domains.length) warnings.push('domainsAndSystemsKnowledge.domains is empty — add at least 3 domain areas.');
    if (!systems.length) warnings.push('domainsAndSystemsKnowledge.systems is empty — add at least 5 systems/platforms/technologies.');
  }
  if (!cv.selectedStrategicContributions?.length) {
    warnings.push('selectedStrategicContributions is empty — "Selected Strategic Contributions" will be omitted from the rendered CV. Add at least 3 bullets.');
  } else if (cv.selectedStrategicContributions.length < 3) {
    warnings.push(`selectedStrategicContributions has only ${cv.selectedStrategicContributions.length} item(s) — aim for 3–6 bullets.`);
  }
  return warnings;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
