#!/usr/bin/env node

import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deepStrictEqual, ok } from 'node:assert';
import { parseCvMarkdown, renderNormalizedMarkdown } from '../lib/cv/markdown.mjs';
import { validateCvJson } from '../lib/cv/validate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CV_PATH = resolve(ROOT, 'cv.md');

const markdown = readFileSync(CV_PATH, 'utf8');
const lastModified = statSync(CV_PATH).mtime.toISOString();
const parsed = parseCvMarkdown(markdown, {
  sourcePath: 'cv.md',
  lastModified,
});

validateCvJson(parsed);

const normalizedMarkdown = renderNormalizedMarkdown(parsed);
const reparsed = parseCvMarkdown(normalizedMarkdown, {
  sourcePath: 'generated/cv.normalized.md',
  lastModified: new Date().toISOString(),
});

validateCvJson(reparsed);

deepStrictEqual(stripMetadata(parsed), stripMetadata(reparsed));
ok(parsed.profile.name === 'Pravin Sail', 'profile name should map correctly');
ok(parsed.profile.email === 'sail.a.pravin@gmail.com', 'profile email should map correctly');
ok(parsed.professionalExperience.length >= 6, 'expected multiple experience entries');
ok(parsed.coreAreasOfExpertise.length >= 30, 'expected core areas to be populated');
ok(parsed.selectedPersonalTechnicalProjects.length >= 3, 'expected project entries to be populated');
ok(parsed.thoughtLeadershipPublications.length >= 2, 'expected thought leadership entries to be populated');
ok(parsed.languages.length >= 4, 'expected language entries to be populated');

const aliasFixture = `# CV -- Example Person

**Headline:** Transformation Lead
**Location:** Berlin, Germany
**Email:** example@example.com
**Phone:** +49 123 456789
**LinkedIn:** linkedin.com/in/example
**GitHub:** github.com/example

## Professional Summary

Summary line one.

## Core Areas of Expertise

- Regulated transformation
- AI enablement

## Domains & Systems Knowledge

**Domains:** clinical operations; quality
**Systems / Platform Context:** CTMS; eTMF

## Professional Experience

### Example Corp - Head of Operations
**Berlin, Germany | 2022 - Present**

- Led a regulated transformation program.

## Role-Relevant Value Proposition

- Connect operations, governance, and delivery.

## AI And Analytics Enablement In Regulated Operations

- Structured AI use cases with traceability controls.

## Applied AI & Workflow Prototyping

Built practical retrieval and document-intelligence prototypes for workflow design decisions.

## Thought Leadership / Publications

### Example Publication | 2025
**Role:** Author | **Year:** 2025

- Published a paper on regulated operations.

## Education

- **MBA** - Example University, 2020-2022

## Certifications & Training

- GAMP 5

## Languages

- English - fluent
`;

const aliased = parseCvMarkdown(aliasFixture, {
  sourcePath: 'inline-alias-fixture.md',
  lastModified: new Date().toISOString(),
});

validateCvJson(aliased);

ok(aliased.selectedStrategicContributions.length === 2, 'expected aliased strategic sections to map into strategic contributions');
ok(aliased.selectedPersonalTechnicalProjects.length === 1, 'expected implicit project entry from aliased project section');
ok(aliased.selectedPersonalTechnicalProjects[0].title === 'Applied AI & Workflow Prototyping', 'expected implicit project title to use section heading');
ok(aliased.domainsAndSystemsKnowledge.systems.includes('CTMS'), 'expected systems alias to populate systems knowledge');
ok(aliased.languages[0].language === 'English', 'expected hyphenated language proficiency to parse correctly');

const flexibleFixture = `# CV -- Example Flexible

**Headline:** Transformation Lead
**Location:** Berlin, Germany
**Email:** example@example.com
**Phone:** +49 123 456789
**LinkedIn:** linkedin.com/in/example
**GitHub:** github.com/example

## Professional Experience

### Example Corp — Lead
**Berlin, Germany | 2022 - Present**

- Led structured delivery in a regulated environment.

## Custom Section Example

- This custom section should survive parsing and normalization.

## Education

- **MBA** — Example University, **2020-2022**
`;

const flexible = parseCvMarkdown(flexibleFixture, {
  sourcePath: 'inline-flexible-fixture.md',
  lastModified: new Date().toISOString(),
});

validateCvJson(flexible);

ok(flexible.professionalExperience.length === 1, 'expected flexible fixture experience to parse');
ok(flexible.customSections.length === 1, 'expected custom section to be preserved');
ok(flexible.sectionOrder[0] === 'Professional Experience', 'expected moved section order to be preserved');

const flexibleRoundTrip = parseCvMarkdown(renderNormalizedMarkdown(flexible), {
  sourcePath: 'inline-flexible-roundtrip.md',
  lastModified: new Date().toISOString(),
});

validateCvJson(flexibleRoundTrip);
deepStrictEqual(stripMetadata(flexible), stripMetadata(flexibleRoundTrip));

console.log('CV markdown -> JSON schema mapping test passed.');

function stripMetadata(cv) {
  const clone = structuredClone(cv);
  delete clone.generatedAt;
  delete clone.source;
  return clone;
}
