#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PROFILES_ROOT = resolve(ROOT, 'profiles');
const BACKUPS_ROOT = resolve(ROOT, '.profile-backups');

const CANONICAL_FILES = [
  { packPath: 'cv.md', livePath: 'cv.md', required: true },
  { packPath: 'profile.yml', livePath: 'config/profile.yml', required: true },
  { packPath: 'article-digest.md', livePath: 'article-digest.md', required: false },
  { packPath: 'portals.yml', livePath: 'portals.yml', required: false },
];

const [, , command, profileId, ...restArgs] = process.argv;
const flags = new Set(restArgs);

if (!command || !['init', 'capture', 'activate', 'list'].includes(command)) {
  printUsage();
  process.exit(command ? 1 : 0);
}

if (command !== 'list' && !profileId) {
  console.error('Missing profile id.');
  printUsage();
  process.exit(1);
}

mkdirSync(PROFILES_ROOT, { recursive: true });

switch (command) {
  case 'init':
    initProfile(profileId);
    break;
  case 'capture':
    captureProfile(profileId, { force: flags.has('--force') });
    break;
  case 'activate':
    activateProfile(profileId);
    break;
  case 'list':
    listProfiles();
    break;
  default:
    printUsage();
    process.exit(1);
}

function initProfile(id) {
  const dir = profileDir(id);
  if (existsSync(dir)) {
    console.error(`Profile already exists: profiles/${id}`);
    process.exit(1);
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'README.md'), renderProfileReadme(id));
  writeFileSync(resolve(dir, 'cv.md'), renderCvTemplate(id));
  writeFileSync(resolve(dir, 'profile.yml'), renderProfileTemplate(id));

  console.log(`Created profile scaffold: profiles/${id}`);
  console.log(`Next: fill in profiles/${id}/cv.md and profiles/${id}/profile.yml`);
  console.log(`Then: node scripts/profile-manager.mjs activate ${id}`);
}

function captureProfile(id, { force }) {
  const dir = profileDir(id);
  mkdirSync(dir, { recursive: true });

  for (const file of CANONICAL_FILES) {
    const source = resolve(ROOT, file.livePath);
    const target = resolve(dir, file.packPath);
    if (!existsSync(source)) {
      if (file.required) {
        console.error(`Missing canonical file: ${relativeRoot(source)}`);
        process.exit(1);
      }
      continue;
    }
    if (existsSync(target) && !force) {
      console.error(`Refusing to overwrite profiles/${id}/${file.packPath}. Re-run with --force if intentional.`);
      process.exit(1);
    }
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target);
    console.log(`Captured ${relativeRoot(source)} -> profiles/${id}/${file.packPath}`);
  }

  ensureProfileReadme(dir, id);
}

function activateProfile(id) {
  const dir = profileDir(id);
  if (!existsSync(dir)) {
    console.error(`Unknown profile: profiles/${id}`);
    process.exit(1);
  }

  const missingRequired = CANONICAL_FILES
    .filter((file) => file.required)
    .map((file) => resolve(dir, file.packPath))
    .filter((path) => !existsSync(path));

  if (missingRequired.length) {
    console.error(`Profile ${id} is incomplete. Missing:`);
    for (const path of missingRequired) {
      console.error(`- profiles/${id}/${basename(path)}`);
    }
    process.exit(1);
  }

  const backupDir = createBackupDir(id);
  for (const file of CANONICAL_FILES) {
    const live = resolve(ROOT, file.livePath);
    const packed = resolve(dir, file.packPath);

    if (existsSync(live)) {
      const backupPath = resolve(backupDir, file.packPath);
      mkdirSync(dirname(backupPath), { recursive: true });
      cpSync(live, backupPath);
    }

    if (existsSync(packed)) {
      mkdirSync(dirname(live), { recursive: true });
      cpSync(packed, live);
      console.log(`Activated profiles/${id}/${file.packPath} -> ${relativeRoot(live)}`);
    }
  }

  writeFileSync(resolve(ROOT, '.active-profile'), `${id}\n`);
  console.log(`Active profile set to: ${id}`);
  console.log(`Backup saved under: ${relativeRoot(backupDir)}`);
}

function listProfiles() {
  const entries = [...new Set(readProfileIds())].sort();
  if (!entries.length) {
    console.log('No saved profiles yet. Create one with: node scripts/profile-manager.mjs init <profile-id>');
    return;
  }

  const active = readActiveProfile();
  for (const id of entries) {
    console.log(`${id}${id === active ? '  [active]' : ''}`);
  }
}

function readProfileIds() {
  try {
    return readFileSync(resolve(ROOT, '.active-profile'), 'utf8')
      .split('\n')
      .filter(Boolean)
      .concat(
        existsSync(PROFILES_ROOT)
          ? readDirNames(PROFILES_ROOT)
          : [],
      );
  } catch {
    return existsSync(PROFILES_ROOT) ? readDirNames(PROFILES_ROOT) : [];
  }
}

function readDirNames(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function readActiveProfile() {
  const path = resolve(ROOT, '.active-profile');
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8').trim();
}

function createBackupDir(id) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = resolve(BACKUPS_ROOT, `${stamp}-${id}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function ensureProfileReadme(dir, id) {
  const readmePath = resolve(dir, 'README.md');
  if (!existsSync(readmePath)) {
    writeFileSync(readmePath, renderProfileReadme(id));
  }
}

function profileDir(id) {
  return resolve(PROFILES_ROOT, id);
}

function relativeRoot(path) {
  return path.startsWith(`${ROOT}/`) ? path.slice(ROOT.length + 1) : path;
}

function renderProfileReadme(id) {
  return `# Profile Pack: ${id}

This folder stores one candidate profile for career-ops.

Required files:
- \`cv.md\`
- \`profile.yml\`

Optional files:
- \`article-digest.md\`
- \`portals.yml\`

Activate this pack into the canonical workspace files with:

\`\`\`bash
node scripts/profile-manager.mjs activate ${id}
\`\`\`
`;
}

function renderCvTemplate(id) {
  return `# ${titleFromId(id)}

## Summary

Write a short candidate summary here.

## Experience

### Company Name
Role Title | Dates

- Add measurable impact bullets.

## Education

- Degree, institution

## Skills

- Skill 1
- Skill 2
`;
}

function renderProfileTemplate(id) {
  return `candidate:
  full_name: "${titleFromId(id)}"
  email: ""
  phone: ""
  location: ""
  linkedin: ""
  portfolio_url: ""
  github: ""
  twitter: ""

target_roles:
  primary:
    - ""
  archetypes:
    - name: ""
      level: ""
      fit: "primary"

narrative:
  headline: ""
  exit_story: ""
  superpowers:
    - ""
  proof_points:
    - name: ""
      url: ""
      hero_metric: ""

compensation:
  target_range: "TBD"
  currency: "EUR"
  minimum: "TBD"
  location_flexibility: ""

location:
  country: ""
  city: ""
  timezone: ""
  visa_status: ""
  onsite_availability: ""
`;
}

function titleFromId(id) {
  return String(id)
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function printUsage() {
  console.log(`Usage:
  node scripts/profile-manager.mjs list
  node scripts/profile-manager.mjs init <profile-id>
  node scripts/profile-manager.mjs capture <profile-id> [--force]
  node scripts/profile-manager.mjs activate <profile-id>`);
}
