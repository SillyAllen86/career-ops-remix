const ROLE_PROFILES = [
  {
    name: 'data-platform',
    match: /(data|analytics|platform|master data|information architecture|business intelligence|data product|forecasting|decision support)/i,
    headline: 'Business-Facing Data, Analytics, and Platform Lead | Information Architecture, Data Quality, and Decision Support',
    summaryLead: 'Business-facing data, analytics, and platform lead with 13+ years of experience turning fragmented operational information into decision-ready systems in regulated life sciences environments.',
    keywords: [
      'data platform',
      'information architecture',
      'data quality',
      'master data',
      'analytics platform',
      'decision support',
      'forecasting',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'enterprise-architecture',
    match: /(architecture|architect|integration|sap|solution)/i,
    headline: 'Enterprise Transformation & Architecture Lead | Integration, Governance, Quality, and AI-Enabled Workflow Design',
    summaryLead: 'Enterprise integration and transformation architect with 13+ years of experience designing how business capabilities, systems, data, and governance connect in regulated life sciences environments.',
    keywords: [
      'enterprise architecture',
      'integration architecture',
      'target-state architecture',
      'SAP',
      'system interaction models',
      'governance',
      'delivery-ready design',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'operations',
    match: /(operations|operational|process|throughput|supply chain|logistics|continuous improvement|lean|execution)/i,
    headline: 'Operations and Delivery Lead | Process, Controls, Handoffs, and Planning',
    summaryLead: 'Operations and delivery lead with 13+ years of experience improving throughput, controls, handoffs, and planning in regulated environments.',
    keywords: [
      'operations',
      'process design',
      'throughput',
      'controls',
      'planning',
      'risk reduction',
      'stakeholder alignment',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'transformation',
    match: /(transformation|change|program|delivery|operations)/i,
    headline: 'Enterprise Transformation & Program Governance Lead | Change, Operating Model, and Delivery Design',
    summaryLead: 'Transformation and program governance lead with 13+ years of experience bringing structure, visibility, and decision support to complex cross-functional initiatives in regulated environments.',
    keywords: [
      'transformation',
      'operating model design',
      'program governance',
      'stakeholder alignment',
      'forecast-versus-actual',
      'delivery planning',
      'change management',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'quality',
    match: /(quality|compliance|gxp|gmp|audit|validation)/i,
    headline: 'Quality and Compliance Transformation Lead | GxP, Governance, and Regulated Delivery',
    summaryLead: 'Quality-conscious transformation and compliance lead with 13+ years of experience improving regulated systems, validated processes, and governance in life sciences environments.',
    keywords: [
      'quality',
      'compliance',
      'GxP',
      'GAMP 5',
      'validation',
      'QMS',
      'audit readiness',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'product',
    match: /(product|roadmap|discovery|portfolio|pm)/i,
    headline: 'Technical Product and Portfolio Lead | Roadmaps, Discovery, and Delivery Translation',
    summaryLead: 'Technical product and portfolio lead with 13+ years of experience translating business needs into structured roadmaps, product decisions, and delivery outcomes in regulated environments.',
    keywords: [
      'product strategy',
      'roadmap',
      'discovery',
      'prioritization',
      'stakeholder communication',
      'customer engagement',
      'value realization',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'finance',
    match: /(finance|budget|commercial|pricing|forecast)/i,
    headline: 'Transformation and Finance-Aware Delivery Lead | Budgeting, Forecasting, and Commercial Control',
    summaryLead: 'Finance-aware transformation lead with 13+ years of experience connecting delivery planning, budgeting, forecasting, and commercial trade-offs in regulated environments.',
    keywords: [
      'forecast-versus-actual',
      'budgeting',
      'commercial control',
      'pricing model',
      'stakeholder communication',
      'delivery planning',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 5,
  },
  {
    name: 'ai',
    match: /(ai|llm|agent|workflow|automation|knowledge)/i,
    headline: 'AI-Enabled Workflow and Knowledge Systems Lead | Product, Retrieval, and Automation Design',
    summaryLead: 'AI-enabled workflow and knowledge systems lead with 13+ years of experience bridging enterprise transformation with practical local-first tooling, retrieval, and workflow automation.',
    keywords: [
      'AI-enabled',
      'knowledge workflows',
      'retrieval',
      'document intelligence',
      'workflow automation',
      'local-first',
      'product prototyping',
    ],
    bankSections: [1, 2, 3, 4, 5],
    maxExperienceBullets: 6,
  },
];

export function inferRoleProfile(roleText = '', focusText = '') {
  const text = `${roleText} ${focusText}`.trim();
  return ROLE_PROFILES.find((profile) => profile.match.test(text)) || ROLE_PROFILES[0];
}

export function tailorCvForRole(cv, experienceBank, { role = '', focus = '' } = {}) {
  const profile = inferRoleProfile(role, focus);
  const keywords = unique([
    ...profile.keywords,
    ...splitKeywords(role),
    ...splitKeywords(focus),
  ]);

  const tailored = structuredClone(cv);
  tailored.profile.headline = profile.headline;
  tailored.summary = buildSummary(cv, experienceBank, profile, keywords);
  tailored.coreAreasOfExpertise = distinctStringsByRelevance(cv.coreAreasOfExpertise || [], keywords, 14);
  tailored.domainsAndSystemsKnowledge = {
    domains: distinctStringsByRelevance(cv.domainsAndSystemsKnowledge?.domains || [], keywords, 12),
    systems: distinctStringsByRelevance(cv.domainsAndSystemsKnowledge?.systems || [], keywords, 18),
  };
  tailored.professionalExperience = (cv.professionalExperience || [])
    .map((job) => ({
      ...job,
      bullets: distinctStringsByRelevance(job.bullets || [], keywords, profile.maxExperienceBullets ?? 5),
    }))
    .filter((job) => job.bullets.length > 0);
  tailored.selectedStrategicContributions = removeDuplicateClaims(
    selectStrategicContributions(cv, experienceBank, profile, keywords),
    tailored.professionalExperience.flatMap((job) => job.bullets),
  );
  tailored.selectedPersonalTechnicalProjects = sortByScore(cv.selectedPersonalTechnicalProjects || [], keywords, projectScore)
    .map((project) => ({
      ...project,
      bullets: distinctStringsByRelevance(project.bullets || [], keywords, 3),
    }));
  tailored.thoughtLeadershipPublications = (cv.thoughtLeadershipPublications || []).map((entry) => ({
    ...entry,
    bullets: distinctStringsByRelevance(entry.bullets || [], keywords, 3),
  }));
  tailored.education = cv.education || [];
  tailored.certificationsAndTraining = cv.certificationsAndTraining || [];
  tailored.languages = cv.languages || [];
  tailored.skillsAndKeywordBank = (cv.skillsAndKeywordBank || []).map((group) => ({
    ...group,
    items: distinctStringsByRelevance(group.items || [], keywords),
  }));

  return {
    profile,
    keywords,
    cv: tailored,
  };
}

function buildSummary(cv, experienceBank, profile, keywords) {
  const evidence = selectBankBullets(experienceBank, profile.bankSections, keywords, 2);
  const base = takeSentences(cv.summary, 2);
  const parts = [profile.summaryLead];
  if (base && !sameClaim(base, profile.summaryLead)) {
    const filtered = removeSentencesRedundantWithLead(base, profile.summaryLead);
    if (filtered) parts.push(filtered);
  }
  if (evidence.length > 0) parts.push(`Relevant depth includes ${formatEvidence(evidence)}.`);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function removeSentencesRedundantWithLead(text, lead) {
  const yearsPattern = /\d+\+?\s+years?\s+of\s+experience/i;
  const leadHasYears = yearsPattern.test(lead);
  const sentences = String(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  const kept = sentences.filter((s) => !(leadHasYears && yearsPattern.test(s)));
  return kept.join(' ').trim();
}

function selectBankBullets(experienceBank, sectionIds, keywords, limit) {
  const bullets = (experienceBank.sections || [])
    .filter((section) => sectionIds.includes(section.id))
    .flatMap((section) => section.bullets)
    .filter((bullet) => !/:$/.test(String(bullet).trim()))
    .filter((bullet) => !/^Mapped\s+global\s+vs\s+site-specific/i.test(String(bullet).trim()));

  return distinctStringsByRelevance(bullets, keywords, limit);
}

function selectStrategicContributions(cv, experienceBank, profile, keywords) {
  const fromBank = selectBankBullets(experienceBank, profile.bankSections, keywords, 8);
  if (fromBank.length > 0) return fromBank;

  return distinctStringsByRelevance([
    ...(cv.selectedStrategicContributions || []),
    ...(cv.professionalExperience || []).flatMap((job) => (job.bullets || []).slice(0, 2)),
  ], keywords, 8);
}

function formatEvidence(items) {
  return items
    .map((item) => cleanEvidenceClause(item))
    .filter(Boolean)
    .join(', ');
}

function cleanEvidenceClause(text) {
  const cleaned = String(text)
    .replace(/^Mapped\s+/i, '')
    .replace(/^Defined\s+/i, '')
    .replace(/^Supported\s+/i, '')
    .replace(/^Contributed\s+/i, '')
    .replace(/^Shaped\s+/i, '')
    .replace(/^Worked\s+/i, '')
    .replace(/^Lead\s+/i, '')
    .replace(/^Develop\s+/i, '')
    .replace(/^Drive\s+/i, '')
    .replace(/^Drive[s]?\s+/i, '')
    .replace(/^Designed\s+/i, '')
    .replace(/^Created\s+/i, '')
    .replace(/:$/, '')
    .replace(/\s+/g, ' ')
    .replace(/\brequirements for$/i, 'requirements')
    .replace(/\s+for$/i, '')
    .trim();
  return cleaned;
}

function sortStringsByRelevance(items, keywords) {
  return sortByScore(items, keywords, scoreText);
}

function distinctStringsByRelevance(items, keywords, limit = items.length) {
  const sorted = sortByScore(items, keywords, scoreText);
  return takeDistinct(sorted, limit);
}

function removeDuplicateClaims(items, existing) {
  const seen = new Set(existing.map(normalizeComparableText).filter(Boolean));
  const unique = [];

  for (const item of items) {
    const normalized = normalizeComparableText(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(item);
  }

  return unique;
}

function sortByScore(items, keywords, scorer) {
  return [...(items || [])].sort((a, b) => scorer(b, keywords) - scorer(a, keywords));
}

function normalizeComparableText(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function projectScore(project, keywords) {
  return scoreText([project.title, project.role, project.period, ...(project.bullets || [])].join(' '), keywords);
}

function scoreText(text, keywords) {
  const lower = String(text).toLowerCase();
  return keywords.reduce((score, keyword) => score + (lower.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

function takeDistinct(items, limit = items.length) {
  const selected = [];
  const seen = new Set();

  for (const item of items) {
    const key = canonicalClaimKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.push(item);
    if (selected.length >= limit) break;
  }

  return selected;
}

function canonicalClaimKey(text) {
  const normalized = String(text)
    .toLowerCase()
    .replace(/^\s*[-*]\s*/, '')
    .replace(/^(led|managed|built|developed|defined|shaped|supported|owned|coached|trained|coordinated|translated|mapped|designed|created|prepared|maintained|applied|established|drove|improved|worked|partnered|implemented|ran|set up)\s+/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return '';
  return normalized.split(' ').slice(0, 10).join(' ');
}

function sameClaim(a, b) {
  return canonicalClaimKey(a) === canonicalClaimKey(b);
}

function takeSentences(text, limit = 2) {
  const sentences = String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];

  return sentences.slice(0, limit).join(' ').trim();
}

function splitKeywords(text) {
  return String(text)
    .split(/[,/|]+|\band\b|\bwith\b|\bfor\b|\bto\b/gi)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\s+/g, ' '))
    .slice(0, 20);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}
