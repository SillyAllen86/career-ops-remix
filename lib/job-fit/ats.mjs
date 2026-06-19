import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HARD_SKILL_HINTS = [
  'cloud',
  'api',
  'apis',
  'erp',
  'crm',
  'mes',
  'ai',
  'ml',
  'genai',
  'analytics',
  'data platform',
  'data platforms',
  'product management',
  'agile',
  'portfolio governance',
  'cybersecurity',
  'privacy',
  'security',
  'computer vision',
  'connected devices',
  'telemetry',
];

const SOFT_SKILL_HINTS = [
  'communication',
  'influence',
  'stakeholder partnership',
  'stakeholder management',
  'leadership',
  'change leadership',
  'collaborator',
  'executive presence',
  'people leadership',
  'entrepreneurial',
];

const DOMAIN_SKILL_HINTS = [
  'medtech',
  'electrophysiology',
  'neurovascular',
  'commercial',
  'supply chain',
  'field service',
  'customer engagement',
  'regulatory',
  'quality',
  'connected capital equipment',
  'digital surgery',
  'robotics',
  'imaging',
];

const STACK_PATTERNS = [
  'ERP',
  'CRM',
  'MES',
  'AI/ML',
  'GenAI',
  'cloud',
  'APIs',
  'analytics',
  'data platforms',
  'computer vision',
  'connected devices',
  'telemetry',
  'cybersecurity',
  'privacy-by-design',
];

export function generateAtsAnalysis(jobDir) {
  const jdPath = resolve(jobDir, 'jd.md');
  const atsPath = resolve(jobDir, 'ats-analysis.json');
  const jdMarkdown = readFileSync(jdPath, 'utf8');
  const normalizedJd = extractNormalizedJd(jdMarkdown);
  const sections = parseSections(normalizedJd);

  const responsibilities = extractResponsibilities(sections);
  const requiredLines = [
    ...(sections.required || []),
    ...(sections.qualifications || []),
    ...(sections['required skills'] || []),
  ];
  const preferredLines = [
    ...(sections.preferred || []),
    ...(sections['preferred skills'] || []),
  ];

  const mustHave = categorizeSkills(requiredLines, normalizedJd);
  const niceToHave = uniquePreserveOrder([
    ...extractSkillPhrases(preferredLines, HARD_SKILL_HINTS),
    ...extractSkillPhrases(preferredLines, SOFT_SKILL_HINTS),
    ...extractSkillPhrases(preferredLines, DOMAIN_SKILL_HINTS),
  ]);

  const toolsAndStack = detectStack(normalizedJd);
  const atsKeywords = buildAtsKeywords({
    text: normalizedJd,
    requiredLines,
    preferredLines,
    responsibilities,
    toolsAndStack,
    mustHave,
    niceToHave,
  });

  const analysis = JSON.parse(readFileSync(atsPath, 'utf8'));
  analysis.status = normalizedJd.includes('<Paste the normalized job description here>') ? 'blocked' : 'completed';
  analysis.extracted_from = 'jd.md';
  analysis.core_responsibilities = responsibilities;
  analysis.must_have_skills = mustHave;
  analysis.nice_to_have_skills = niceToHave;
  analysis.tools_and_stack = toolsAndStack;
  analysis.ats_keywords = atsKeywords;
  analysis.notes = analysis.status === 'completed'
    ? 'ATS analysis generated from normalized JD text.'
    : 'JD source is still placeholder text. Populate jd.md first.';

  writeFileSync(atsPath, `${JSON.stringify(analysis, null, 2)}\n`);
  return analysis;
}

export function extractNormalizedJd(markdown) {
  const marker = '## Normalized JD';
  const idx = markdown.indexOf(marker);
  if (idx === -1) return markdown.trim();
  return markdown.slice(idx + marker.length).trim();
}

function parseSections(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = {};
  let current = 'body';
  sections[current] = [];

  for (const line of lines) {
    if (isSectionHeading(line)) {
      current = normalizeSectionKey(line);
      if (!sections[current]) sections[current] = [];
      continue;
    }
    sections[current].push(cleanLine(line));
  }

  return sections;
}

function extractResponsibilities(sections) {
  const candidates = [
    ...(sections['key responsibilities'] || []),
    ...(sections['strategy outcomes'] || []),
    ...(sections['ai data digital'] || []),
    ...(sections['product management delivery'] || []),
    ...(sections['leadership talent'] || []),
    ...(sections['financials governance'] || []),
    ...(sections['stakeholder market impact'] || []),
  ];

  const split = candidates.flatMap(splitCompositeLine);
  return uniquePreserveOrder(split)
    .filter((line) => line.length > 30)
    .slice(0, 16);
}

function categorizeSkills(requiredLines, fullText) {
  return {
    hard: uniquePreserveOrder([
      ...extractSkillPhrases(requiredLines, HARD_SKILL_HINTS),
      ...detectStack(fullText),
    ]),
    soft: uniquePreserveOrder(extractSkillPhrases(requiredLines, SOFT_SKILL_HINTS)),
    domain: uniquePreserveOrder(extractSkillPhrases(requiredLines, DOMAIN_SKILL_HINTS)),
  };
}

function detectStack(text) {
  const found = [];
  for (const pattern of STACK_PATTERNS) {
    if (new RegExp(`\\b${escapeRegex(pattern)}\\b`, 'i').test(text)) {
      found.push(pattern);
    }
  }
  return found;
}

function extractSkillPhrases(lines, hints) {
  const joined = lines.join(' ');
  const found = [];
  for (const hint of hints) {
    if (new RegExp(`\\b${escapeRegex(hint)}\\b`, 'i').test(joined)) {
      found.push(hint);
    }
  }
  return found;
}

function buildAtsKeywords({ text, requiredLines, preferredLines, responsibilities, toolsAndStack, mustHave, niceToHave }) {
  const candidates = uniquePreserveOrder([
    ...toolsAndStack,
    ...mustHave.hard,
    ...mustHave.soft,
    ...mustHave.domain,
    ...niceToHave,
    ...extractCandidateNgrams(text),
  ]);

  return candidates
    .map((keyword) => ({
      keyword,
      weight: scoreKeyword(keyword, { text, requiredLines, preferredLines, responsibilities }),
    }))
    .filter((entry) => entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.keyword.localeCompare(b.keyword))
    .slice(0, 25);
}

function scoreKeyword(keyword, { text, requiredLines, preferredLines, responsibilities }) {
  const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'ig');
  const fullMatches = text.match(regex)?.length || 0;
  if (!fullMatches) return 0;

  let score = 1;
  const requiredText = requiredLines.join(' ');
  const preferredText = preferredLines.join(' ');
  const responsibilityText = responsibilities.join(' ');

  if (regex.test(requiredText)) score += 2;
  regex.lastIndex = 0;
  if (regex.test(responsibilityText)) score += 1;
  regex.lastIndex = 0;
  if (regex.test(preferredText)) score += 1;

  score += Math.min(1, Math.floor(fullMatches / 2));
  return Math.min(score, 5);
}

function extractCandidateNgrams(text) {
  const phrases = [];
  const knownPhrases = [
    'regional technology strategy',
    'product and platform roadmap',
    'portfolio governance',
    'people leadership',
    'leader of leaders',
    'customer engagement',
    'supply chain',
    'field service digitization',
    'connected devices',
    'privacy-by-design',
    'responsible AI',
    'data governance',
    'business strategy',
    'product management',
    'commercial operations',
    'digital surgery',
    'computer vision',
    'imaging',
    'robotics',
    'market impact',
  ];

  for (const phrase of knownPhrases) {
    if (new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'i').test(text)) {
      phrases.push(phrase);
    }
  }
  return phrases;
}

function isSectionHeading(line) {
  const normalized = line.toLowerCase().replace(/[:–-]+$/, '').trim();
  return [
    'role overview',
    'key responsibilities',
    'strategy & outcomes',
    'ai, data & digital',
    'product management & delivery',
    'leadership & talent',
    'financials & governance',
    'stakeholder & market impact',
    'qualifications',
    'required',
    'preferred',
    'required skills',
    'preferred skills',
  ].includes(normalized);
}

function normalizeSectionKey(line) {
  return line
    .toLowerCase()
    .replace(/[:&/,()-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanLine(line) {
  return line
    .replace(/^[•*-]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitCompositeLine(line) {
  return String(line)
    .split(/(?<=[.])\s+(?=[A-Z])|(?<=\))\s+(?=[A-Z])|(?<=experience\.)\s+(?=[A-Z])/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function uniquePreserveOrder(items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const key = String(item).toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
