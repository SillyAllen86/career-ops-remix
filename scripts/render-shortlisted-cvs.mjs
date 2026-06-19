#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const TEMPLATE = readFileSync(resolve(ROOT, 'templates', 'cv-template.html'), 'utf8');
const OUT_DIR = resolve(ROOT, 'output');

mkdirSync(OUT_DIR, { recursive: true });

const DATE = '2026-04-17';
const CONTACT = {
  name: 'Pravin Sail',
  phone: '+49 171 9282295',
  email: 'sail.a.pravin@gmail.com',
  linkedinUrl: 'https://linkedin.com/in/pravins-profile',
  linkedinDisplay: 'linkedin.com/in/pravins-profile',
  portfolioUrl: 'https://github.com/SillyAllen86',
  portfolioDisplay: 'github.com/SillyAllen86',
  location: 'Frankfurt am Main, Germany',
};

const education = [
  {
    title: 'Post Graduate Diploma in Business Administration',
    org: 'NMIMS',
    year: '2012 - 2015',
    desc: 'Business administration grounding in budgeting, commercial planning, and decision-oriented financial thinking.',
  },
  {
    title: 'Master of Science in Biotechnology',
    org: 'Sardar Patel University',
    year: '2008 - 2010',
    desc: 'Life sciences foundation that strengthens business, manufacturing, laboratory, and quality translation work.',
  },
];

const certifications = [
  ['Six Sigma Green Belt Certified and Black Belt Trained', 'Professional Training'],
  ['GAMP 5 Practitioner', 'Professional Training'],
  ['ISO 9001:2015 Lead Auditor / Internal Auditor', 'Professional Training'],
  ['ICH E6(R3) Good Clinical Practice (GCP)', 'Professional Training'],
  ['ICH Q7 Good Manufacturing Practice Guide', 'Professional Training'],
];

const experiences = {
  biontech_architecture: {
    company: 'BioNTech SE',
    period: 'May 2023 - Present',
    role: 'Digitalisation Lead for Product Supply of Individualized Medicine',
    bullets: [
      'Lead digitalisation design for product supply of individualized medicine, defining target-state processes, system interaction models, and integration requirements across sample processing, genomics, manufacturing, quality, and enterprise functions.',
      'Develop BPMN-oriented process models and capability views covering execution logic, traceability checkpoints, exception paths, and system responsibilities across laboratory, automation, quality, and enterprise functions.',
      'Define integration and orchestration considerations between Thermo Fisher SampleManager LES, Automata LINQ, quality-relevant data capture, and SAP-connected enterprise processes.',
      'Defined landscape-level dependencies between global and site-specific SAP requirements across plan-to-produce, plant maintenance, store-to-ship, warehouse, and quality-management processes to support coherent target-state architecture decisions.',
      'Drive cross-functional alignment across operations, QA, QC, engineering, automation, IT, and supply chain to translate business needs into clear process and system requirements.',
      'Develop executive-ready architecture and operating model communication artefacts, including layered system landscapes, stakeholder views, and black-box orchestration diagrams.',
    ],
  },
  biontech_program: {
    company: 'BioNTech SE',
    period: 'May 2023 - Present',
    role: 'Digitalisation Lead for Product Supply of Individualized Medicine',
    bullets: [
      'Lead digitalisation design for product supply of individualized medicine, shaping future-state workflows, stakeholder alignment, and delivery-ready requirements across sample processing, genomics, manufacturing, quality, and enterprise functions.',
      'Coordinate matrix-style decision-making across laboratory, manufacturing, quality, automation, site, and enterprise stakeholders to align to-be designs, greenfield requirements, and implementation priorities.',
      'Contribute to site-level digital feature and capability planning to ensure future process scale-up and production needs can be supported by digital assets and system architecture.',
      'Develop stakeholder, system, and capability landscape views to clarify ownership, dependencies, inputs, outputs, and control points across the operating model.',
      'Support regulatory-conscious design by embedding GxP expectations into workflow design and integration considerations.',
      'Partner with internal teams and vendors to structure pragmatic digitalisation approaches for complex, evolving individualized medicine operations.',
    ],
  },
  elsevier_product: {
    company: 'Elsevier Life Science Solutions',
    period: 'Apr 2019 - Apr 2023',
    role: 'Digital Compliance & Product Strategy Lead',
    bullets: [
      'Led digital quality, compliance, product management, and cross-functional delivery initiatives for regulated life sciences SaaS platforms serving pharmaceutical and biotech organizations.',
      'Balanced product strategy with regulatory governance by shaping validated processes, release approaches, roadmap inputs, and product capabilities in regulated environments.',
      'Established GAMP 5-aligned validation approaches to support software integrity, compliant releases, and pharma client onboarding.',
      'Translated regulatory, customer, and operational needs into product requirements, prioritization inputs, and roadmap decisions for regulated SaaS offerings.',
      'Partnered with product, operations, and IT teams to improve governance, information security alignment, release readiness, and delivery effectiveness.',
      'Coached product teams in Lean and Agile ways of working to improve prioritization, delivery clarity, program discipline, and product maturity.',
    ],
  },
  nnit_advisory: {
    company: 'NNIT',
    period: 'Jun 2018 - Mar 2019',
    role: 'Clinical Operations & Regulatory Digitalisation Advisory',
    bullets: [
      'Supported consulting and advisory work across clinical operations and regulatory digitalisation topics in life sciences environments.',
      'Helped shape early project understanding, structured analysis, and leadership-facing communication for assessment and opportunity-definition work.',
      'Mapped processes, requirements, governance expectations, and role responsibilities connected to SOPs, oversight, and digital operating models.',
      'Supported change-management activities including as-is and to-be analysis, stakeholder impacts, communication needs, training needs, and risk considerations.',
      'Worked with executive and cross-functional stakeholders to structure discovery, planning, and decision support in regulated contexts.',
    ],
  },
  tcs_delivery: {
    company: 'Tata Consultancy Services',
    period: 'May 2011 - Apr 2018',
    role: 'Consultant & Project Manager, Pharma Transformation & Advisory',
    bullets: [
      'Delivered transformation and operational improvement initiatives for pharmaceutical and biopharma clients in regulated environments.',
      'Managed cross-functional workstreams supporting clinical operations, process improvement, regulatory readiness, and structured delivery objectives.',
      'Prepared quarterly forecasts and approval inputs for delivery costs, compared forecasted versus actual spend, and maintained working models to support planning accuracy and decision-making.',
      'Developed an internal forecasting and prediction model for resource and cost planning to improve visibility into expected versus realized effort and spend across different project scenarios.',
      'Designed an activity-based pricing model for a major pharmaceutical client and built the business case used to secure approval for future master service agreement discussions.',
      'Managed consultants and team leads across planning, submissions, issue resolution, and stakeholder alignment across multiple workstreams.',
    ],
  },
  biontech_quality: {
    company: 'BioNTech SE',
    period: 'May 2023 - Present',
    role: 'Digitalisation Lead for Product Supply of Individualized Medicine',
    bullets: [
      'Lead digitalisation design across manufacturing, laboratory, quality, and enterprise functions in a GxP-sensitive individualized medicine environment.',
      'Develop BPMN-oriented process models, traceability checkpoints, exception paths, and system-responsibility views to support quality-conscious execution and evidence continuity.',
      'Drive cross-functional alignment across operations, QA, QC, automation, engineering, and IT to translate business and compliance needs into executable process and system designs.',
      'Support regulatory-conscious design by embedding GxP expectations into workflow, integration, and change considerations.',
      'Develop executive-ready communication artefacts that clarify control points, ownership, dependencies, and transformation priorities.',
      'Partner with internal teams and vendors to structure pragmatic digitalisation approaches for complex regulated operations.',
    ],
  },
  elsevier_quality: {
    company: 'Elsevier Life Science Solutions',
    period: 'Apr 2019 - Apr 2023',
    role: 'Digital Compliance & Product Strategy Lead',
    bullets: [
      'Led digital quality, compliance, product management, and cross-functional delivery initiatives for regulated life sciences SaaS platforms serving pharmaceutical and biotech organizations.',
      'Established GAMP 5-aligned validation approaches to support software integrity, compliant releases, and pharma client onboarding.',
      'Led ISO 9001:2015 internal audit activities and CAPA-oriented improvement practices to strengthen quality management discipline.',
      'Balanced product strategy with regulatory governance by shaping validated processes, release approaches, roadmap inputs, and product capabilities in regulated environments.',
      'Partnered with product, operations, and IT teams to improve governance, information security alignment, release readiness, and delivery effectiveness.',
      'Supported GxP-oriented SaaS product ownership by shaping QMS expectations, validation-support approaches, quality responses, and product enhancements needed for future customer validation.',
    ],
  },
  transformation_office: {
    company: 'Tata Consultancy Services',
    period: 'May 2011 - Apr 2018',
    role: 'Consultant & Project Manager, Pharma Transformation & Advisory',
    bullets: [
      'Delivered transformation and operational improvement initiatives for pharmaceutical and biopharma clients in regulated environments.',
      'Managed cross-functional workstreams supporting clinical operations, process improvement, regulatory readiness, and structured delivery objectives.',
      'Prepared quarterly forecasts and approval inputs for delivery costs, compared forecasted versus actual spend, and maintained working models to support planning accuracy and decision-making.',
      'Developed an internal forecasting and prediction model for resource and cost planning to improve visibility into expected versus realized effort and spend across different project scenarios.',
      'Designed an activity-based pricing model for a major pharmaceutical client and built the business case used to secure approval for future master service agreement discussions.',
      'Managed consultants and team leads across planning, submissions, issue resolution, stakeholder alignment, and leadership-ready status communication across multiple workstreams.',
    ],
  },
  architecture_consulting: {
    company: 'Tata Consultancy Services',
    period: 'May 2011 - Apr 2018',
    role: 'Consultant & Project Manager, Pharma Transformation & Advisory',
    bullets: [
      'Delivered transformation and advisory initiatives for pharmaceutical and biopharma clients in regulated environments, combining structured analysis, stakeholder management, and implementation planning.',
      'Prepared leadership-facing analysis, project discovery materials, and proposal-style communication to shape early understanding of transformation opportunities and execution paths.',
      'Managed cross-functional workstreams across planning, submissions, issue resolution, and stakeholder alignment in complex matrix environments.',
      'Built forecast-versus-actual planning views and internal prediction models to improve delivery visibility and support decision-making.',
      'Designed an activity-based pricing model and business case for a major pharmaceutical client, helping secure approval for future commercial use.',
      'Worked with client, finance, procurement, and account stakeholders on planning, budget, and delivery-control topics.',
    ],
  },
  integration_architecture: {
    company: 'BioNTech SE',
    period: 'May 2023 - Present',
    role: 'Digitalisation Lead for Product Supply of Individualized Medicine',
    bullets: [
      'Defined integration and orchestration considerations between Thermo Fisher SampleManager LES, Automata LINQ, quality-relevant data capture, and SAP-connected enterprise processes.',
      'Mapped global versus site-specific SAP dependencies across plan-to-produce, plant maintenance, store-to-ship, warehouse, and quality-management processes to support coherent target-state architecture decisions.',
      'Shaped microservice-style service exposure and API-based interaction patterns for site-specific capabilities that needed to remain aligned with globally governed platforms.',
      'Contributed integration design for purchasing and replenishment scenarios including vendor-facing EDI-linked requisition flows, tracking, invoice, and quality-report feedback into SAP-connected systems.',
      'Developed stakeholder, system, and capability landscape views to clarify ownership, dependencies, inputs, outputs, and control points across the operating model.',
      'Built executive-ready architecture and operating model communication artefacts including layered landscapes and black-box orchestration diagrams.',
    ],
  },
  data_governance: {
    company: 'Elsevier Life Science Solutions',
    period: 'Apr 2019 - Apr 2023',
    role: 'Digital Compliance & Product Strategy Lead',
    bullets: [
      'Translated regulatory, customer, and operational needs into roadmap inputs, information structure decisions, and governance improvements for regulated SaaS offerings.',
      'Used customer-satisfaction and user-journey reporting to recommend product changes and prioritization updates, linking qualitative and quantitative signals to roadmap decisions.',
      'Contributed to KPI-led roadmap prioritization by comparing feature and product options using value, cost, engagement, and delivery considerations.',
      'Partnered with product, operations, and IT teams to improve governance, information security alignment, release readiness, and delivery effectiveness.',
      'Supported GxP-oriented SaaS product ownership by shaping QMS expectations, validation-support approaches, and product enhancements for more efficient future validation.',
      'Trained and supported product managers, contributed to product demos, and aligned roadmap options with yearly planning and revenue considerations.',
    ],
  },
};

const projectSets = {
  architecture: [
    {
      title: 'InfoWeave-MemoryDB',
      badge: 'Local AI Infrastructure',
      desc: 'Built a local vector memory database and MCP-compatible memory layer using TypeScript, SQLite, and local embeddings for durable AI retrieval and workflow support.',
      tech: 'TypeScript, SQLite, local embeddings, MCP-compatible design',
    },
    {
      title: 'Knowledge Graph Tools',
      badge: 'Structured Knowledge',
      desc: 'Designed and prototyped knowledge graph tools across native macOS and web implementations to test graph-based interfaces for connected information and document-linked knowledge.',
      tech: 'Swift, TypeScript, graph visualization, AI-assisted navigation',
    },
    {
      title: 'GraphCraft / BPMN Tooling',
      badge: 'Diagram Systems',
      desc: 'Built AI-assisted diagramming tools that convert natural language into BPMN and draw.io-compatible outputs across full-stack TypeScript architectures.',
      tech: 'TypeScript, BPMN XML, draw.io XML, layout and rendering workflows',
    },
  ],
  operations: [
    {
      title: 'Advanced Digitalisation for Personalized Cell Therapy',
      badge: 'Publication',
      desc: 'Authored an integration-first paper on coordination, traceability, and scalable digital operations in personalized cell therapy.',
      tech: 'Operating model design, traceability, integration-first digital architecture',
    },
    {
      title: 'InfoWeave-MemoryDB',
      badge: 'AI Workflow Builder',
      desc: 'Built local memory infrastructure for AI tools, demonstrating practical builder depth alongside enterprise transformation work.',
      tech: 'TypeScript, SQLite, embeddings, privacy-conscious architecture',
    },
    {
      title: 'GraphCraft / BPMN Tooling',
      badge: 'Workflow Design',
      desc: 'Developed tooling for structured workflow and diagram generation, useful as proof of practical process-thinking and system decomposition.',
      tech: 'TypeScript, BPMN, XML generation, workflow DSL design',
    },
  ],
  data: [
    {
      title: 'InfoWeave-MemoryDB',
      badge: 'AI-Ready Data Foundations',
      desc: 'Built a local vector memory layer with structured retrieval and reusable memory services for AI tools and agentic workflows.',
      tech: 'TypeScript, SQLite, embeddings, retrieval pipelines',
    },
    {
      title: 'MindMemo / memory-vault',
      badge: 'Knowledge Workflows',
      desc: 'Built AI-powered note and memory assistant concepts with semantic retrieval, document chat, and durable markdown-based knowledge organization.',
      tech: 'Swift, markdown, vector retrieval, local/private AI options',
    },
    {
      title: 'Knowledge Graph Tools',
      badge: 'Metadata and Navigation',
      desc: 'Explored graph-based interfaces, connected information structures, and reusable knowledge patterns that strengthen architecture and governance narratives.',
      tech: 'Graph models, AI-assisted navigation, connected information design',
    },
  ],
};

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCompetencies(items) {
  return items.map((item) => `<span class="competency-tag">${esc(item)}</span>`).join('\n      ');
}

function renderJob(job) {
  return `
    <div class="job">
      <div class="job-header">
        <div class="job-company">${esc(job.company)}</div>
        <div class="job-period">${esc(job.period)}</div>
      </div>
      <div class="job-role">${esc(job.role)}</div>
      <ul>
${job.bullets.map((bullet) => `        <li>${esc(bullet)}</li>`).join('\n')}
      </ul>
    </div>`;
}

function renderProjects(items) {
  return items.map((project) => `
    <div class="project">
      <div class="project-title">${esc(project.title)} <span class="project-badge">${esc(project.badge)}</span></div>
      <div class="project-desc">${esc(project.desc)}</div>
      <div class="project-tech">${esc(project.tech)}</div>
    </div>`).join('\n');
}

function renderEducation(items) {
  return items.map((item) => `
    <div class="edu-item">
      <div class="edu-header">
        <div class="edu-title">${esc(item.title)} <span class="edu-org">- ${esc(item.org)}</span></div>
        <div class="edu-year">${esc(item.year)}</div>
      </div>
      <div class="edu-desc">${esc(item.desc)}</div>
    </div>`).join('\n');
}

function renderCerts(items) {
  return items.map(([title, org]) => `
    <div class="cert-item">
      <div class="cert-title">${esc(title)} <span class="cert-org">- ${esc(org)}</span></div>
      <div class="cert-year"></div>
    </div>`).join('\n');
}

function renderSkills(groups) {
  return groups.map(([category, values]) => `
    <div class="skill-item"><span class="skill-category">${esc(category)}:</span> ${esc(values.join(', '))}</div>`).join('\n      ');
}

function renderCv(config) {
  const experienceOrder = config.experience ?? [];
  const preserve = config.preserveExperience ?? [];
  const finalExperience = [...experienceOrder];
  for (const key of preserve) {
    if (!finalExperience.includes(key)) finalExperience.push(key);
  }

  const replacements = {
    '{{LANG}}': 'en',
    '{{NAME}}': CONTACT.name,
    '{{PHONE}}': CONTACT.phone,
    '{{EMAIL}}': CONTACT.email,
    '{{LINKEDIN_URL}}': CONTACT.linkedinUrl,
    '{{LINKEDIN_DISPLAY}}': CONTACT.linkedinDisplay,
    '{{PORTFOLIO_URL}}': CONTACT.portfolioUrl,
    '{{PORTFOLIO_DISPLAY}}': CONTACT.portfolioDisplay,
    '{{LOCATION}}': CONTACT.location,
    '{{PAGE_WIDTH}}': '8.27in',
    '{{SECTION_SUMMARY}}': 'Professional Summary',
    '{{SECTION_COMPETENCIES}}': 'Core Competencies',
    '{{SECTION_EXPERIENCE}}': 'Work Experience',
    '{{SECTION_PROJECTS}}': 'Selected Projects',
    '{{SECTION_EDUCATION}}': 'Education',
    '{{SECTION_CERTIFICATIONS}}': 'Certifications',
    '{{SECTION_SKILLS}}': 'Skills',
    '{{SUMMARY_TEXT}}': config.summary,
    '{{COMPETENCIES}}': renderCompetencies(config.competencies),
    '{{EXPERIENCE}}': finalExperience.map((key) => renderJob(experiences[key])).join('\n'),
    '{{PROJECTS}}': renderProjects(projectSets[config.projectSet]),
    '{{EDUCATION}}': renderEducation(education),
    '{{CERTIFICATIONS}}': renderCerts(certifications),
    '{{SKILLS}}': `<div class="skills-grid">\n      ${renderSkills(config.skills)}\n    </div>`,
  };

  let html = TEMPLATE;
  for (const [token, value] of Object.entries(replacements)) {
    html = html.replaceAll(token, value);
  }
  return html;
}

const cvs = [
  {
    filename: `cv-pravin-sail-fresenius-head-enterprise-integration-architecture-${DATE}.html`,
    summary: 'Enterprise integration and transformation architect with 13+ years of experience designing how business capabilities, systems, data, and governance connect in regulated life sciences environments. Strong background in target-state architecture, integration roadmaps, API- and service-oriented integration thinking, SAP and non-SAP landscape alignment, vendor and external-interface integration, and architecture communication across manufacturing, laboratory, quality, and enterprise domains. Brings practical builder depth in AI-enabled workflow and structured tooling, but leads with enterprise architecture discipline, reusable integration patterns, and delivery-ready design.',
    competencies: [
      'Enterprise Integration Architecture',
      'Target-State Architecture and Roadmaps',
      'API-Led and Service-Oriented Design',
      'Reference Patterns and Governance',
      'SAP and Non-SAP Landscape Alignment',
      'Business Capability and System Interaction Mapping',
      'Cross-Functional Architecture Communication',
      'Regulated Transformation Environments',
    ],
    experience: ['integration_architecture', 'architecture_consulting', 'elsevier_product', 'nnit_advisory'],
    projectSet: 'architecture',
    skills: [
      ['Integration', ['API-led design', 'service exposure patterns', 'system interaction models', 'integration governance']],
      ['Architecture', ['target-state design', 'integration roadmaps', 'capability mapping', 'landscape dependency planning']],
      ['Domain', ['regulated life sciences', 'laboratory systems', 'manufacturing workflows', 'quality-aware design']],
      ['Tooling', ['BPMN', 'TypeScript', 'workflow tooling', 'architecture communication artifacts']],
    ],
  },
  {
    filename: `cv-pravin-sail-fresenius-senior-enterprise-business-architect-${DATE}.html`,
    summary: 'Enterprise and business architecture professional with 13+ years of experience translating strategy into operating models, capabilities, workflows, governance, and system decisions in regulated life sciences environments. Strong background in business-to-IT translation, target-state design, business capabilities, operating models, governance structures, and executive communication across manufacturing, quality, laboratory, and enterprise functions. Combines enterprise transformation credibility with practical experience structuring information, workflows, committees, roles, and decision-ready architecture artefacts.',
    competencies: [
      'Enterprise and Business Architecture',
      'Capability and Operating Model Design',
      'Strategy-to-Execution Translation',
      'Business and IT Alignment',
      'Architecture Risks, Trade-Offs, and Decision Support',
      'Cross-Functional Transformation Leadership',
      'Process, System, and Governance Mapping',
      'Regulated Enterprise Environments',
    ],
    experience: ['biontech_program', 'nnit_advisory', 'architecture_consulting', 'elsevier_product'],
    projectSet: 'operations',
    skills: [
      ['Business Architecture', ['business capabilities', 'operating models', 'process decomposition', 'stakeholder alignment']],
      ['Transformation', ['roadmap planning', 'decision support', 'governance structures', 'cross-functional facilitation']],
      ['Domain', ['regulated life sciences', 'quality and compliance', 'manufacturing and laboratory operations', 'enterprise change']],
      ['Communication', ['executive materials', 'structured workshops', 'business-to-IT translation', 'architecture narratives']],
    ],
  },
  {
    filename: `cv-pravin-sail-fresenius-senior-enterprise-data-architect-${DATE}.html`,
    summary: 'Enterprise data and architecture lead with 13+ years of experience aligning business processes, information flows, governance rules, and system integrations across regulated life sciences environments. Strong background in data-relevant architecture, metadata and taxonomy thinking, governance, reporting context, dashboards, and integration layers that support trusted operations, advanced analytics, and AI-ready foundations. Brings practical builder depth through structured knowledge systems, local retrieval tooling, and information architecture work.',
    competencies: [
      'Enterprise Data Architecture',
      'Data Governance and Quality Frameworks',
      'Metadata, Taxonomy, and Information Flows',
      'Data and Integration Layer Design',
      'Business and IT Stakeholder Alignment',
      'AI-Ready Data Foundations',
      'Cross-Functional Architecture Governance',
      'Regulated Data and Compliance Context',
    ],
    experience: ['biontech_architecture', 'data_governance', 'transformation_office', 'nnit_advisory'],
    projectSet: 'data',
    skills: [
      ['Data', ['data governance', 'metadata and taxonomy thinking', 'information flows', 'data quality frameworks']],
      ['Architecture', ['integration layers', 'API-aware design', 'target-state architecture', 'enterprise alignment']],
      ['AI Foundations', ['retrieval systems', 'knowledge architecture', 'local AI tooling', 'structured data support']],
      ['Delivery', ['cross-functional coordination', 'reporting context', 'dashboard thinking', 'stakeholder management']],
    ],
  },
  {
    filename: `cv-pravin-sail-fresenius-senior-business-analyst-transformation-office-medtech-${DATE}.html`,
    summary: 'Transformation and program governance lead with 13+ years of experience bringing structure, visibility, and decision support to complex cross-functional initiatives in regulated environments. Strong background in KPI-led performance tracking, business-case logic, forecast-versus-actual planning, dashboard thinking, stakeholder coordination, executive-ready materials, and disciplined workstream management across life sciences and healthcare-related contexts. Combines transformation-office style rigor with practical business-to-IT translation and finance-aware delivery planning.',
    competencies: [
      'Transformation Office and Program Governance',
      'KPI Tracking and Performance Reporting',
      'Business Cases and Value Realization Logic',
      'Forecast-versus-Actual Planning',
      'Executive Decision Materials',
      'Cross-Functional Coordination and Escalation',
      'Finance and Transformation Stakeholder Alignment',
      'Healthcare and Life Sciences Context',
    ],
    experience: ['transformation_office', 'nnit_advisory', 'data_governance', 'biontech_program'],
    projectSet: 'operations',
    skills: [
      ['Analysis', ['KPI tracking', 'trend and deviation analysis', 'business-case support', 'forecasting context']],
      ['Governance', ['transformation reporting', 'leadership materials', 'issue and risk tracking', 'execution cadence']],
      ['Business', ['finance-aware planning', 'value logic', 'stakeholder communication', 'cross-functional coordination']],
      ['Domain', ['life sciences', 'regulated environments', 'operating model design', 'program delivery']],
    ],
  },
  {
    filename: `cv-pravin-sail-biontech-senior-director-quality-transformation-oversight-${DATE}.html`,
    summary: 'Quality-conscious transformation leader with 13+ years of experience driving change, governance, and digital operating-model improvement in regulated life sciences environments. Strong background in GxP-aware process design, QMS and change governance, audit- and CAPA-oriented discipline, and executive coordination across global and site-specific functions. Brings a pragmatic combination of transformation leadership, regulated systems understanding, quality-minded product governance, and delivery-ready process design.',
    competencies: [
      'Quality Transformation and Oversight',
      'GxP, GMP, and QMS-Aware Change Leadership',
      'Cross-Functional Global and Site Alignment',
      'Change Management and Governance',
      'Audit Readiness and Quality Discipline',
      'Process, Control-Point, and Traceability Design',
      'Executive Stakeholder Coordination',
      'Regulated Life Sciences Operations',
    ],
    experience: ['biontech_quality', 'elsevier_quality', 'nnit_advisory', 'tcs_delivery'],
    projectSet: 'operations',
    skills: [
      ['Quality', ['QMS', 'GxP and GMP awareness', 'audit readiness', 'quality-conscious change']],
      ['Transformation', ['global initiatives', 'governance design', 'cross-functional leadership', 'change execution']],
      ['Compliance', ['GAMP 5', 'ISO 9001', 'validation-aware design', 'CAPA-oriented improvement']],
      ['Domain', ['manufacturing', 'laboratory workflows', 'patient-specific traceability', 'regulated operations']],
    ],
  },
  {
    filename: `cv-pravin-sail-daiichi-sankyo-director-e-compliance-it-governance-${DATE}.html`,
    summary: 'Digital compliance and governance leader with 13+ years of experience improving regulated systems, validation-aware delivery, and quality-conscious operating models across life sciences environments. Strong background in GxP-aligned digital governance, risk-based validation support, QMS expectations, vendor and stakeholder oversight, and cross-functional quality and IT collaboration in compliance-sensitive settings. Brings credible builder depth relevant to AI-enabled workflow governance while staying precise about the difference between governance leadership and narrow SAP module ownership.',
    competencies: [
      'E-Compliance and IT Governance',
      'CSV and Validation-Aware Delivery',
      'GxP, Data Integrity, and Risk-Based Control Thinking',
      'Quality IT and QMS Alignment',
      'Cross-Functional QA and IT Collaboration',
      'Global Governance and Vendor Coordination',
      'Regulated Digital Transformation',
      'Executive Risk and Compliance Communication',
    ],
    experience: ['elsevier_quality', 'nnit_advisory', 'biontech_quality', 'architecture_consulting'],
    projectSet: 'operations',
    skills: [
      ['Governance', ['IT governance', 'quality systems support', 'risk-based control thinking', 'vendor coordination']],
      ['Compliance', ['GxP', 'GAMP 5', 'validation-aware design', 'data integrity awareness']],
      ['Transformation', ['digital quality roadmap support', 'cross-functional execution', 'stakeholder alignment', 'change governance']],
      ['Systems', ['SAP-connected processes', 'regulated SaaS', 'workflow design', 'integration-aware thinking']],
    ],
  },
  {
    filename: `cv-pravin-sail-eppendorf-head-sap-transformation-architecture-${DATE}.html`,
    summary: 'Transformation and architecture leader with 13+ years of experience aligning operating models, systems, integrations, and governance across regulated life sciences environments. Strong background in target-state architecture, enterprise process translation, and platform decision-making across SAP-connected operations, laboratory systems, manufacturing workflows, quality expectations, and cross-functional delivery. Brings practical experience shaping architecture roadmaps, standards, stakeholder governance, and implementation-ready design in complex environments where compliance, scalability, and business continuity all matter.',
    competencies: [
      'SAP Transformation Governance',
      'Target-State Architecture and Roadmaps',
      'Integration and Enterprise Process Design',
      'Global-to-Local Platform Decision-Making',
      'Governance, Standards, and Templates',
      'Stakeholder Management Across Business and IT',
      'Regulated Systems and Compliance-Aware Design',
      'Architecture Communication and Delivery Alignment',
    ],
    experience: ['biontech_architecture', 'elsevier_product', 'tcs_delivery'],
    projectSet: 'architecture',
    skills: [
      ['Architecture', ['SAP-connected process design', 'integration patterns', 'target-state system design', 'operating model definition']],
      ['Delivery', ['roadmaps', 'stakeholder alignment', 'vendor coordination', 'program governance']],
      ['Domain', ['regulated life sciences', 'laboratory systems', 'manufacturing processes', 'quality-conscious design']],
      ['Tooling', ['BPMN', 'API-led design', 'TypeScript', 'AI-enabled workflow prototyping']],
    ],
  },
  {
    filename: `cv-pravin-sail-takeda-operational-excellence-lead-${DATE}.html`,
    summary: 'Operational transformation and digitalisation lead with 13+ years of experience improving complex regulated environments through structured operating models, cross-functional alignment, measurable roadmap execution, and practical workflow redesign. Strong background in manufacturing- and laboratory-adjacent process transformation, capability planning, governance, and business-to-IT translation across quality, operations, automation, and enterprise teams. Combines continuous-improvement mindset with builder depth in workflow tooling, knowledge systems, and process decomposition.',
    competencies: [
      'Operational Excellence and Transformation',
      'Lean-Oriented Workflow and Capability Design',
      'Cross-Functional Performance Improvement',
      'Manufacturing and Laboratory Process Translation',
      'KPI-Driven Roadmaps and Governance',
      'Stakeholder Alignment Across Site Functions',
      'Quality-Conscious Change Delivery',
      'Structured Problem Solving and Facilitation',
    ],
    experience: ['biontech_program', 'elsevier_product', 'tcs_delivery'],
    projectSet: 'operations',
    skills: [
      ['Transformation', ['operational excellence', 'process decomposition', 'capability mapping', 'roadmap planning']],
      ['Leadership', ['cross-functional facilitation', 'stakeholder communication', 'program governance', 'team coordination']],
      ['Domain', ['manufacturing', 'laboratory workflows', 'quality and compliance', 'regulated operations']],
      ['Methods', ['BPMN', 'Lean and Agile coaching', 'risk tracking', 'continuous improvement tooling']],
    ],
  },
  {
    filename: `cv-pravin-sail-msd-digital-manufacturing-systems-operations-it-${DATE}.html`,
    summary: 'Digital manufacturing and systems transformation leader with 13+ years of experience shaping how manufacturing, laboratory, quality, and enterprise systems work together in regulated environments. Strong background in lifecycle-aware system design, digital operating models, integration patterns, capability roadmaps, and stakeholder alignment across GMP-relevant workflows. Brings practical experience connecting site needs with platform strategy, quality expectations, data visibility, and sustainable operational support models.',
    competencies: [
      'Digital Manufacturing Systems Leadership',
      'Manufacturing and Lab IT Translation',
      'GMP-Aware Systems and Lifecycle Management',
      'LIMS LES MES SAP Alignment',
      'Digital Transformation Roadmaps',
      'Data, Analytics, and Visibility Enablement',
      'Cross-Functional Operations and Quality Alignment',
      'Compliance-Aware Change and Governance',
    ],
    experience: ['biontech_architecture', 'elsevier_product', 'tcs_delivery'],
    projectSet: 'operations',
    skills: [
      ['Systems', ['LIMS', 'LES', 'MES', 'SAP-connected processes', 'application lifecycle thinking']],
      ['Manufacturing IT', ['digital operations', 'integration planning', 'workflow orchestration', 'data visibility']],
      ['Compliance', ['GxP', 'validation-aware design', 'quality support', 'structured governance']],
      ['Delivery', ['cross-functional leadership', 'capability planning', 'program management', 'vendor coordination']],
    ],
  },
  {
    filename: `cv-pravin-sail-iqvia-director-platform-architecture-${DATE}.html`,
    summary: 'Platform and architecture leader with 13+ years of experience structuring how systems, information flows, governance models, and operating decisions work together in complex regulated environments. Strong background in enterprise architecture, integration-first design, stakeholder translation, and practical AI-enabled workflow building. Brings a rare combination of transformation credibility in life sciences settings and hands-on builder depth across data, retrieval, graph, and workflow tooling.',
    competencies: [
      'Data and Platform Architecture Strategy',
      'Architecture Policies and Standards',
      'Enterprise Governance and Operating Models',
      'Cross-Functional Translation and Leadership',
      'AI-Enabled Workflow and Knowledge Systems',
      'Data Quality, Metadata, and Information Design',
      'Platform Roadmaps and Change Leadership',
      'Global Stakeholder Communication',
    ],
    experience: ['biontech_architecture', 'elsevier_product', 'tcs_delivery'],
    projectSet: 'data',
    skills: [
      ['Platforms', ['data platform strategy', 'architecture standards', 'governance models', 'integration-first design']],
      ['Data', ['information flow design', 'taxonomy and metadata thinking', 'quality-conscious architecture', 'analytics readiness']],
      ['Leadership', ['team mentoring', 'stakeholder alignment', 'policy definition', 'global collaboration']],
      ['Builder Depth', ['TypeScript', 'knowledge systems', 'AI retrieval', 'structured workflow tooling']],
    ],
  },
  {
    filename: `cv-pravin-sail-iqvia-senior-data-platform-governance-lead-${DATE}.html`,
    summary: 'Enterprise data and governance professional with 13+ years of experience aligning processes, systems, control points, and stakeholder expectations across regulated life sciences environments. Strong background in data-relevant architecture, governance, information flows, integration layers, and business-to-IT translation that supports trusted operations and AI-ready decision-making. Brings practical experience with structured knowledge systems, local AI tooling, and data-conscious workflow design in addition to enterprise transformation leadership.',
    competencies: [
      'Data Platform Governance',
      'Information Models and Data Standards',
      'Data Quality and Control Thinking',
      'Business and IT Translation',
      'Integration Layers and API-Aware Design',
      'AI-Ready Data Foundations',
      'Cross-Functional Delivery and Reporting',
      'Regulated Operating Environment Experience',
    ],
    experience: ['biontech_architecture', 'elsevier_product', 'tcs_delivery'],
    projectSet: 'data',
    skills: [
      ['Governance', ['data standards', 'metadata thinking', 'quality rules', 'reporting and visibility']],
      ['Architecture', ['data flows', 'APIs', 'system interactions', 'enterprise operating models']],
      ['Analytics', ['AI-ready foundations', 'knowledge workflows', 'structured retrieval', 'business reporting context']],
      ['Delivery', ['project coordination', 'stakeholder management', 'roadmap support', 'cross-functional execution']],
    ],
  },
];

for (const cv of cvs) {
  const html = renderCv(cv);
  writeFileSync(resolve(OUT_DIR, cv.filename), html);
  console.log(resolve(OUT_DIR, cv.filename));
}
