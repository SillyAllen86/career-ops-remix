import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCvMarkdown, renderNormalizedMarkdown } from '../cv/markdown.mjs';
import { loadExperienceBank } from '../cv/experience-bank.mjs';
import { tailorCvForRole } from '../cv/tailor.mjs';

export function generateCvDraft(jobDir, rootDir) {
  const metadata = readJson(resolve(jobDir, 'metadata.json'));
  const ats = readJson(resolve(jobDir, 'ats-analysis.json'));
  const experienceMap = readJson(resolve(jobDir, 'experience-map.json'));

  const cv = parseCvMarkdown(readFileSync(resolve(rootDir, 'cv.md'), 'utf8'));
  const bank = loadExperienceBank(resolve(rootDir, 'data', 'experience-bank.md'));

  const focus = (ats.ats_keywords || []).slice(0, 12).map((item) => item.keyword).join(', ');
  const tailored = tailorCvForRole(cv, bank, {
    role: metadata.role,
    focus,
  });

  const draftDir = resolve(jobDir, 'cv-draft');
  mkdirSync(draftDir, { recursive: true });
  const draftPath = resolve(draftDir, 'cv.md');
  writeFileSync(draftPath, `${renderNormalizedMarkdown(tailored.cv)}\n`);

  const fitReport = buildCvFitReport({
    metadata,
    ats,
    tailoredCv: tailored.cv,
    experienceMap,
  });
  writeFileSync(resolve(jobDir, 'cv-fit-report.md'), fitReport);

  const review = buildReviewMarkdown({
    metadata,
    experienceMap,
  });
  writeFileSync(resolve(jobDir, 'review.md'), review);

  return {
    status: 'completed',
    draft_path: draftPath,
    fit_report_path: resolve(jobDir, 'cv-fit-report.md'),
    review_path: resolve(jobDir, 'review.md'),
    notes: 'Tailored CV draft and fit report generated; waiting for human review before any export.',
  };
}

function buildCvFitReport({ metadata, ats, tailoredCv, experienceMap }) {
  const topRequirements = buildTopRequirements(ats);
  const selectedBullets = (tailoredCv.professionalExperience || []).flatMap((job) =>
    (job.bullets || []).map((bullet) => ({
      section: `${job.company} — ${job.title}`,
      bullet,
      matches: matchRequirementLabels(bullet, topRequirements),
    })),
  ).slice(0, 18);

  const lines = [];
  lines.push('# CV Fit Report');
  lines.push('');
  lines.push('## Role');
  lines.push('');
  lines.push(`- Company: ${metadata.company}`);
  lines.push(`- Role: ${metadata.role}`);
  lines.push('');
  lines.push('## Section-to-JD Trace');
  lines.push('');
  lines.push('| CV Section | Why It Exists | JD Requirement Targeted | Evidence Confidence | Notes |');
  lines.push('|------------|---------------|-------------------------|---------------------|-------|');
  for (const job of tailoredCv.professionalExperience || []) {
    const jdTargets = unique(matchRequirementLabels((job.bullets || []).join(' '), topRequirements)).slice(0, 3);
    lines.push(`| ${escapeTable(`${job.company} — ${job.title}`)} | Preserve role-specific evidence for the strongest relevant lane | ${escapeTable(jdTargets.join('; ') || 'General fit evidence')} | Medium | Selected automatically from master CV + bank |`);
  }
  lines.push('');
  lines.push('## Selected Bullets');
  lines.push('');
  lines.push('| Experience Bullet | JD Requirement | Why Included | Confidence |');
  lines.push('|-------------------|----------------|--------------|------------|');
  for (const item of selectedBullets) {
    lines.push(`| ${escapeTable(item.bullet)} | ${escapeTable(item.matches.join('; ') || 'General fit')} | Selected because it overlaps with ATS and ideal-profile signals | ${item.matches.length >= 2 ? 'Medium' : 'Low'} |`);
  }
  lines.push('');
  lines.push('## Excluded / Controversial Items');
  lines.push('');
  lines.push('| Item | Why Excluded or Flagged | Suggested Reframe |');
  lines.push('|------|--------------------------|-------------------|');
  for (const item of (experienceMap.controversial_edits || []).slice(0, 10)) {
    lines.push(`| ${escapeTable(item.item)} | ${escapeTable(item.reason)} | ${escapeTable(item.suggested_reframe)} |`);
  }
  return `${lines.join('\n')}\n`;
}

function buildReviewMarkdown({ metadata, experienceMap }) {
  const lines = [];
  lines.push('# Human Review Gate');
  lines.push('');
  lines.push('## Role');
  lines.push('');
  lines.push(`- Company: ${metadata.company}`);
  lines.push(`- Role: ${metadata.role}`);
  lines.push('');
  lines.push('## Review Checklist');
  lines.push('');
  lines.push('- [ ] ATS analysis looks accurate');
  lines.push('- [ ] Ideal profile is believable and useful');
  lines.push('- [ ] Experience mapping reflects actual evidence');
  lines.push('- [ ] Tailored CV does not overclaim');
  lines.push('- [ ] Controversial edits are explicitly listed');
  lines.push('- [ ] Export approved');
  lines.push('');
  lines.push('## Ranked Experience Snapshot');
  lines.push('');
  for (const item of (experienceMap.recommended_experience_subset || []).slice(0, 8)) {
    lines.push(`- ${item.source_label}: ${item.text}`);
  }
  lines.push('');
  lines.push('## Controversial Edits');
  lines.push('');
  for (const item of (experienceMap.controversial_edits || []).slice(0, 8)) {
    lines.push(`- ${item.item}: ${item.reason} Reframe: ${item.suggested_reframe}`);
  }
  lines.push('');
  lines.push('## Reviewer Notes');
  lines.push('');
  lines.push('<Add approval notes or requested changes here>');
  return `${lines.join('\n')}\n`;
}

function buildTopRequirements(ats) {
  return unique([
    ...(ats.must_have_skills?.hard || []),
    ...(ats.must_have_skills?.soft || []),
    ...(ats.must_have_skills?.domain || []),
    ...(ats.tools_and_stack || []),
  ]).slice(0, 20);
}

function matchRequirementLabels(text, requirements) {
  const lower = String(text).toLowerCase();
  return requirements.filter((item) => lower.includes(String(item).toLowerCase())).slice(0, 4);
}

function escapeTable(text) {
  return String(text).replace(/\|/g, '\\|');
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
