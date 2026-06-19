#!/usr/bin/env node

import { loadApplyConfig, loadPortalCredentials, loadProfile, resolveCredentials, resolveJobRoute, resolveResumePath, slugify } from './lib/apply/config.mjs';
import { createRunLogger } from './lib/apply/logger.mjs';
import { launchPersistentSession } from './lib/apply/session-manager.mjs';
import { errorResult, normalizeNeverSubmit, normalizeRunMode } from './lib/apply/types.mjs';
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
  if (!portal) return null;
  if (portal.ats_type === 'workday') return WorkdayAdapter;
  if (portal.ats_type === 'successfactors') return SuccessFactorsAdapter;
  return null;
}

const args = parseArgs(process.argv.slice(2));
const mode = normalizeRunMode(args.mode);
const neverSubmit = normalizeNeverSubmit(args['never-submit']);
const headless = args.headless === 'true';

const root = process.cwd();
const applyConfig = loadApplyConfig(root);
const profile = loadProfile(root);
const route = resolveJobRoute({
  config: applyConfig,
  portalId: args['portal-id'],
  jobUrl: args['job-url'],
  applyUrl: args['apply-url'],
  company: args.company,
  routingMode: args['routing-mode'],
});

if (!route.portal) {
  console.error(JSON.stringify(errorResult('Portal route not found. Add apply.portals/apply.jobs metadata to portals.yml.'), null, 2));
  process.exit(1);
}

const Adapter = adapterFor(route.portal);
if (!Adapter) {
  console.error(JSON.stringify(errorResult(`Unsupported ATS adapter: ${route.portal.ats_type}`), null, 2));
  process.exit(1);
}

const credentials = resolveCredentials(loadPortalCredentials(root), route.portal);
const accountKey = slugify(credentials?.user_id || credentials?.email || profile?.candidate?.email || 'default');
const logger = createRunLogger({ root, portalId: route.portal.portal_id, runKind: 'apply', jobUrl: route.job.job_url || route.job.apply_url });
const session = await launchPersistentSession({ root, portal: route.portal, accountKey, headless });
const page = session.context.pages()[0] || await session.context.newPage();
const adapter = new Adapter({
  page,
  portal: route.portal,
  job: route.job,
  profile,
  credentials,
  logger,
  mode,
  neverSubmit,
  resumePath: resolveResumePath(profile, root),
});

let result;
try {
  await logger.logPage(page, { step: 'run-start', status: 'info', extra: { mode, neverSubmit, headless } });

  result = await adapter.openJob();
  if (result.status !== 'success') throw new Error(result.message || 'Failed to open job page');

  const detection = await adapter.detectPortal();
  if (detection.status !== 'success') throw new Error(detection.message || 'Portal detection failed');

  if (mode === 'inspect_only') {
    result = { status: 'success', mode, message: 'Inspection complete; no login or form filling attempted.' };
  } else {
    await adapter.enterApplyFlow();
    let sessionState = await adapter.ensureSession();
    if (!sessionState.authenticated) {
      await adapter.goToSignIn();
      const signInResult = await adapter.signIn();
      if (signInResult.status !== 'success') {
        result = signInResult;
      } else {
        await adapter.openJob();
        await adapter.enterApplyFlow();
        result = await adapter.advanceToReview();
      }
    } else {
      await adapter.openJob();
      await adapter.enterApplyFlow();
      result = await adapter.advanceToReview();
    }
  }

  await session.persist();
  logger.writeSummary({
    portal: route.portal,
    job: route.job,
    mode,
    never_submit: neverSubmit,
    result,
    run_dir: logger.runDir,
  });

  console.log(JSON.stringify({ ...result, run_dir: logger.runDir }, null, 2));
  process.exit(result.status === 'error' ? 1 : 0);
} catch (error) {
  await session.persist();
  const failure = errorResult(error.message, { run_dir: logger.runDir });
  logger.writeSummary({ portal: route.portal, job: route.job, mode, never_submit: neverSubmit, result: failure, run_dir: logger.runDir });
  console.error(JSON.stringify(failure, null, 2));
  process.exit(1);
} finally {
  await session.context.close().catch(() => {});
}
