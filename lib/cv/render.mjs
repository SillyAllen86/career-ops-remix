import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function renderCvTemplate(cv, { rootDir = process.cwd(), templatePath = 'templates/cv-template.html', theme = 'classic' } = {}) {
  const template = readFileSync(resolve(rootDir, templatePath), 'utf8');
  const atsKeywords = compileAtsKeywords(cv);
  const replacements = {
    '{{LANG}}': 'en',
    '{{PAGE_WIDTH}}': '8.27in',
    '{{PAGE_HEIGHT}}': '11.69in',
    '{{THEME_CLASS}}': themeClass(theme),
    '{{THEME_LABEL}}': themeLabel(theme),
    '{{NAME}}': cv.profile.name,
    '{{HEADLINE_BLOCK}}': renderHeadline(cv.profile.headline),
    '{{CONTACT_ITEMS}}': renderContactItems(cv.profile),
    '{{SECTION_SUMMARY}}': 'Professional Summary',
    '{{SUMMARY_TEXT}}': cv.summary || '',
    '{{SECTION_COMPETENCIES}}': 'Core Competencies',
    '{{COMPETENCIES}}': renderTags(cv.coreAreasOfExpertise || []),
    '{{SECTION_EXPERIENCE}}': 'Work Experience',
    '{{EXPERIENCE}}': (cv.professionalExperience || []).map(renderJob).join('\n'),
    '{{SECTION_PROJECTS}}': 'Selected Projects',
    '{{PROJECTS}}': (cv.selectedPersonalTechnicalProjects || []).map(renderProject).join('\n'),
    '{{SECTION_EDUCATION}}': 'Education',
    '{{EDUCATION}}': (cv.education || []).map(renderEducation).join('\n'),
    '{{SECTION_CERTIFICATIONS}}': 'Certifications',
    '{{CERTIFICATIONS}}': (cv.certificationsAndTraining || []).map(renderCertification).join('\n'),
    '{{SECTION_SKILLS}}': 'Languages',
    '{{SKILLS}}': renderLanguages(cv.languages || []),
    '{{ATS_KEYWORDS}}': esc(atsKeywords.join(', ')),
    '{{ATS_LAYER}}': renderAtsLayer(atsKeywords),
  };

  let html = template;
  for (const [token, value] of Object.entries(replacements)) {
    html = html.replaceAll(token, value);
  }
  return html;
}

function themeClass(theme) {
  const value = String(theme || 'classic').toLowerCase();
  return `theme-${value.replace(/[^a-z0-9]+/g, '-')}`;
}

function themeLabel(theme) {
  const value = String(theme || 'classic').trim();
  if (!value) return 'Classic';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function displayUrl(url) {
  return String(url || '').replace(/^https?:\/\//, '');
}

function renderHeadline(headline) {
  if (!headline) return '';
  return `<div class="header-headline">${esc(headline)}</div>`;
}

function renderContactItems(profile) {
  const items = [
    profile.location ? `<span>${esc(profile.location)}</span>` : '',
    profile.phone ? `<span>${esc(profile.phone)}</span>` : '',
    profile.email ? `<span>${esc(profile.email)}</span>` : '',
    profile.linkedin ? `<a href="${esc(profile.linkedin)}">${esc(displayUrl(profile.linkedin))}</a>` : '',
    profile.github ? `<a href="${esc(profile.github)}">${esc(displayUrl(profile.github))}</a>` : '',
  ].filter(Boolean);

  return items.join('<span class="separator" aria-hidden="true"></span>');
}

function renderTags(items) {
  return items.map((item) => `<span class="competency-tag">${esc(item)}</span>`).join('\n      ');
}

function renderJob(job) {
  return `
    <div class="job">
      <div class="job-header">
        <div class="job-company">${esc(job.company)}</div>
        <div class="job-period">${esc(job.period)}</div>
      </div>
      <div class="job-role">${esc(job.title)}</div>
      ${job.location ? `<div class="job-location">${esc(job.location)}</div>` : ''}
      <ul>
${job.bullets.map((bullet) => `        <li>${esc(bullet)}</li>`).join('\n')}
      </ul>
    </div>`;
}

function renderProject(project) {
  const description = project.bullets.join(' ');
  return `
    <div class="project">
      <div class="project-title">${esc(project.title)} <span class="project-badge">${esc(project.role)}</span></div>
      <div class="project-desc">${esc(description)}</div>
      <div class="project-tech">${esc(project.period)}</div>
    </div>`;
}

function renderEducation(education) {
  return `
    <div class="edu-item">
      <div class="edu-header">
        <div class="edu-title">${esc(education.degree)} <span class="edu-org">- ${esc(education.institution)}</span></div>
        <div class="edu-year">${esc(education.years)}</div>
      </div>
    </div>`;
}

function renderCertification(certification) {
  return `
    <div class="cert-item">
      <div class="cert-title">${esc(certification)}</div>
    </div>`;
}

function renderLanguages(languages) {
  if (!languages || languages.length === 0) return '';
  const items = languages.map((item) => `${item.language}${item.proficiency ? ` — ${item.proficiency}` : ''}`);
  return `
    <div class="skills-grid">
      <div class="skill-item">${esc(items.join(' · '))}</div>
    </div>`;
}

function compileAtsKeywords(cv) {
  const seen = new Set();
  const keywords = [];

  function add(items) {
    for (const item of items) {
      const key = String(item).toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        keywords.push(String(item).trim());
      }
    }
  }

  add(cv.coreAreasOfExpertise || []);
  add((cv.domainsAndSystemsKnowledge?.domains || []).slice(0, 12));
  add((cv.domainsAndSystemsKnowledge?.systems || []).slice(0, 16));

  return keywords;
}

function renderAtsLayer(keywords) {
  if (!keywords || keywords.length === 0) return '';
  return `
  <div class="ats-layer">
    <span class="ats-layer-label">Technical Proficiencies: </span>${esc(keywords.join(' · '))}
  </div>`;
}
