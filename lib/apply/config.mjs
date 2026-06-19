import { existsSync, readFileSync, readdirSync } from 'fs';
import { extname, resolve } from 'path';
import yaml from 'js-yaml';

export function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'default';
}

function readYaml(path) {
  if (!existsSync(path)) return {};
  return yaml.load(readFileSync(path, 'utf8')) || {};
}

function normalizePortal(portal = {}) {
  const portalId = portal.portal_id || slugify(portal.company || portal.login_entry_url || portal.profile_url || 'portal');
  return {
    portal_id: portalId,
    ats_type: portal.ats_type || 'other',
    login_entry_url: portal.login_entry_url || '',
    profile_url: portal.profile_url || '',
    status_page_url: portal.status_page_url || '',
    job_apply_entry_mode: portal.job_apply_entry_mode || 'role_page_click',
    requires_account_before_form: Boolean(portal.requires_account_before_form),
    supports_resume_autofill: Boolean(portal.supports_resume_autofill),
    supports_guest_apply: Boolean(portal.supports_guest_apply),
    session_storage_key: portal.session_storage_key || portalId,
  };
}

function normalizeJob(job = {}) {
  return {
    company: job.company || '',
    job_url: job.job_url || '',
    apply_url: job.apply_url || '',
    portal_id: job.portal_id || '',
    routing_mode: job.routing_mode || 'role_page_click',
  };
}

export function normalizeApplyConfig(source = {}) {
  const apply = source.apply || {};
  const portals = Array.isArray(apply.portals) ? apply.portals.map(normalizePortal) : [];
  const jobs = Array.isArray(apply.jobs) ? apply.jobs.map(normalizeJob) : [];
  const portalsById = Object.fromEntries(portals.map((portal) => [portal.portal_id, portal]));
  return { portals, portalsById, jobs };
}

export function loadApplyConfig(root = process.cwd()) {
  const portalsPath = resolve(root, 'portals.yml');
  const raw = readYaml(portalsPath);
  return normalizeApplyConfig(raw);
}

export function loadProfile(root = process.cwd()) {
  return readYaml(resolve(root, 'config/profile.yml'));
}

export function loadPortalCredentials(root = process.cwd()) {
  return readYaml(resolve(root, 'secrets/portal-credentials.yml'));
}

export function resolveCredentials(credentials, portal) {
  if (!credentials || !portal) return null;
  return credentials[portal.portal_id] || credentials[portal.session_storage_key] || null;
}

export function resolveJobRoute({ config, portalId, jobUrl, applyUrl, company, routingMode }) {
  if (portalId && config.portalsById[portalId]) {
    const route = config.jobs.find((job) => job.portal_id === portalId && (job.job_url === jobUrl || job.apply_url === applyUrl)) || {};
    return {
      portal: config.portalsById[portalId],
      job: {
        company: company || route.company || '',
        job_url: jobUrl || route.job_url || '',
        apply_url: applyUrl || route.apply_url || '',
        portal_id: portalId,
        routing_mode: routingMode || route.routing_mode || config.portalsById[portalId].job_apply_entry_mode,
      },
    };
  }

  const matchedJob = config.jobs.find((job) => (jobUrl && job.job_url === jobUrl) || (applyUrl && job.apply_url === applyUrl));
  if (matchedJob && config.portalsById[matchedJob.portal_id]) {
    return {
      portal: config.portalsById[matchedJob.portal_id],
      job: {
        ...matchedJob,
        company: company || matchedJob.company,
        job_url: jobUrl || matchedJob.job_url,
        apply_url: applyUrl || matchedJob.apply_url,
        routing_mode: routingMode || matchedJob.routing_mode,
      },
    };
  }

  return {
    portal: null,
    job: {
      company: company || '',
      job_url: jobUrl || '',
      apply_url: applyUrl || '',
      portal_id: portalId || '',
      routing_mode: routingMode || 'role_page_click',
    },
  };
}

export function resolveResumePath(profile, root = process.cwd()) {
  const candidates = [
    profile?.candidate?.resume_path,
    profile?.candidate?.resume_pdf,
    profile?.execution?.apply?.resume_path,
    profile?.execution?.resume_path,
  ].filter(Boolean);

  for (const candidate of candidates) {
    const absolute = resolve(root, candidate);
    if (existsSync(absolute)) return absolute;
  }

  const outputDir = resolve(root, 'output');
  if (!existsSync(outputDir)) return null;
  const pdfs = readdirSync(outputDir)
    .filter((name) => extname(name).toLowerCase() == '.pdf')
    .map((name) => resolve(outputDir, name));
  return pdfs.sort().at(-1) || null;
}
