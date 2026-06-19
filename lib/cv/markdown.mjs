import { createHash } from 'node:crypto';

const SECTION = {
  HEADLINE: 'Headline',
  SUMMARY: 'Professional Summary',
  CORE_AREAS: 'Core Areas of Expertise',
  DOMAINS: 'Domains & Systems Knowledge',
  EXPERIENCE: 'Professional Experience',
  STRATEGIC: 'Selected Strategic Contributions',
  PROJECTS: 'Selected Personal / Technical Projects',
  THOUGHT: 'Thought Leadership / Publications',
  EDUCATION: 'Education',
  CERTIFICATIONS: 'Certifications & Training',
  LANGUAGES: 'Languages',
  SKILLS: 'Skills and Keyword Bank',
};

const SECTION_ALIASES = {
  'Core Competencies': SECTION.CORE_AREAS,
  'Core Areas': SECTION.CORE_AREAS,
  'Domains and Systems Knowledge': SECTION.DOMAINS,
  'Selected Technical Projects': SECTION.PROJECTS,
  'AI / Technical Projects': SECTION.PROJECTS,
  'Applied AI & Workflow Prototyping': SECTION.PROJECTS,
  'Role-Relevant Value Proposition': SECTION.STRATEGIC,
  'AI And Analytics Enablement In Regulated Operations': SECTION.STRATEGIC,
  'Thought Leadership': SECTION.THOUGHT,
  Certifications: SECTION.CERTIFICATIONS,
};

const IGNORED_SECTIONS = new Set([
  'Cover Letter Notes (for reference — not part of CV)',
]);

const KNOWN_SECTION_TITLES = new Set(Object.values(SECTION));

export function parseCvMarkdown(markdown, { sourcePath = 'cv.md', lastModified = new Date().toISOString(), strict = true } = {}) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const sha256 = createHash('sha256').update(normalized, 'utf8').digest('hex');
  const titleLine = lines.find((line) => /^#\s+/.test(line.trim())) || '# CV';
  const name = extractNameFromTitle(titleLine);

  const profile = {
    name,
    headline: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
  };

  let section = null;
  let currentExperience = null;
  let currentProject = null;
  let currentThought = null;
  let currentSkillGroup = null;
  let currentSectionHeading = null;
  let currentCustomSection = null;

  const summaryLines = [];
  const coreAreasOfExpertise = [];
  const coreAreaGroups = [];
  const domains = [];
  const systems = [];
  const professionalExperience = [];
  const selectedStrategicContributions = [];
  const selectedPersonalTechnicalProjects = [];
  const thoughtLeadershipPublications = [];
  const education = [];
  const certificationsAndTraining = [];
  const languages = [];
  const skillsAndKeywordBank = [];
  const sectionOrder = [];
  const customSections = [];

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    if (/^#\s+/.test(line)) {
      continue;
    }

    if (line === '---') {
      continue;
    }

    const majorHeading = line.match(/^##\s+(.+)$/);
    if (majorHeading) {
      finalizeOpenItem();
      currentSectionHeading = stripInlineMarkdown(majorHeading[1].trim());
      section = normalizeSectionHeading(currentSectionHeading);
      currentSkillGroup = null;
      currentCustomSection = null;
      if (IGNORED_SECTIONS.has(section)) {
        continue;
      }
      if (KNOWN_SECTION_TITLES.has(section)) {
        pushUnique(sectionOrder, section);
      } else {
        currentCustomSection = {
          id: `custom::${customSections.length + 1}::${slugify(currentSectionHeading) || 'section'}`,
          title: currentSectionHeading,
          lines: [],
        };
        customSections.push(currentCustomSection);
        sectionOrder.push(currentCustomSection.id);
      }
      continue;
    }

    if (section === SECTION.HEADLINE) {
      profile.headline = stripInlineMarkdown(line);
      continue;
    }

    if (section === null) {
      const meta = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
      if (meta) {
        const key = meta[1].trim().toLowerCase();
        const value = stripInlineMarkdown(meta[2].trim());
        if (key === 'headline') profile.headline = value;
        if (key === 'location') profile.location = value;
        if (key === 'email') profile.email = value;
        if (key === 'phone') profile.phone = value;
        if (key === 'linkedin') profile.linkedin = value;
        if (key === 'github') profile.github = value;
      } else {
        const labeled = line.match(/^(Location|Email|Phone|LinkedIn|GitHub):\s*(.+)$/i);
        if (labeled) {
          const key = labeled[1].trim().toLowerCase();
          const value = stripInlineMarkdown(labeled[2].trim());
          if (key === 'location') profile.location = value;
          if (key === 'email') profile.email = value;
          if (key === 'phone') profile.phone = value;
          if (key === 'linkedin') profile.linkedin = value;
          if (key === 'github') profile.github = value;
        } else {
          const value = stripInlineMarkdown(line);
          if (!profile.location && looksLikeLocation(value)) profile.location = value;
          else if (!profile.email && looksLikeEmail(value)) profile.email = value;
          else if (!profile.phone && looksLikePhone(value)) profile.phone = value;
          else if (!profile.linkedin && /linkedin\.com/i.test(value)) profile.linkedin = value;
          else if (!profile.github && /github\.com/i.test(value)) profile.github = value;
        }
      }
      continue;
    }

    if (currentCustomSection) {
      currentCustomSection.lines.push(rawLine.trim());
      continue;
    }

    if (section === SECTION.SUMMARY) {
      summaryLines.push(stripInlineMarkdown(line));
      continue;
    }

    if (section === SECTION.CORE_AREAS) {
      const groupHeading = line.match(/^\*\*(.+?)\*\*$/);
      if (groupHeading) {
        coreAreaGroups.push(stripInlineMarkdown(groupHeading[1].trim()));
        continue;
      }
      if (line.startsWith('- ')) coreAreasOfExpertise.push(stripInlineMarkdown(line.slice(2).trim()));
      continue;
    }

    if (section === SECTION.DOMAINS) {
      if (line.startsWith('**Domains:**')) {
        domains.push(...splitSemiColonList(line.replace(/^\*\*Domains:\*\*\s*/, '')));
      } else if (
        line.startsWith('**Systems / Platforms / Technologies:**')
        || line.startsWith('**Systems / Platform Context:**')
      ) {
        systems.push(...splitSemiColonList(line.replace(/^\*\*Systems \/ (?:Platforms \/ Technologies|Platform Context):\*\*\s*/, '')));
      }
      continue;
    }

    if (section === SECTION.EXPERIENCE) {
      const experienceHeading = line.match(/^###\s+(.+)$/);
      if (experienceHeading) {
        finalizeOpenItem();
        const headingText = stripInlineMarkdown(experienceHeading[1].trim());
        if (/\(target role\)/i.test(headingText)) {
          currentExperience = null;
          continue;
        }
        const [company, title] = splitCompanyAndTitle(headingText);
        currentExperience = {
          company,
          title,
          period: '',
          bullets: [],
        };
        continue;
      }

      if (currentExperience && line.startsWith('**') && line.endsWith('**') && !currentExperience.period) {
        const content = stripInlineMarkdown(line.slice(2, -2).trim());
        const [maybeLocation, maybePeriod] = content.split(' | ').map((part) => part.trim());
        if (maybePeriod) {
          if (maybeLocation) currentExperience.location = maybeLocation;
          currentExperience.period = maybePeriod;
        } else {
          currentExperience.period = maybeLocation;
        }
        continue;
      }

      if (currentExperience && line.startsWith('- ')) {
        currentExperience.bullets.push(stripInlineMarkdown(line.slice(2).trim()));
      }
      continue;
    }

    if (section === SECTION.STRATEGIC) {
      if (line.startsWith('- ')) selectedStrategicContributions.push(stripInlineMarkdown(line.slice(2).trim()));
      continue;
    }

    if (section === SECTION.PROJECTS) {
      const projectHeading = line.match(/^###\s+(.+)$/);
      if (projectHeading) {
        finalizeOpenItem();
        currentProject = {
          title: stripInlineMarkdown(projectHeading[1].trim()),
          role: 'Portfolio project',
          period: 'Selected',
          bullets: [],
        };
        continue;
      }

      const roleLine = line.match(/^\*\*Role:\*\*\s*(.+?)(?:\s*\|\s*\*\*Years?:\*\*\s*(.+))?$/i);
      if (!currentProject && line !== '---') {
        currentProject = createImplicitProject(currentSectionHeading);
      }
      if (currentProject && roleLine) {
        if (roleLine[1]) currentProject.role = stripInlineMarkdown(roleLine[1].trim());
        if (roleLine[2]) currentProject.period = stripInlineMarkdown(roleLine[2].trim());
        continue;
      }

      if (currentProject && line.startsWith('- ')) currentProject.bullets.push(stripInlineMarkdown(line.slice(2).trim()));
      else if (currentProject && line !== '---' && !line.startsWith('###')) {
        currentProject.bullets.push(stripInlineMarkdown(line));
      }
      continue;
    }

    if (section === SECTION.THOUGHT) {
      const thoughtHeading = line.match(/^###\s+(.+)$/);
      if (thoughtHeading) {
        finalizeOpenItem();
        const headingText = stripInlineMarkdown(thoughtHeading[1].trim());
        const yearMatch = headingText.match(/^(.*)\s+\|\s+(\d{4})$/);
        currentThought = {
          title: yearMatch ? yearMatch[1].trim() : headingText,
          role: 'Author',
          year: yearMatch ? yearMatch[2] : '',
          bullets: [],
        };
        continue;
      }

      const thoughtMeta = line.match(/^\*\*(.+)\*\*$/);
      const thoughtLine = line.match(/^\*\*Role:\*\*\s*(.+?)(?:\s*\|\s*\*\*Year:\*\*\s*(.+))?$/i);
      if (currentThought && thoughtLine) {
        if (thoughtLine[1]) currentThought.role = stripInlineMarkdown(thoughtLine[1].trim());
        if (thoughtLine[2]) currentThought.year = stripInlineMarkdown(thoughtLine[2].trim());
        continue;
      }

      if (currentThought && thoughtMeta) {
        const content = stripInlineMarkdown(thoughtMeta[1].trim());
        const [maybeRole, maybeYear] = content.split(/\s*\|\s*/).map((part) => part.trim());
        if (maybeRole) currentThought.role = maybeRole;
        if (maybeYear) currentThought.year = maybeYear;
        continue;
      }

      if (currentThought && line.startsWith('- ')) currentThought.bullets.push(stripInlineMarkdown(line.slice(2).trim()));
      else if (currentThought && line !== '---' && !line.startsWith('###')) {
        currentThought.bullets.push(stripInlineMarkdown(line));
      }
      continue;
    }

    if (section === SECTION.EDUCATION) {
      if (line.startsWith('- ')) {
        const item = parseEducationLine(line.slice(2).trim());
        if (item) education.push(item);
      }
      continue;
    }

    if (section === SECTION.CERTIFICATIONS) {
      if (line.startsWith('- ')) certificationsAndTraining.push(stripInlineMarkdown(line.slice(2).trim()));
      continue;
    }

    if (section === SECTION.LANGUAGES) {
      if (line.startsWith('- ')) languages.push(parseLanguageLine(line.slice(2).trim()));
      continue;
    }

    if (section === SECTION.SKILLS) {
      const skillHeading = line.match(/^###\s+(.+)$/);
      if (skillHeading) {
        finalizeOpenItem();
        currentSkillGroup = {
          category: stripInlineMarkdown(skillHeading[1].trim()),
          items: [],
        };
        skillsAndKeywordBank.push(currentSkillGroup);
        continue;
      }

      if (currentSkillGroup && line.startsWith('- ')) {
        currentSkillGroup.items.push(stripInlineMarkdown(line.slice(2).trim()));
      }
    }
  }

  finalizeOpenItem();

  if (skillsAndKeywordBank.length === 0) {
    const fallbackSkills = [...coreAreasOfExpertise.slice(0, 12)];
    if (fallbackSkills.length > 0) {
      skillsAndKeywordBank.push({
        category: 'Core Areas',
        items: fallbackSkills,
      });
    }
  }

  if (domains.length === 0 && coreAreaGroups.length > 0) {
    domains.push(...coreAreaGroups);
  }

  if (systems.length === 0 && coreAreasOfExpertise.length > 0) {
    systems.push(...coreAreasOfExpertise.slice(0, 6));
  }

  if (selectedStrategicContributions.length === 0 && professionalExperience.length > 0) {
    selectedStrategicContributions.push(
      ...professionalExperience
        .flatMap((job) => job.bullets.slice(0, 1))
        .filter(Boolean)
        .slice(0, 4),
    );
  }

  for (const item of thoughtLeadershipPublications) {
    if (!item.year) {
      const yearMatch = item.title.match(/^(.*)\s+\|\s+(\d{4})$/);
      if (yearMatch) {
        item.title = yearMatch[1].trim();
        item.year = yearMatch[2];
      }
    }
  }

  return {
    schemaVersion: '1.0.0',
    generatedAt: lastModified,
    source: {
      path: sourcePath,
      title: titleLine.replace(/^#\s+/, '').trim(),
      sha256,
      lineCount: lines.length,
      lastModified,
    },
    profile,
    summary: summaryLines.join(' ').trim(),
    coreAreasOfExpertise,
    domainsAndSystemsKnowledge: {
      domains,
      systems,
    },
    professionalExperience,
    selectedStrategicContributions,
    selectedPersonalTechnicalProjects,
    thoughtLeadershipPublications,
    education,
    certificationsAndTraining,
    languages,
    skillsAndKeywordBank,
    sectionOrder,
    customSections,
  };

  function finalizeOpenItem() {
    if (currentExperience) {
      professionalExperience.push(currentExperience);
      currentExperience = null;
    }
    if (currentProject) {
      selectedPersonalTechnicalProjects.push(currentProject);
      currentProject = null;
    }
    if (currentThought) {
      thoughtLeadershipPublications.push(currentThought);
      currentThought = null;
    }
  }
}

export function renderNormalizedMarkdown(cv) {
  const lines = [];
  lines.push(`# CV -- ${cv.profile?.name || 'CV'}`);
  lines.push('');
  if (cv.profile?.headline) lines.push(`**Headline:** ${cv.profile.headline}`);
  if (cv.profile?.location) lines.push(`**Location:** ${cv.profile.location}`);
  if (cv.profile?.email) lines.push(`**Email:** ${cv.profile.email}`);
  if (cv.profile?.phone) lines.push(`**Phone:** ${cv.profile.phone}`);
  if (cv.profile?.linkedin) lines.push(`**LinkedIn:** ${cv.profile.linkedin}`);
  if (cv.profile?.github) lines.push(`**GitHub:** ${cv.profile.github}`);
  lines.push('');

  const customById = new Map((cv.customSections || []).map((section) => [section.id, section]));
  const sectionOrder = Array.isArray(cv.sectionOrder) && cv.sectionOrder.length > 0
    ? cv.sectionOrder
    : defaultSectionOrder(cv);

  for (const sectionId of sectionOrder) {
    const rendered = renderSection(sectionId, cv, customById);
    if (rendered.length === 0) continue;
    lines.push(...rendered);
    lines.push('');
  }

  return lines.join('\n');
}

function renderSection(sectionId, cv, customById) {
  switch (sectionId) {
    case SECTION.SUMMARY:
      return cv.summary ? [toHeading(SECTION.SUMMARY), '', cv.summary] : [];
    case SECTION.CORE_AREAS:
      return (cv.coreAreasOfExpertise || []).length
        ? [toHeading(SECTION.CORE_AREAS), '', ...(cv.coreAreasOfExpertise || []).map((item) => `- ${item}`)]
        : [];
    case SECTION.DOMAINS: {
      const domains = cv.domainsAndSystemsKnowledge?.domains || [];
      const systems = cv.domainsAndSystemsKnowledge?.systems || [];
      if (!domains.length && !systems.length) return [];
      const out = [toHeading(SECTION.DOMAINS), ''];
      if (domains.length) out.push(`**Domains:** ${domains.join('; ')}`, '');
      if (systems.length) out.push(`**Systems / Platforms / Technologies:** ${systems.join('; ')}`);
      return out;
    }
    case SECTION.EXPERIENCE:
      return (cv.professionalExperience || []).length
        ? [
            toHeading(SECTION.EXPERIENCE),
            '',
            ...renderExperienceSection(cv.professionalExperience || []),
          ]
        : [];
    case SECTION.STRATEGIC:
      return (cv.selectedStrategicContributions || []).length
        ? [toHeading(SECTION.STRATEGIC), '', ...(cv.selectedStrategicContributions || []).map((bullet) => `- ${bullet}`)]
        : [];
    case SECTION.PROJECTS:
      return (cv.selectedPersonalTechnicalProjects || []).length
        ? [toHeading(SECTION.PROJECTS), '', ...renderProjectsSection(cv.selectedPersonalTechnicalProjects || [])]
        : [];
    case SECTION.THOUGHT:
      return (cv.thoughtLeadershipPublications || []).length
        ? [toHeading(SECTION.THOUGHT), '', ...renderThoughtSection(cv.thoughtLeadershipPublications || [])]
        : [];
    case SECTION.EDUCATION:
      return (cv.education || []).length
        ? [toHeading(SECTION.EDUCATION), '', ...(cv.education || []).map((item) => `- **${item.degree}** — ${item.institution}, **${item.years}**`)]
        : [];
    case SECTION.CERTIFICATIONS:
      return (cv.certificationsAndTraining || []).length
        ? [toHeading(SECTION.CERTIFICATIONS), '', ...(cv.certificationsAndTraining || []).map((item) => `- ${item}`)]
        : [];
    case SECTION.LANGUAGES:
      return (cv.languages || []).length
        ? [toHeading(SECTION.LANGUAGES), '', ...(cv.languages || []).map((item) => `- ${item.proficiency ? `${item.language} — ${item.proficiency}` : item.language}`)]
        : [];
    case SECTION.SKILLS:
      return (cv.skillsAndKeywordBank || []).length
        ? [toHeading(SECTION.SKILLS), '', ...renderSkillsSection(cv.skillsAndKeywordBank || [])]
        : [];
    default: {
      const custom = customById.get(sectionId);
      if (!custom) return [];
      return [toHeading(custom.title), '', ...(custom.lines || [])];
    }
  }
}

function renderExperienceSection(experience) {
  const out = [];
  for (const job of experience) {
    out.push(`### ${job.company} — ${job.title}`);
    out.push(`**${job.location ? `${job.location} | ` : ''}${job.period}**`);
    out.push('');
    for (const bullet of job.bullets || []) out.push(`- ${bullet}`);
    out.push('');
  }
  if (out[out.length - 1] === '') out.pop();
  return out;
}

function renderProjectsSection(projects) {
  const out = [];
  for (const project of projects) {
    out.push(`### ${project.title}`);
    out.push(`**Role:** ${project.role} | **Years:** ${project.period}`);
    out.push('');
    for (const bullet of project.bullets || []) out.push(`- ${bullet}`);
    out.push('');
  }
  if (out[out.length - 1] === '') out.pop();
  return out;
}

function renderThoughtSection(items) {
  const out = [];
  for (const item of items) {
    out.push(`### ${item.title}`);
    out.push(`**Role:** ${item.role} | **Year:** ${item.year}`);
    out.push('');
    for (const bullet of item.bullets || []) out.push(`- ${bullet}`);
    out.push('');
  }
  if (out[out.length - 1] === '') out.pop();
  return out;
}

function renderSkillsSection(groups) {
  const out = [];
  for (const group of groups) {
    out.push(`### ${group.category}`);
    out.push('');
    for (const item of group.items || []) out.push(`- ${item}`);
    out.push('');
  }
  if (out[out.length - 1] === '') out.pop();
  return out;
}

function defaultSectionOrder(cv) {
  const order = [];
  if (cv.summary) order.push(SECTION.SUMMARY);
  if ((cv.coreAreasOfExpertise || []).length) order.push(SECTION.CORE_AREAS);
  if ((cv.domainsAndSystemsKnowledge?.domains || []).length || (cv.domainsAndSystemsKnowledge?.systems || []).length) order.push(SECTION.DOMAINS);
  if ((cv.professionalExperience || []).length) order.push(SECTION.EXPERIENCE);
  if ((cv.selectedStrategicContributions || []).length) order.push(SECTION.STRATEGIC);
  if ((cv.selectedPersonalTechnicalProjects || []).length) order.push(SECTION.PROJECTS);
  if ((cv.thoughtLeadershipPublications || []).length) order.push(SECTION.THOUGHT);
  if ((cv.education || []).length) order.push(SECTION.EDUCATION);
  if ((cv.certificationsAndTraining || []).length) order.push(SECTION.CERTIFICATIONS);
  if ((cv.languages || []).length) order.push(SECTION.LANGUAGES);
  if ((cv.skillsAndKeywordBank || []).length) order.push(SECTION.SKILLS);
  for (const custom of cv.customSections || []) order.push(custom.id);
  return order;
}

function toHeading(title) {
  return `## ${title}`;
}

function extractNameFromTitle(titleLine) {
  const text = titleLine.replace(/^#\s+/, '').trim();
  const masterMatch = text.match(/^Master CV\s*-\s*(.+)$/i);
  if (masterMatch) return masterMatch[1].trim();
  const match = text.match(/^CV\s+--\s+(.+)$/i);
  return match ? match[1].trim() : text;
}

function splitCompanyAndTitle(text) {
  const parts = text.split(/\s+[—–-]\s+/);
  if (parts.length >= 2) {
    return [parts[0].trim(), parts.slice(1).join(' — ').trim()];
  }
  return [text.trim(), ''];
}

function stripInlineMarkdown(text) {
  return String(text)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSectionHeading(heading) {
  if (SECTION_ALIASES[heading]) return SECTION_ALIASES[heading];
  if (/^selected\s+.+\s+contributions?$/i.test(heading)) return SECTION.STRATEGIC;
  if (/^selected\s+.+\s+projects?$/i.test(heading)) return SECTION.PROJECTS;
  return heading;
}

function splitSemiColonList(text) {
  return stripInlineMarkdown(text)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseEducationLine(text) {
  const match = text.match(/^\*\*(.+?)\*\*,\s*(.+?),\s*(\d{4}(?:-\d{4})?)$/)
    || text.match(/^\*\*(.+?)\*\*\s+[—-]\s+(.+?),\s+(\d{4}(?:\s*[–-]\s*\d{4})?)$/)
    || text.match(/^\*\*(.+?)\*\*\s+—\s+(.+?),\s+\*\*(.+?)\*\*$/);
  if (!match) return null;
  return {
    degree: stripInlineMarkdown(match[1].trim()),
    institution: stripInlineMarkdown(match[2].trim()),
    years: stripInlineMarkdown(match[3].trim()).replace(/\s*[–—]\s*/g, '-'),
  };
}

function looksLikeEmail(text) {
  return /.+@.+\..+/.test(text);
}

function looksLikePhone(text) {
  return /^[+()\d\s.-]{7,}$/.test(text) && /\d/.test(text);
}

function looksLikeLocation(text) {
  return Boolean(text) && !looksLikeEmail(text) && !looksLikePhone(text) && !/linkedin\.com|github\.com|^https?:\/\//i.test(text);
}

function parseLanguageLine(text) {
  const normalized = stripInlineMarkdown(text);
  const parts = normalized.split(/\s+[—-]\s+/);
  return parts.length >= 2
    ? { language: parts[0].trim(), proficiency: parts.slice(1).join(' — ').trim() }
    : { language: normalized };
}

function createImplicitProject(sectionHeading) {
  return {
    title: stripInlineMarkdown(sectionHeading || 'Selected Project'),
    role: 'Portfolio project',
    period: 'Selected',
    bullets: [],
  };
}

function pushUnique(items, value) {
  if (!items.includes(value)) items.push(value);
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
