#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'career-ops', 'tracking');

const PROFILE_CONFIG = {
  pravin: {
    candidateName: 'Pravin Sail',
    profileId: 'pravin',
    matchers: [
      /Pravin_Sail_CV\.pdf$/i,
      /cv-pravin-sail-.*\.pdf$/i,
      /CV_—_Pravin_Sail_CV\.pdf$/i,
    ],
  },
  anushka: {
    candidateName: 'Anushka Anil Sail',
    profileId: 'anushka-anil-sail',
    matchers: [
      /Anushka_Anil_Sail.*\.pdf$/i,
    ],
  },
};

const SEARCH_ROOTS = [
  path.join(root, 'career-ops', 'output'),
  path.join(root, 'career-ops', 'generated', 'roles'),
  path.join(root, 'rendercv-theme-lab', 'generated', 'roles'),
];

const COMPANY_MAP = new Map([
  ['anthropic', 'Anthropic'],
  ['bayer', 'Bayer'],
  ['biontech', 'BioNTech'],
  ['bmw-group', 'BMW Group'],
  ['boehringer', 'Boehringer Ingelheim'],
  ['cognizant', 'Cognizant'],
  ['daiichi-sankyo', 'Daiichi Sankyo'],
  ['digital-transformation-lead-corporate-platforms-global-business-systems', 'Daiichi Sankyo'],
  ['director-regional-head-of-technology-medtech-ep-cnv-emea', 'Johnson & Johnson'],
  ['ecb', 'European Central Bank'],
  ['ej-legal', 'EJ Legal'],
  ['eppendorf', 'Eppendorf'],
  ['ergomed', 'Ergomed'],
  ['eurofins', 'Eurofins'],
  ['fresenius', 'Fresenius'],
  ['grunenthal', 'Grunenthal'],
  ['iqvia', 'IQVIA'],
  ['johnson-johnson', 'Johnson & Johnson'],
  ['mama-health', 'Mama Health'],
  ['michael-page', 'Michael Page'],
  ['merck', 'Merck'],
  ['morgan-philips', 'Morgan Philips'],
  ['msd', 'MSD'],
  ['nnit', 'NNIT'],
  ['novartis', 'Novartis'],
  ['nvidia', 'NVIDIA'],
  ['porsche-consulting', 'Porsche Consulting'],
  ['publicis', 'Publicis Groupe'],
  ['publicis-sapient', 'Publicis Sapient'],
  ['redcare-pharmacy', 'Redcare Pharmacy'],
  ['relx', 'RELX / LexisNexis'],
  ['roche', 'Roche'],
  ['sap', 'SAP'],
  ['sierra', 'Sierra'],
  ['siemens-healthineers', 'Siemens Healthineers'],
  ['simon-kucher', 'Simon-Kucher'],
  ['sirio', 'SIRIO Europe'],
  ['takeda', 'Takeda'],
  ['teva', 'Teva'],
  ['veeva', 'Veeva'],
]);

const URL_MAP = new Map([
  ['ej-legal-ip-paralegal-anushka', 'https://www.ejlegal.co.uk/job/ip-paralegal?utm_source=chatgpt.com'],
  ['michael-page-paralegal-anushka', 'https://www.michaelpage.co.uk/job-detail/paralegal/ref/jn-062026-7032954?utm_source=chatgpt.com'],
  ['michael-page-ip-paralegal-anushka', 'https://www.michaelpage.co.uk/job-detail/ip-paralegal/ref/jn-022026-6942784?utm_source=chatgpt.com'],
  ['michael-page-paralegal-6-month-ftc-anushka', 'https://www.michaelpage.co.uk/job-detail/paralegal-6-month-ftc/ref/jn-062026-7040195?utm_source=chatgpt.com'],
  ['michael-page-conveyancing-paralegal-anushka', 'https://www.michaelpage.co.uk/job-detail/conveyancing-paralegal/ref/jn-042026-6994489?utm_source=chatgpt.com'],
  ['relx-content-writer-regulatory-anushka', 'https://relx.wd3.myworkdayjobs.com/en-US/relx/job/Content-Writer---Regulatory-content_R113552-1'],
  ['relx-legal-technical-editor-anushka', 'https://relx.wd3.myworkdayjobs.com/en-US/relx/job/Legal-Technical-Editor_R114578-1'],
  ['relx-legal-analyst-legislation-anushka', 'https://relx.wd3.myworkdayjobs.com/en-US/relx/job/Legal-Analyst-Legislation_R114266-1'],
]);

const STOPWORD_COMPANY_PREFIXES = new Set([
  'head', 'business', 'enterprise', 'laboratory', 'data', 'technical', 'process',
  'senior', 'integration', 'cv',
]);

const TITLE_WORD_MAP = new Map([
  ['ai', 'AI'],
  ['it', 'IT'],
  ['sap', 'SAP'],
  ['s4hana', 'S/4HANA'],
  ['s-4hana', 'S/4HANA'],
  ['lims', 'LIMS'],
  ['mes', 'MES'],
  ['gxp', 'GxP'],
  ['emea', 'EMEA'],
  ['ep', 'EP'],
  ['cnv', 'CNV'],
  ['uk', 'UK'],
  ['us', 'U.S.'],
  ['rpa', 'RPA'],
  ['cto', 'CTO'],
  ['ceo', 'CEO'],
  ['xml', 'XML'],
  ['html', 'HTML'],
  ['relx', 'RELX'],
]);

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  const pdfFiles = [];
  for (const dir of SEARCH_ROOTS) {
    if (await exists(dir)) {
      pdfFiles.push(...await walk(dir));
    }
  }

  const filtered = pdfFiles
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .filter((file) => !file.includes('/archived/'))
    .filter((file) => !file.includes('/rendercv/generated/roles/') || file.endsWith('.pdf'))
    .sort();

  const rowsByProfile = {
    pravin: [],
    anushka: [],
  };

  for (const pdfPath of filtered) {
    for (const [key, config] of Object.entries(PROFILE_CONFIG)) {
      if (config.matchers.some((matcher) => matcher.test(pdfPath))) {
        rowsByProfile[key].push(await buildRow(config, pdfPath));
        break;
      }
    }
  }

  for (const [key, config] of Object.entries(PROFILE_CONFIG)) {
    const fileName = `${key}-pdf-application-tracker.csv`;
    const csvPath = path.join(outDir, fileName);
    await fs.writeFile(csvPath, toCsv(rowsByProfile[key]), 'utf8');
  }

  const mdPath = path.join(outDir, 'pdf-application-tracker.md');
  await fs.writeFile(mdPath, toMarkdown(rowsByProfile), 'utf8');

  console.log(path.relative(root, outDir));
}

async function buildRow(config, pdfPath) {
  const normalizedPdfPath = toAbsolute(pdfPath);
  const roleContext = deriveRoleContext(normalizedPdfPath, config);
  const cvMdPath = await findCvMdPath(normalizedPdfPath, roleContext, config);

  return {
    profile_name: config.candidateName,
    candidate_name: config.candidateName,
    profile_id: config.profileId,
    company_name: roleContext.companyName,
    role_name: roleContext.roleName,
    job_description: roleContext.roleName,
    role_identifier: roleContext.roleIdentifier,
    source_url: URL_MAP.get(roleContext.roleIdentifier) ?? '',
    cv_md_path: cvMdPath,
    pdf_path: normalizedPdfPath,
    pdf_created_marker: 'YES',
  };
}

function deriveRoleContext(pdfPath, config) {
  const rel = path.relative(root, pdfPath);
  const parts = rel.split(path.sep);
  let roleIdentifier = '';

  const rolesIndex = parts.lastIndexOf('roles');
  if (rolesIndex >= 0 && parts[rolesIndex + 1]) {
    roleIdentifier = parts[rolesIndex + 1];
  } else {
    roleIdentifier = deriveIdentifierFromFileName(path.basename(pdfPath), config);
  }

  const companyName = deriveCompanyName(roleIdentifier);
  const roleName = deriveRoleName(roleIdentifier, companyName, pdfPath, config);

  return { roleIdentifier, companyName, roleName };
}

function deriveIdentifierFromFileName(fileName, config) {
  let base = fileName.replace(/\.pdf$/i, '');
  if (config.profileId === 'pravin') {
    base = base
      .replace(/^cv-pravin-sail-/i, '')
      .replace(/^CV_—_Pravin_Sail_CV/i, '')
      .replace(/^Pravin_Sail_CV/i, 'pravin-sail-cv')
      .replace(/-\d{4}-\d{2}-\d{2}$/i, '');
  } else {
    base = base
      .replace(/^Anushka_Anil_Sail_/i, '')
      .replace(/^Anushka_Anil_Sail/i, 'anushka-anil-sail');
  }
  return slugify(base);
}

function deriveCompanyName(roleIdentifier) {
  for (const [key, value] of COMPANY_MAP.entries()) {
    if (roleIdentifier.startsWith(key)) return value;
  }
  const first = roleIdentifier.split('-')[0] ?? '';
  if (!first || STOPWORD_COMPANY_PREFIXES.has(first)) return '';
  return titleize(first);
}

function deriveRoleName(roleIdentifier, companyName, pdfPath, config) {
  const baseName = path.basename(pdfPath, '.pdf');
  let stripped = roleIdentifier;

  if (config.profileId === 'anushka-anil-sail' || config.profileId === 'anushka') {
    if (baseName.startsWith('Anushka_Anil_Sail_')) {
      const extracted = baseName
        .replace(/^Anushka_Anil_Sail_/, '')
        .replace(/_/g, ' ')
        .trim();
      if (extracted.toLowerCase() !== 'cv') return extracted;
    }
  }

  if (baseName.startsWith('cv-pravin-sail-')) {
    const stem = baseName
      .replace(/^cv-pravin-sail-/, '')
      .replace(/-\d{4}-\d{2}-\d{2}$/, '');
    return titleize(stem);
  }

  if (baseName === 'Pravin_Sail_CV' || baseName === 'Anushka_Anil_Sail_CV') {
    return titleize(stripped || roleIdentifier);
  }

  if (companyName) {
    for (const [key, value] of COMPANY_MAP.entries()) {
      if (value === companyName && stripped.startsWith(key + '-')) {
        stripped = stripped.slice(key.length + 1);
        break;
      }
    }
  }

  return titleize(stripped || roleIdentifier);
}

async function findCvMdPath(pdfPath, roleContext, config) {
  const candidates = [];
  const pdfDir = path.dirname(pdfPath);

  candidates.push(path.join(pdfDir, 'cv.md'));
  candidates.push(path.join(pdfDir, 'CV_—_Pravin_Sail_CV.md'));
  candidates.push(path.join(path.dirname(pdfDir), 'cv.md'));
  candidates.push(path.join(root, 'career-ops', 'generated', 'roles', roleContext.roleIdentifier, 'cv.md'));
  candidates.push(path.join(root, 'career-ops', 'profiles', config.profileId, 'roles', `${roleContext.roleIdentifier.replace(/-anushka$/, '')}-cv.md`));

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return toAbsolute(candidate);
    }
  }
  return '';
}

function toCsv(rows) {
  const headers = [
    'profile_name',
    'candidate_name',
    'profile_id',
    'company_name',
    'role_name',
    'job_description',
    'role_identifier',
    'source_url',
    'cv_md_path',
    'pdf_path',
    'pdf_created_marker',
  ];
  const body = rows.map((row) => headers.map((key) => csvEscape(row[key] ?? '')).join(','));
  return [headers.join(','), ...body].join('\n') + '\n';
}

function toMarkdown(rowsByProfile) {
  const sections = [];
  sections.push('# PDF Application Tracker');
  sections.push('');
  sections.push(`Generated on ${new Date().toISOString().slice(0, 10)}.`);
  sections.push('');

  for (const [key, rows] of Object.entries(rowsByProfile)) {
    const title = key === 'pravin' ? 'Pravin Sail' : 'Anushka Anil Sail';
    sections.push(`## ${title}`);
    sections.push('');
    sections.push('| Company | Role | Source URL | CV Path | PDF Path |');
    sections.push('|---|---|---|---|---|');
    for (const row of rows) {
      sections.push(`| ${md(row.company_name)} | ${md(row.role_name)} | ${md(row.source_url)} | ${md(row.cv_md_path)} | ${md(row.pdf_path)} |`);
    }
    sections.push('');
  }

  return sections.join('\n');
}

function titleize(input) {
  return input
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => TITLE_WORD_MAP.get(part.toLowerCase()) ?? capitalize(part))
    .join(' ')
    .replace(/\bM F D\b/g, 'M/F/D');
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function csvEscape(value) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function md(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function toAbsolute(target) {
  return path.isAbsolute(target) ? target : path.join(root, target);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
