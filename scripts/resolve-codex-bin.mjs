#!/usr/bin/env node

import { accessSync, constants, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function isExecutable(target) {
  if (!target || !existsSync(target)) return false;
  try {
    accessSync(target, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function commandOnPath(command) {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  if (result.status !== 0) return '';
  return result.stdout.trim();
}

function platformTriples() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'linux' && arch === 'x64') return ['codex-linux-x64/vendor/x86_64-unknown-linux-musl/bin/codex'];
  if (platform === 'linux' && arch === 'arm64') return ['codex-linux-arm64/vendor/aarch64-unknown-linux-musl/bin/codex'];
  if (platform === 'darwin' && arch === 'arm64') return ['codex-darwin-arm64/vendor/aarch64-apple-darwin/bin/codex'];
  if (platform === 'darwin' && arch === 'x64') return ['codex-darwin-x64/vendor/x86_64-apple-darwin/bin/codex'];

  return [];
}

function openClawCandidates() {
  const home = os.homedir();
  const base = path.join(home, '.openclaw', 'npm', 'projects');
  if (!existsSync(base)) return [];

  const suffixes = [
    'node_modules/@openclaw/codex/node_modules/.bin/codex',
    ...platformTriples().map((triple) =>
      path.join('node_modules/@openclaw/codex/node_modules/@openai', triple),
    ),
  ];

  const candidates = [];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const suffix of suffixes) {
      candidates.push(path.join(base, entry.name, suffix));
    }
  }
  return candidates;
}

export function resolveCodexBin() {
  const candidates = [
    process.env.CAREER_OPS_CODEX_BIN || '',
    commandOnPath('codex'),
    path.join(projectRoot, 'node_modules', '.bin', 'codex'),
    ...openClawCandidates(),
  ];

  for (const candidate of candidates) {
    if (isExecutable(candidate)) {
      return candidate;
    }
  }

  return '';
}

if (process.argv[1] === __filename) {
  const resolved = resolveCodexBin();
  if (!resolved) {
    process.exit(1);
  }
  process.stdout.write(`${resolved}\n`);
}
