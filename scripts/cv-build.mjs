#!/usr/bin/env node

/**
 * cv-build.mjs — Master CV validator.
 *
 * Parses cv.md and runs the editorial pass. Does not write derived CV
 * artifacts by default — all rendering/export artifacts live in rendercv-theme-lab.
 *
 * Usage:
 *   node scripts/cv-build.mjs [--input=cv.md] [--stdout]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCvMarkdown } from '../lib/cv/markdown.mjs';
import { validateCvJson } from '../lib/cv/validate.mjs';
import { buildEditorialFailureMessage, runCvEditorialPass } from '../lib/cv/final-pass.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const args = process.argv.slice(2);
const options = {
  input: resolve(ROOT, 'cv.md'),
  stdout: false,
};

for (const arg of args) {
  if (arg.startsWith('--input=')) options.input = resolve(ROOT, arg.split('=')[1]);
  else if (arg === '--stdout') options.stdout = true;
}

if (!existsSync(options.input)) {
  console.error(`Input CV markdown not found: ${options.input}`);
  process.exit(1);
}

const markdown = readFileSync(options.input, 'utf8');
const stats = await import('node:fs/promises').then((fs) => fs.stat(options.input));
const cv = parseCvMarkdown(markdown, {
  sourcePath: 'cv.md',
  lastModified: stats.mtime.toISOString(),
});

validateCvJson(cv);

const editorial = runCvEditorialPass(cv, { mode: 'lint' });

if (editorial.hasErrors) {
  console.error(buildEditorialFailureMessage(editorial.report));
  process.exit(1);
}

if (options.stdout) {
  process.stdout.write(`${JSON.stringify(editorial.cv, null, 2)}\n`);
}

console.log(`CV validated: ${options.input}`);
