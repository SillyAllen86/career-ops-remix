import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';
import { slugify } from './config.mjs';

export function getRuntimeRoot(root = process.cwd()) {
  return resolve(root, 'runtime');
}

export function getSessionPaths({ root = process.cwd(), portal, accountKey = 'default' }) {
  const runtimeRoot = getRuntimeRoot(root);
  const sessionDir = resolve(runtimeRoot, 'sessions', slugify(`${portal.session_storage_key}-${accountKey}`));
  return {
    runtimeRoot,
    sessionDir,
    userDataDir: resolve(sessionDir, 'user-data'),
    storageStatePath: resolve(sessionDir, 'storage-state.json'),
    manifestPath: resolve(sessionDir, 'manifest.json'),
  };
}

export async function launchPersistentSession({ root = process.cwd(), portal, accountKey = 'default', headless = false }) {
  const paths = getSessionPaths({ root, portal, accountKey });
  mkdirSync(paths.userDataDir, { recursive: true });
  const context = await chromium.launchPersistentContext(paths.userDataDir, {
    headless,
    viewport: { width: 1440, height: 1200 },
    acceptDownloads: true,
  });

  async function persist() {
    try {
      await context.storageState({ path: paths.storageStatePath });
    } catch {
      // ignore storage snapshot failures; persistent profile is primary state store.
    }
    writeFileSync(paths.manifestPath, JSON.stringify({
      portal_id: portal.portal_id,
      session_storage_key: portal.session_storage_key,
      updated_at: new Date().toISOString(),
      user_data_dir: paths.userDataDir,
    }, null, 2));
  }

  return { context, paths, persist };
}
