import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function generateIdealProfile(jobDir) {
  const metadata = readJson(resolve(jobDir, 'metadata.json'));
  const ats = readJson(resolve(jobDir, 'ats-analysis.json'));
  const outputPath = resolve(jobDir, 'ideal-profile.json');

  const topKeywords = (ats.ats_keywords || []).slice(0, 12);
  const hard = ats.must_have_skills?.hard || [];
  const soft = ats.must_have_skills?.soft || [];
  const domain = ats.must_have_skills?.domain || [];

  const years = inferBackgroundYears(resolve(jobDir, 'jd.md'));
  const domainBackground = inferDomainBackground(domain, topKeywords);

  const summary = buildSummary({
    role: metadata.role,
    topKeywords,
    domainBackground,
    years,
  });

  const achievements = buildAchievements(ats.core_responsibilities || []);
  const skillsMatrix = buildSkillsMatrix({ topKeywords, hard, soft, domain });

  const ideal = {
    role_slug: metadata.role_slug,
    status: ats.status === 'completed' ? 'completed' : 'blocked',
    title: metadata.role,
    summary,
    background_years: years,
    domain_background: domainBackground,
    key_achievements: achievements,
    skills_matrix: skillsMatrix,
    notes: ats.status === 'completed'
      ? 'Ideal hiring-manager persona generated from ATS analysis.'
      : 'ATS analysis is incomplete; ideal profile cannot be generated reliably.',
  };

  writeFileSync(outputPath, `${JSON.stringify(ideal, null, 2)}\n`);
  return ideal;
}

function buildSummary({ role, topKeywords, domainBackground, years }) {
  const leading = topKeywords.slice(0, 4).map((item) => item.keyword);
  return `${role} should look like a senior business-facing technology leader with ${years} in ${domainBackground}. The ideal candidate combines ${leading.join(', ')} with direct ownership of regional outcomes, strong people leadership, and credible delivery across regulated healthcare environments.`;
}

function buildAchievements(responsibilities) {
  return responsibilities
    .slice(0, 12)
    .map((item) => rewriteAsIdealAchievement(item));
}

function buildSkillsMatrix({ topKeywords, hard, soft, domain }) {
  const rows = [];
  for (const entry of topKeywords.slice(0, 15)) {
    rows.push({
      skill: entry.keyword,
      proficiency: proficiencyForWeight(entry.weight),
      relevance_score: entry.weight,
      category: categorize(entry.keyword, { hard, soft, domain }),
    });
  }
  return rows;
}

function inferBackgroundYears(jdPath) {
  const text = readFileSync(jdPath, 'utf8');
  const match = text.match(/(\d+\+?)\s+years?\s+in\s+technology leadership/i);
  if (match) return `${match[1]} technology leadership`;
  const generic = text.match(/(\d+\+?)\s+years?/i);
  return generic ? `${generic[1]} relevant experience` : 'senior-level experience';
}

function inferDomainBackground(domainSkills, keywords) {
  const candidates = [...domainSkills, ...keywords.map((item) => item.keyword)];
  const domain = [];
  if (candidates.some((value) => /medtech/i.test(value))) domain.push('MedTech');
  if (candidates.some((value) => /electrophysiology/i.test(value))) domain.push('electrophysiology');
  if (candidates.some((value) => /neurovascular/i.test(value))) domain.push('neurovascular');
  if (candidates.some((value) => /supply chain/i.test(value))) domain.push('commercial, supply chain, and service operations');
  return domain.length ? domain.join(' / ') : 'regulated healthcare technology';
}

function rewriteAsIdealAchievement(text) {
  const cleaned = String(text).trim().replace(/[.;]\s*$/, '');
  return cleaned
    .replace(/^Co.?create/i, 'Co-created')
    .replace(/^Develop/i, 'Developed')
    .replace(/^Serve/i, 'Served')
    .replace(/^Provide/i, 'Provided')
    .replace(/^Build/i, 'Built')
    .replace(/^Focus on/i, 'Focused on')
    .replace(/^Operationalize/i, 'Operationalized')
    .replace(/^Use/i, 'Used')
    .replace(/^Drive/i, 'Drove')
    .replace(/^Own/i, 'Owned')
    .replace(/^Lead/i, 'Led')
    .replace(/^Bring/i, 'Brought')
    .replace(/^Ensure/i, 'Ensured')
    .replace(/^Champion/i, 'Championed')
    .replace(/^Play/i, 'Played');
}

function proficiencyForWeight(weight) {
  if (weight >= 5) return 'expert';
  if (weight >= 4) return 'strong';
  if (weight >= 3) return 'working';
  return 'exposure';
}

function categorize(keyword, { hard, soft, domain }) {
  const lower = String(keyword).toLowerCase();
  if (hard.some((item) => item.toLowerCase() === lower)) return 'hard';
  if (soft.some((item) => item.toLowerCase() === lower)) return 'soft';
  if (domain.some((item) => item.toLowerCase() === lower)) return 'domain';
  return 'mixed';
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
