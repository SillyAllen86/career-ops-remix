#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { loadApplyConfig, loadPortalCredentials, loadProfile, resolveCredentials, slugify } from './lib/apply/config.mjs';
import { createRunLogger } from './lib/apply/logger.mjs';
import { launchPersistentSession } from './lib/apply/session-manager.mjs';
import { WorkdayAdapter } from './lib/apply/adapters/workday.mjs';
import { SuccessFactorsAdapter } from './lib/apply/adapters/successfactors.mjs';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function adapterFor(portal) {
  if (portal.ats_type === 'workday') return WorkdayAdapter;
  if (portal.ats_type === 'successfactors') return SuccessFactorsAdapter;
  return null;
}

function parseTracker(root) {
  const trackerPath = `${root}/data/applications.md`;
  if (!existsSync(trackerPath)) return [];
  return readFileSync(trackerPath, 'utf8')
    .split('\n')
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split('|').map((part) => part.trim()))
    .map((parts) => ({
      index: parts[1],
      date: parts[2],
      company: parts[3],
      role: parts[4],
      score: parts[5],
      status: parts[6],
      notes: parts[9] || '',
    }));
}

function mapStatusesToTracker(trackerRows, portalStatuses) {
  return portalStatuses.map((statusRow) => {
    const raw = statusRow.raw || '';
    const trackerMatch = trackerRows.find((row) => raw.toLowerCase().includes(row.company.toLowerCase()) || raw.toLowerCase().includes(row.role.toLowerCase()));
    return {
      portal_status: raw,
      tracker_match: trackerMatch || null,
      proposed_update: trackerMatch ? { index: trackerMatch.index, from: trackerMatch.status, to: raw } : null,
    };
  });
}

const args = parseArgs(process.argv.slice(2));
const root = process.cwd();
const applyConfig = loadApplyConfig(root);
const profile = loadProfile(root);
const trackerRows = parseTracker(root);
const credentialsMap = loadPortalCredentials(root);
const portals = applyConfig.portals.filter((portal) => !args['portal-id'] || portal.portal_id === args['portal-id']);
const headless = args.headless !== 'false';

const reports = [];
for (const portal of portals) {
  const Adapter = adapterFor(portal);
  if (!Adapter || !portal.status_page_url) continue;
  const credentials = resolveCredentials(credentialsMap, portal);
  const accountKey = slugify(credentials?.user_id || credentials?.email || profile?.candidate?.email || 'default');
  const logger = createRunLogger({ root, portalId: portal.portal_id, runKind: 'status-sync', jobUrl: portal.status_page_url });
  const session = await launchPersistentSession({ root, portal, accountKey, headless });
  const page = session.context.pages()[0] || await session.context.newPage();
  const adapter = new Adapter({ page, portal, job: { portal_id: portal.portal_id }, profile, credentials, logger, mode: 'inspect_only', neverSubmit: true, resumePath: null });

  try {
    const sessionState = await adapter.ensureSession();
    const result = sessionState.authenticated ? await adapter.readApplicationStatus() : { status: 'error', message: 'No authenticated saved session found for status sync' };
    const proposals = result.status === 'success' ? mapStatusesToTracker(trackerRows, result.statuses || []) : [];
    const report = { portal_id: portal.portal_id, session: sessionState, result, proposals, run_dir: logger.runDir };
    logger.writeSummary(report);
    reports.push(report);
  } finally {
    await session.persist();
    await session.context.close().catch(() => {});
  }
}

console.log(JSON.stringify({
  dry_run: true,
  reports,
  note: 'Status sync only proposes tracker updates. It does not write applications.md.',
}, null, 2));
