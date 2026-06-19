#!/usr/bin/env node

import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok } from 'node:assert';
import { parseCvMarkdown } from '../lib/cv/markdown.mjs';
import { runCvEditorialPass } from '../lib/cv/final-pass.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CV_PATH = resolve(ROOT, 'cv.md');

const markdown = readFileSync(CV_PATH, 'utf8');
const cv = parseCvMarkdown(markdown, {
  sourcePath: 'cv.md',
  lastModified: statSync(CV_PATH).mtime.toISOString(),
});

const report = runCvEditorialPass(cv, { mode: 'lint' }).report;

ok(report.summary.errors === 0, `expected repository CV to pass editorial gate, found ${report.summary.errors} error(s)`);

const summaryProvenance = report.provenance.filter((item) => item.path.startsWith('summary['));
ok(summaryProvenance.length > 0, 'expected summary provenance entries');
ok(summaryProvenance.every((item) => item.sourceRefs.length > 0), 'expected every summary sentence to map to evidence');
ok(summaryProvenance.every((item) => item.sourceRefs.every((ref) => !ref.startsWith('summary['))), 'summary provenance must not point to other summary sentences');

const flagged = runCvEditorialPass(buildFixture(), { mode: 'lint' }).report;
const codes = new Set(flagged.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.code));

ok(codes.has('promotional-language'), 'expected promotional-language error for puffery fixture');
ok(codes.has('duplicate-claim'), 'expected duplicate-claim error for repeated fixture');
ok(codes.has('missing-proof'), 'expected missing-proof error for unsupported summary fixture');

console.log('CV editorial pass regression test passed.');

function buildFixture() {
  const base = structuredClone(cv);
  base.summary = [
    'Groundbreaking enterprise leader with unmatched results across every domain.',
    'Groundbreaking enterprise leader with unmatched results across every domain.',
  ].join(' ');
  return base;
}
