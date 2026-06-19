#!/usr/bin/env node

/**
 * doctor.mjs — Setup validation for career-ops
 * Checks all prerequisites and prints a pass/fail checklist.
 */

import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { resolveCodexBin } from './scripts/resolve-codex-bin.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;
const selectedProvider = (process.env.CAREER_OPS_PROVIDER || 'codex').toLowerCase();

const isTTY = process.stdout.isTTY;
const green = (s) => isTTY ? `\x1b[32m${s}\x1b[0m` : s;
const red = (s) => isTTY ? `\x1b[31m${s}\x1b[0m` : s;
const dim = (s) => isTTY ? `\x1b[2m${s}\x1b[0m` : s;

function checkNodeVersion() {
  const major = parseInt(process.versions.node.split('.')[0], 10);
  if (major >= 18) {
    return { pass: true, label: `Node.js >= 18 (v${process.versions.node})` };
  }
  return {
    pass: false,
    label: `Node.js >= 18 (found v${process.versions.node})`,
    fix: 'Install Node.js 18 or later from https://nodejs.org',
  };
}

function checkDependencies() {
  if (existsSync(join(projectRoot, 'node_modules'))) {
    return { pass: true, label: 'Dependencies installed' };
  }
  return {
    pass: false,
    label: 'Dependencies not installed',
    fix: 'Run: npm install',
  };
}

async function checkPlaywright() {
  try {
    const { chromium } = await import('playwright');
    const execPath = chromium.executablePath();
    if (existsSync(execPath)) {
      return { pass: true, label: 'Playwright chromium installed' };
    }
  } catch {}
  return {
    pass: false,
    label: 'Playwright chromium not installed',
    fix: 'Run: npx playwright install chromium',
  };
}

function commandExists(command) {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  return result.status === 0;
}

function checkProviderSelection() {
  const supported = ['codex', 'openai', 'claude'];
  if (supported.includes(selectedProvider)) {
    return { pass: true, label: `Provider selection valid (${selectedProvider})` };
  }
  return {
    pass: false,
    label: `Unsupported CAREER_OPS_PROVIDER (${selectedProvider})`,
    fix: 'Set CAREER_OPS_PROVIDER to codex, openai, or claude',
  };
}

function checkProviderRuntime() {
  if (selectedProvider === 'claude') {
    if (commandExists('claude')) {
      return { pass: true, label: 'Claude CLI available for provider=claude' };
    }
    return {
      pass: false,
      label: 'Claude CLI not found for provider=claude',
      fix: 'Install the Claude CLI or switch CAREER_OPS_PROVIDER=codex',
    };
  }

  if (selectedProvider === 'codex' || selectedProvider === 'openai') {
    const codexBin = resolveCodexBin();
    if (codexBin) {
      return { pass: true, label: `Codex CLI available for provider=${selectedProvider} (${codexBin})` };
    }
    return {
      pass: false,
      label: `Codex CLI not found for provider=${selectedProvider}`,
      fix: [
        'Install the Codex CLI, or',
        'Set CAREER_OPS_CODEX_BIN=/absolute/path/to/codex, or',
        'Switch CAREER_OPS_PROVIDER=claude',
      ],
    };
  }

  return { pass: false, label: 'Provider runtime check skipped because provider is invalid' };
}

function checkRunAgentAdapter() {
  const adapter = join(projectRoot, 'scripts', 'run-agent.mjs');
  if (existsSync(adapter)) {
    return { pass: true, label: 'Provider-neutral runner present (scripts/run-agent.mjs)' };
  }
  return {
    pass: false,
    label: 'Provider-neutral runner missing',
    fix: 'Expected scripts/run-agent.mjs to exist',
  };
}

function checkCv() {
  if (existsSync(join(projectRoot, 'cv.md'))) return { pass: true, label: 'cv.md found' };
  return {
    pass: false,
    label: 'cv.md not found',
    fix: [
      'Create cv.md in the project root with your CV in markdown',
      'See examples/ for reference CVs',
    ],
  };
}

function checkProfile() {
  if (existsSync(join(projectRoot, 'config', 'profile.yml'))) return { pass: true, label: 'config/profile.yml found' };
  return {
    pass: false,
    label: 'config/profile.yml not found',
    fix: [
      'Run: cp config/profile.example.yml config/profile.yml',
      'Then edit it with your details',
    ],
  };
}

function checkPortals() {
  if (existsSync(join(projectRoot, 'portals.yml'))) return { pass: true, label: 'portals.yml found' };
  return {
    pass: false,
    label: 'portals.yml not found',
    fix: [
      'Run: cp templates/portals.example.yml portals.yml',
      'Then customize with your target companies',
    ],
  };
}

function checkFonts() {
  const fontsDir = join(projectRoot, 'fonts');
  if (!existsSync(fontsDir)) {
    return { pass: false, label: 'fonts/ directory not found', fix: 'The fonts/ directory is required for PDF generation' };
  }
  try {
    const files = readdirSync(fontsDir);
    if (files.length === 0) {
      return { pass: false, label: 'fonts/ directory is empty', fix: 'The fonts/ directory must contain font files for PDF generation' };
    }
  } catch {
    return { pass: false, label: 'fonts/ directory not readable', fix: 'Check permissions on the fonts/ directory' };
  }
  return { pass: true, label: 'Fonts directory ready' };
}

function checkAutoDir(name) {
  const dirPath = join(projectRoot, name);
  if (existsSync(dirPath)) return { pass: true, label: `${name}/ directory ready` };
  try {
    mkdirSync(dirPath, { recursive: true });
    return { pass: true, label: `${name}/ directory ready (auto-created)` };
  } catch {
    return { pass: false, label: `${name}/ directory could not be created`, fix: `Run: mkdir ${name}` };
  }
}

async function main() {
  console.log('\ncareer-ops doctor');
  console.log('================\n');

  const checks = [
    checkNodeVersion(),
    checkProviderSelection(),
    checkProviderRuntime(),
    checkRunAgentAdapter(),
    checkDependencies(),
    await checkPlaywright(),
    checkCv(),
    checkProfile(),
    checkPortals(),
    checkFonts(),
    checkAutoDir('data'),
    checkAutoDir('output'),
    checkAutoDir('reports'),
  ];

  let failures = 0;
  for (const result of checks) {
    if (result.pass) {
      console.log(`${green('✓')} ${result.label}`);
    } else {
      failures += 1;
      console.log(`${red('✗')} ${result.label}`);
      for (const hint of (Array.isArray(result.fix) ? result.fix : [result.fix]).filter(Boolean)) {
        console.log(`  ${dim('→ ' + hint)}`);
      }
    }
  }

  console.log('');
  if (failures > 0) {
    console.log(`Result: ${failures} issue${failures === 1 ? '' : 's'} found. Fix them and run \`npm run doctor\` again.`);
    process.exit(1);
  }

  console.log(`Result: All checks passed. You're ready to go with provider=${selectedProvider}.`);
  console.log('');
  console.log('Primary path: run Codex/OpenAI in this repo (or set CAREER_OPS_PROVIDER=claude to keep the Claude path).');
  console.log('Join the community: https://discord.gg/8pRpHETxa4');
}

main().catch((err) => {
  console.error('doctor.mjs failed:', err.message);
  process.exit(1);
});
