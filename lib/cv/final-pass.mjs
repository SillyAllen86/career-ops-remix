const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'into', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'with', 'across', 'through', 'within',
  'using', 'used', 'use', 'via', 'over', 'under', 'than', 'also', 'current', 'includes', 'include',
  'including', 'supports', 'support', 'supporting', 'builds', 'built', 'led', 'lead', 'define',
  'defined', 'develop', 'developed', 'shape', 'shaped', 'drive', 'drives', 'driven', 'experience',
  'years', 'year', 'strong', 'background', 'focus', 'parallel',
]);

const WEAK_VERB_PATTERNS = [
  /^(lead|led)\b/i,
  /^(define|defined)\b/i,
  /^(develop|developed)\b/i,
  /^(shape|shaped)\b/i,
  /^(support|supported)\b/i,
  /^(contribute|contributed)\b/i,
  /^(work|worked)\b/i,
  /^(partner|partnered)\b/i,
  /^(coordinate|coordinated)\b/i,
];

const PROMOTIONAL_PATTERNS = [
  /\b(groundbreaking|renowned|pivotal|vibrant|rich|showcasing|showcases|underscores|underscore|exemplifies|boasts)\b/i,
  /\b(testament to|in the heart of|significant role|key turning point|lasting legacy|broader shift)\b/i,
];

const UNSUPPORTED_PATTERNS = [
  /\b(industry[- ]leading|world[- ]class|best[- ]in[- ]class|thought leader|visionary)\b/i,
  /\b(revolutionary|transformative impact|unmatched|exceptional track record)\b/i,
];

export class CvEditorialLintError extends Error {
  constructor(report) {
    super(buildEditorialFailureMessage(report));
    this.name = 'CvEditorialLintError';
    this.report = report;
  }
}

export function runCvEditorialPass(cv, { experienceBank = null, mode = 'lint' } = {}) {
  const nextCv = structuredClone(cv);
  const evidenceItems = buildEvidenceIndex(nextCv, experienceBank);
  const supportingEvidenceItems = evidenceItems.filter((item) => !item.id.startsWith('summary['));
  const provenance = [];
  const issues = [];
  const seenClaims = new Map();

  if (nextCv.summary) auditSummary(nextCv.summary, supportingEvidenceItems, provenance, issues, seenClaims);
  auditProfessionalExperience(nextCv.professionalExperience || [], supportingEvidenceItems, provenance, issues, seenClaims);
  auditFlatBulletSection(nextCv.selectedStrategicContributions || [], 'selectedStrategicContributions', supportingEvidenceItems, provenance, issues, seenClaims);
  auditProjectSection(nextCv.selectedPersonalTechnicalProjects || [], supportingEvidenceItems, provenance, issues, seenClaims);
  auditProjectSection(nextCv.thoughtLeadershipPublications || [], supportingEvidenceItems, provenance, issues, seenClaims);

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    summary: {
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
      auditedItems: provenance.length,
      evidenceItems: evidenceItems.length,
    },
    issues,
    provenance,
    rewrites: [],
  };

  return {
    cv: nextCv,
    report,
    hasErrors: report.summary.errors > 0,
  };
}

export function buildEditorialFailureMessage(report) {
  const lines = [
    `CV editorial pass failed with ${report.summary.errors} error(s) and ${report.summary.warnings} warning(s).`,
  ];

  for (const issue of report.issues.filter((item) => item.severity === 'error')) {
    lines.push(`- [${issue.code}] ${issue.path}: ${issue.message}`);
  }

  if (report.summary.warnings > 0) {
    lines.push('Warnings:');
    for (const issue of report.issues.filter((item) => item.severity === 'warning').slice(0, 10)) {
      lines.push(`- [${issue.code}] ${issue.path}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function auditSummary(summary, evidenceItems, provenance, issues, seenClaims) {
  const sentences = splitSentences(summary);
  sentences.forEach((sentence, index) => {
    const path = `summary[${index}]`;
    const matches = matchEvidence(sentence, evidenceItems);
    const sourceRefs = matches.map((match) => match.id);
    const normalizedClaim = normalizeClaim(sentence);
    provenance.push({
      path,
      text: sentence,
      rewritten: false,
      sourceRefs,
      evidenceIds: sourceRefs,
    });

    if (matches.length === 0) {
      issues.push(buildIssue('missing-proof', 'error', path, 'Summary sentence does not map to concrete CV evidence.', sentence, sourceRefs));
    }
    if (matches.length > 0 && matches[0].overlap < 2) {
      issues.push(buildIssue('vague-impact', 'warning', path, 'Summary sentence only weakly overlaps with the supporting evidence.', sentence, sourceRefs));
    }

    lintTone(path, sentence, issues, sourceRefs);
    lintDuplicates(path, sentence, normalizedClaim, seenClaims, issues, sourceRefs);
  });
}

function auditProfessionalExperience(experience, evidenceItems, provenance, issues, seenClaims) {
  experience.forEach((job, jobIndex) => {
    job.bullets.forEach((bullet, bulletIndex) => {
      const path = `professionalExperience[${jobIndex}].bullets[${bulletIndex}]`;
      auditBullet(path, bullet, evidenceItems, provenance, issues, seenClaims);
    });
  });
}

function auditFlatBulletSection(items, sectionName, evidenceItems, provenance, issues, seenClaims) {
  items.forEach((item, index) => {
    const path = `${sectionName}[${index}]`;
    auditBullet(path, item, evidenceItems, provenance, issues, seenClaims);
  });
}

function auditProjectSection(items, evidenceItems, provenance, issues, seenClaims) {
  items.forEach((item, itemIndex) => {
    item.bullets.forEach((bullet, bulletIndex) => {
      const collection = item.year ? 'thoughtLeadershipPublications' : 'selectedPersonalTechnicalProjects';
      const path = `${collection}[${itemIndex}].bullets[${bulletIndex}]`;
      auditBullet(path, bullet, evidenceItems, provenance, issues, seenClaims);
    });
  });
}

function auditBullet(path, bullet, evidenceItems, provenance, issues, seenClaims) {
  const matches = matchEvidence(bullet, evidenceItems);
  const sourceRefs = matches.map((match) => match.id);
  const normalizedClaim = normalizeClaim(bullet);
  provenance.push({
    path,
    text: bullet,
    rewritten: false,
    sourceRefs,
    evidenceIds: sourceRefs,
  });

  lintTone(path, bullet, issues, sourceRefs);
  lintDuplicates(path, bullet, normalizedClaim, seenClaims, issues, sourceRefs);

  if (WEAK_VERB_PATTERNS.some((pattern) => pattern.test(bullet))) {
    issues.push(buildIssue('weak-verb', 'warning', path, 'Bullet starts with a weak or generic verb. Prefer a more concrete action when evidence allows it.', bullet, sourceRefs));
  }
}

function lintTone(path, text, issues, sourceRefs) {
  if (PROMOTIONAL_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(buildIssue('promotional-language', 'error', path, 'Promotional or puffery phrasing is not allowed in CV output.', text, sourceRefs));
  }

  if (UNSUPPORTED_PATTERNS.some((pattern) => pattern.test(text))) {
    issues.push(buildIssue('unsupported-claim', 'error', path, 'Claim reads as prestige signaling rather than defensible evidence.', text, sourceRefs));
  }
}

function lintDuplicates(path, text, normalizedClaim, seenClaims, issues, sourceRefs) {
  if (!normalizedClaim) return;
  const existing = seenClaims.get(normalizedClaim);
  if (existing) {
    issues.push(buildIssue('duplicate-claim', 'error', path, `Claim duplicates ${existing.path}.`, text, sourceRefs));
    return;
  }
  seenClaims.set(normalizedClaim, { path, text });
}

function buildEvidenceIndex(cv, experienceBank) {
  const items = [];

  splitSentences(cv.summary).forEach((sentence, index) => {
    items.push(createEvidenceItem(`summary[${index}]`, sentence));
  });

  cv.professionalExperience.forEach((job, jobIndex) => {
    job.bullets.forEach((bullet, bulletIndex) => {
      items.push(createEvidenceItem(`professionalExperience[${jobIndex}].bullets[${bulletIndex}]`, bullet));
    });
  });

  (cv.selectedStrategicContributions || []).forEach((bullet, index) => {
    items.push(createEvidenceItem(`selectedStrategicContributions[${index}]`, bullet));
  });

  (cv.selectedPersonalTechnicalProjects || []).forEach((project, projectIndex) => {
    (project.bullets || []).forEach((bullet, bulletIndex) => {
      items.push(createEvidenceItem(`selectedPersonalTechnicalProjects[${projectIndex}].bullets[${bulletIndex}]`, bullet));
    });
  });

  (cv.thoughtLeadershipPublications || []).forEach((entry, entryIndex) => {
    (entry.bullets || []).forEach((bullet, bulletIndex) => {
      items.push(createEvidenceItem(`thoughtLeadershipPublications[${entryIndex}].bullets[${bulletIndex}]`, bullet));
    });
  });

  if (experienceBank?.sections) {
    experienceBank.sections.forEach((section) => {
      section.bullets.forEach((bullet, bulletIndex) => {
        items.push(createEvidenceItem(`experienceBank.sections[${section.id}].bullets[${bulletIndex}]`, bullet));
      });
    });
  }

  return items.filter((item) => item.tokens.length > 0);
}

function createEvidenceItem(id, text) {
  return {
    id,
    text,
    tokens: tokenize(text),
  };
}

function matchEvidence(text, evidenceItems) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  return evidenceItems
    .filter((item) => item.text !== text)
    .map((item) => ({
      ...item,
      overlap: countOverlap(tokens, item.tokens),
    }))
    .filter((item) => item.overlap >= 2)
    .sort((left, right) => right.overlap - left.overlap)
    .slice(0, 3);
}

function countOverlap(left, right) {
  const rightSet = new Set(right);
  return left.filter((token) => rightSet.has(token)).length;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+/.-]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''))
    .filter((token) => token.length >= 4)
    .filter((token) => !STOPWORDS.has(token));
}

function normalizeClaim(text) {
  const tokens = tokenize(text);
  if (tokens.length < 5) return '';
  return tokens.join(' ');
}

function splitSentences(text) {
  return String(text)
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildIssue(code, severity, path, message, text, sourceRefs) {
  return {
    code,
    severity,
    path,
    message,
    text,
    sourceRefs,
  };
}
