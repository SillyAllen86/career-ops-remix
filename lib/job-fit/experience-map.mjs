import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCvMarkdown } from '../cv/markdown.mjs';
import { loadExperienceBank } from '../cv/experience-bank.mjs';

const DIMENSIONS = {
  strategy: ['strategy', 'roadmap', 'portfolio governance', 'business strategy', 'regional technology strategy'],
  people_leadership: ['people leadership', 'leadership', 'stakeholder management', 'influence'],
  ai_data: ['ai', 'ai/ml', 'genai', 'analytics', 'data platforms', 'data governance'],
  tech_stack: ['erp', 'crm', 'mes', 'apis', 'cloud', 'cybersecurity'],
  domain: ['medtech', 'electrophysiology', 'neurovascular', 'supply chain', 'customer engagement', 'connected devices'],
  product_delivery: ['product management', 'agile', 'portfolio governance', 'delivery'],
};

export function generateExperienceMap(jobDir, rootDir) {
  const metadata = readJson(resolve(jobDir, 'metadata.json'));
  const ats = readJson(resolve(jobDir, 'ats-analysis.json'));
  const ideal = readJson(resolve(jobDir, 'ideal-profile.json'));

  const cv = parseCvMarkdown(readFileSync(resolve(rootDir, 'cv.md'), 'utf8'));
  const bank = loadExperienceBank(resolve(rootDir, 'data', 'experience-bank.md'));

  const evidencePool = [
    ...flattenExperience(cv),
    ...flattenProjects(cv),
    ...flattenBank(bank),
  ];

  const matchedRoles = scoreRoles(cv.professionalExperience || [], ideal, ats);
  const matchedProjects = scoreProjects(cv.selectedPersonalTechnicalProjects || [], ideal, ats);
  const recommendedSubset = scoreEvidence(evidencePool, ideal, ats).slice(0, 14);
  const coverage = buildCoverageByDimension(recommendedSubset, ideal.skills_matrix || []);
  const gaps = buildHighWeightGaps(ideal.skills_matrix || [], recommendedSubset);
  const controversial = buildControversialEdits(gaps, metadata.role);

  const output = {
    role_slug: metadata.role_slug,
    status: ideal.status === 'completed' && ats.status === 'completed' ? 'completed' : 'blocked',
    similarity_method: 'keyword-weighted heuristic mapping (non-embedding)',
    matched_roles: matchedRoles,
    matched_projects: matchedProjects,
    recommended_experience_subset: recommendedSubset,
    coverage_by_dimension: coverage,
    high_weight_gaps: gaps,
    controversial_edits: controversial,
    notes: ideal.status === 'completed'
      ? 'Experience map generated from master CV, projects, and experience bank.'
      : 'Ideal profile or ATS analysis is incomplete.',
  };

  writeFileSync(resolve(jobDir, 'experience-map.json'), `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

function flattenExperience(cv) {
  return (cv.professionalExperience || []).flatMap((job) =>
    (job.bullets || []).map((bullet) => ({
      source_type: 'role_bullet',
      source_label: `${job.company} — ${job.title}`,
      text: bullet,
    })),
  );
}

function flattenProjects(cv) {
  return (cv.selectedPersonalTechnicalProjects || []).flatMap((project) =>
    (project.bullets || []).map((bullet) => ({
      source_type: 'project_bullet',
      source_label: project.title,
      text: bullet,
    })),
  );
}

function flattenBank(bank) {
  return (bank.sections || []).flatMap((section) =>
    (section.bullets || []).map((bullet) => ({
      source_type: 'experience_bank',
      source_label: section.title,
      text: bullet,
    })),
  );
}

function scoreRoles(roles, ideal, ats) {
  return roles
    .map((role) => ({
      company: role.company,
      title: role.title,
      score: similarityScore([role.title, ...(role.bullets || [])].join(' '), ideal, ats),
      supporting_bullets: (role.bullets || [])
        .map((bullet) => ({ bullet, score: similarityScore(bullet, ideal, ats) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function scoreProjects(projects, ideal, ats) {
  return projects
    .map((project) => ({
      title: project.title,
      score: similarityScore([project.title, ...(project.bullets || [])].join(' '), ideal, ats),
      supporting_bullets: (project.bullets || [])
        .map((bullet) => ({ bullet, score: similarityScore(bullet, ideal, ats) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function scoreEvidence(pool, ideal, ats) {
  return pool
    .map((entry) => ({
      ...entry,
      score: similarityScore(entry.text, ideal, ats),
      matched_keywords: matchedKeywords(entry.text, ideal, ats),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

function similarityScore(text, ideal, ats) {
  const lower = String(text).toLowerCase();
  let score = 0;

  for (const row of ideal.skills_matrix || []) {
    const keyword = String(row.skill).toLowerCase();
    if (keyword && lower.includes(keyword)) score += row.relevance_score || 1;
  }

  for (const achievement of ideal.key_achievements || []) {
    const overlap = overlapCount(lower, tokenize(achievement));
    score += Math.min(overlap, 3);
  }

  for (const responsibility of ats.core_responsibilities || []) {
    const overlap = overlapCount(lower, tokenize(responsibility));
    score += Math.min(overlap, 2);
  }

  return score;
}

function buildCoverageByDimension(recommendedSubset, skillsMatrix) {
  return Object.entries(DIMENSIONS).map(([dimension, keywords]) => {
    const targetWeight = sumWeights(skillsMatrix, keywords);
    const covered = recommendedSubset.reduce((total, entry) => {
      const lower = entry.text.toLowerCase();
      return total + keywords.reduce((acc, keyword) => acc + (lower.includes(keyword.toLowerCase()) ? 1 : 0), 0);
    }, 0);
    const coverageRatio = targetWeight > 0 ? Number((covered / targetWeight).toFixed(2)) : 0;
    return {
      dimension,
      target_weight: targetWeight,
      covered_signals: covered,
      coverage_ratio: coverageRatio,
      status: coverageRatio >= 0.8 ? 'strong' : coverageRatio >= 0.4 ? 'partial' : 'weak',
    };
  });
}

function buildHighWeightGaps(skillsMatrix, recommendedSubset) {
  const coveredText = recommendedSubset.map((item) => item.text.toLowerCase()).join(' ');
  return skillsMatrix
    .filter((row) => row.relevance_score >= 4)
    .filter((row) => !coveredText.includes(String(row.skill).toLowerCase()))
    .map((row) => ({
      skill: row.skill,
      category: row.category,
      relevance_score: row.relevance_score,
      reframing_guidance: reframeGuidance(row.skill),
    }))
    .slice(0, 12);
}

function buildControversialEdits(gaps, role) {
  return gaps.slice(0, 8).map((gap) => ({
    item: `Direct ${gap.skill} ownership for ${role}`,
    reason: 'The current evidence pool does not show direct like-for-like ownership.',
    suggested_reframe: gap.reframing_guidance,
  }));
}

function matchedKeywords(text, ideal, ats) {
  const lower = String(text).toLowerCase();
  const out = [];
  for (const row of ideal.skills_matrix || []) {
    if (lower.includes(String(row.skill).toLowerCase())) out.push(row.skill);
  }
  for (const keyword of ats.ats_keywords || []) {
    if (out.length >= 8) break;
    if (lower.includes(String(keyword.keyword).toLowerCase()) && !out.includes(keyword.keyword)) out.push(keyword.keyword);
  }
  return out;
}

function reframeGuidance(skill) {
  const lower = String(skill).toLowerCase();
  if (/medtech|electrophysiology|neurovascular/.test(lower)) {
    return 'Position as regulated healthcare technology adjacency, not direct device-domain ownership.';
  }
  if (/connected devices|telemetry|computer vision|robotics|imaging/.test(lower)) {
    return 'Use adjacent systems/integration/AI experience only if the similarity is explicit and defensible.';
  }
  if (/crm|customer engagement|commercial/.test(lower)) {
    return 'Frame business-process and platform interface experience, not direct commercial-stack ownership.';
  }
  return 'Use only adjacent evidence that is demonstrably transferable.';
}

function sumWeights(skillsMatrix, keywords) {
  return skillsMatrix
    .filter((row) => keywords.some((keyword) => String(row.skill).toLowerCase() === keyword.toLowerCase()))
    .reduce((sum, row) => sum + (row.relevance_score || 0), 0);
}

function overlapCount(text, tokens) {
  return tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length >= 4)
    .slice(0, 20);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
