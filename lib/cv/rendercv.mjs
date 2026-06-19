import { dump } from 'js-yaml';

const MONTHS = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

export function buildRenderCvDocument(cv, { theme = 'classic', additionalKeywords = [] } = {}) {
  const atsKeywords = compileAtsKeywords(cv, additionalKeywords);
  return {
    cv: {
      name: cv.profile.name,
      headline: cv.profile.headline,
      location: cv.profile.location,
      email: cv.profile.email,
      phone: cv.profile.phone,
      social_networks: buildSocialNetworks(cv.profile),
      sections: buildSections(cv, atsKeywords),
    },
    design: {
      theme,
      section_titles: {
        space_above: '0.3cm',
        space_below: '0.2cm',
      },
      sections: {
        allow_page_break: true,
        space_between_regular_entries: '0.7em',
        space_between_text_based_entries: '0.2em',
      },
      entries: {
        allow_page_break: true,
        date_and_location_width: '4.0cm',
        side_space: '0.15cm',
        space_between_columns: '0.08cm',
        short_second_row: true,
        summary: {
          space_above: '0cm',
          space_left: '0cm',
        },
        highlights: {
          space_above: '0cm',
          space_between_items: '0cm',
          space_between_bullet_and_text: '0.4em',
          space_left: '0.12cm',
        },
      },
    },
  };
}

function buildSections(cv, atsKeywords) {
  const sections = {};
  const order = Array.isArray(cv.sectionOrder) && cv.sectionOrder.length > 0 ? cv.sectionOrder : defaultSectionOrder(cv);
  const customSections = new Map((cv.customSections || []).map((section) => [section.id, section]));

  for (const sectionId of order) {
    if (sectionId === 'Professional Summary' && cv.summary) {
      sections['Professional Summary'] = [cv.summary];
      continue;
    }
    if (sectionId === 'Core Areas of Expertise' && (cv.coreAreasOfExpertise || []).length) {
      sections['Core Areas of Expertise'] = [bulletListText(cv.coreAreasOfExpertise || [])];
      continue;
    }
    if (sectionId === 'Domains & Systems Knowledge') {
      const domains = cv.domainsAndSystemsKnowledge?.domains || [];
      const systems = cv.domainsAndSystemsKnowledge?.systems || [];
      const items = [];
      if (domains.length) items.push(`Domains: ${domains.join(', ')}`);
      if (systems.length) items.push(`Systems / Platforms / Technologies: ${systems.join(', ')}`);
      if (items.length) sections['Domains & Systems Knowledge'] = [bulletListText(items)];
      continue;
    }
    if (sectionId === 'Professional Experience' && (cv.professionalExperience || []).length) {
      sections['Professional Experience'] = (cv.professionalExperience || []).map(buildExperienceEntry);
      continue;
    }
    if (sectionId === 'Selected Strategic Contributions' && (cv.selectedStrategicContributions || []).length) {
      sections['Selected Strategic Contributions'] = [bulletListText(cv.selectedStrategicContributions || [])];
      continue;
    }
    if (sectionId === 'Selected Personal / Technical Projects' && (cv.selectedPersonalTechnicalProjects || []).length) {
      sections['Selected Personal / Technical Projects'] = (cv.selectedPersonalTechnicalProjects || []).map(buildNormalEntry);
      continue;
    }
    if (sectionId === 'Thought Leadership / Publications' && (cv.thoughtLeadershipPublications || []).length) {
      sections['Thought Leadership / Publications'] = (cv.thoughtLeadershipPublications || []).map(buildNormalEntry);
      continue;
    }
    if (sectionId === 'Education' && (cv.education || []).length) {
      sections.Education = (cv.education || []).map(buildEducationEntry);
      continue;
    }
    if (sectionId === 'Certifications & Training' && (cv.certificationsAndTraining || []).length) {
      sections['Certifications & Training'] = [bulletListText(cv.certificationsAndTraining || [])];
      continue;
    }
    if (sectionId === 'Languages' && (cv.languages || []).length) {
      sections.Languages = [bulletListText((cv.languages || []).map((item) => {
        const proficiency = item.proficiency ? ` — ${item.proficiency}` : '';
        return `${item.language}${proficiency}`;
      }))];
      continue;
    }
    if (sectionId === 'Skills and Keyword Bank' && (cv.skillsAndKeywordBank || []).length) {
      sections['Skills and Keyword Bank'] = (cv.skillsAndKeywordBank || []).map((group) => ({
        label: group.category,
        ...(group.items?.length ? { details: group.items.join(', ') } : {}),
      }));
      continue;
    }
    const custom = customSections.get(sectionId);
    if (custom?.lines?.length) {
      sections[custom.title] = custom.lines;
    }
  }

  if (atsKeywords.length) {
    sections['Technical Proficiencies'] = [atsKeywords.join(' | ')];
  }

  return sections;
}

export function buildRenderCvYaml(cv, { theme = 'classic', additionalKeywords = [] } = {}) {
  return dump(buildRenderCvDocument(cv, { theme, additionalKeywords }), {
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
  });
}

function compileAtsKeywords(cv, additionalKeywords = []) {
  const seen = new Set();
  const keywords = [];
  const candidates = [
    ...additionalKeywords,
    ...(cv.coreAreasOfExpertise || []),
    ...(cv.domainsAndSystemsKnowledge?.domains || []).slice(0, 12),
    ...(cv.domainsAndSystemsKnowledge?.systems || []).slice(0, 16),
  ];
  for (const item of candidates) {
    const parts = String(item).split(/[;,/|]+/).map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const key = part.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        keywords.push(part);
      }
    }
  }
  return keywords;
}

function buildSocialNetworks(profile) {
  const networks = [];
  const linkedin = usernameFromUrl(profile.linkedin);
  const github = usernameFromUrl(profile.github);
  if (linkedin) networks.push({ network: 'LinkedIn', username: linkedin });
  if (github) networks.push({ network: 'GitHub', username: github });
  return networks;
}

function buildExperienceEntry(job) {
  const dates = parsePeriod(job.period);
  const entry = {
    company: job.company,
    position: job.title,
    location: job.location || undefined,
    highlights: job.bullets,
  };

  if (dates.date) {
    entry.date = dates.date;
  } else {
    if (dates.start_date) entry.start_date = dates.start_date;
    if (dates.end_date) entry.end_date = dates.end_date;
  }

  return entry;
}

function buildNormalEntry(item) {
  const entry = {
    name: item.title,
    summary: item.role ? `${item.role}` : undefined,
    highlights: item.bullets?.length ? item.bullets : undefined,
  };
  const dates = parsePeriod(item.period || item.year || '');
  if (dates.date) entry.date = dates.date;
  return entry;
}

function buildEducationEntry(item) {
  const entry = {
    institution: item.institution,
    area: item.degree ? item.degree : item.area || '',
    date: item.years,
  };
  const dates = parsePeriod(item.years || '');
  if (dates.start_date) entry.start_date = dates.start_date;
  if (dates.end_date) entry.end_date = dates.end_date;
  return entry;
}

function bulletListText(items) {
  return (items || []).map((item) => `- ${item}`).join('\n');
}

function usernameFromUrl(url = '') {
  const match = String(url).match(/https?:\/\/[^/]+\/(?:in|)(?:\/)?([^/?#]+)/i);
  return match ? match[1] : '';
}

function parsePeriod(period = '') {
  const cleaned = String(period)
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return {};
  if (/present/i.test(cleaned)) {
    const startMatch = cleaned.match(/([A-Za-z]+)\s+(\d{4})/);
    return {
      start_date: startMatch ? toIsoMonth(startMatch[1], startMatch[2]) : undefined,
      end_date: 'present',
    };
  }

  const yearRange = cleaned.match(/(\d{4})\s*-\s*(\d{4})/);
  if (yearRange) {
    return {
      start_date: `${yearRange[1]}-01`,
      end_date: `${yearRange[2]}-12`,
    };
  }

  const range = cleaned.match(/([A-Za-z]+)\s+(\d{4})\s*-\s*([A-Za-z]+)\s+(\d{4})/);
  if (range) {
    return {
      start_date: toIsoMonth(range[1], range[2]),
      end_date: toIsoMonth(range[3], range[4]),
    };
  }

  const single = cleaned.match(/([A-Za-z]+)\s+(\d{4})/);
  if (single) {
    return { date: toIsoMonth(single[1], single[2]) };
  }

  return { date: cleaned };
}

function toIsoMonth(monthName, year) {
  const month = MONTHS[String(monthName).slice(0, 3).toLowerCase()] || MONTHS[String(monthName).toLowerCase()];
  if (!month) return `${year}-01`;
  return `${year}-${month}`;
}

function defaultSectionOrder(cv) {
  const order = [];
  if (cv.summary) order.push('Professional Summary');
  if ((cv.coreAreasOfExpertise || []).length) order.push('Core Areas of Expertise');
  if ((cv.domainsAndSystemsKnowledge?.domains || []).length || (cv.domainsAndSystemsKnowledge?.systems || []).length) order.push('Domains & Systems Knowledge');
  if ((cv.professionalExperience || []).length) order.push('Professional Experience');
  if ((cv.selectedStrategicContributions || []).length) order.push('Selected Strategic Contributions');
  if ((cv.selectedPersonalTechnicalProjects || []).length) order.push('Selected Personal / Technical Projects');
  if ((cv.thoughtLeadershipPublications || []).length) order.push('Thought Leadership / Publications');
  if ((cv.education || []).length) order.push('Education');
  if ((cv.certificationsAndTraining || []).length) order.push('Certifications & Training');
  if ((cv.languages || []).length) order.push('Languages');
  if ((cv.skillsAndKeywordBank || []).length) order.push('Skills and Keyword Bank');
  for (const custom of cv.customSections || []) order.push(custom.id);
  return order;
}
