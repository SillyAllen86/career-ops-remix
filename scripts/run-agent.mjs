#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function usage() {
  console.error(`career-ops run-agent

Usage:
  node scripts/run-agent.mjs --prompt <text> --system-prompt-file <file> [options]

Options:
  --provider <codex|openai|claude>   Agent runtime to use (default: CAREER_OPS_PROVIDER or codex)
  --prompt <text>                    User prompt / task instruction
  --system-prompt-file <file>        Shared instructions or resolved prompt file
  --project-dir <dir>                Working directory (default: current directory)
  --model <name>                     Optional model override
  --help                             Show this help
`);
}

function parseArgs(argv) {
  const out = {
    provider: process.env.CAREER_OPS_PROVIDER || 'codex',
    projectDir: process.cwd(),
    prompt: '',
    systemPromptFile: '',
    model: process.env.CAREER_OPS_AGENT_MODEL || '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--provider':
        out.provider = argv[++i];
        break;
      case '--prompt':
        out.prompt = argv[++i] || '';
        break;
      case '--system-prompt-file':
        out.systemPromptFile = argv[++i] || '';
        break;
      case '--project-dir':
        out.projectDir = argv[++i] || process.cwd();
        break;
      case '--model':
        out.model = argv[++i] || '';
        break;
      case '--help':
      case '-h':
        usage();
        process.exit(0);
      default:
        console.error(`Unknown option: ${arg}`);
        usage();
        process.exit(1);
    }
  }

  return out;
}

function commandExists(command) {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  return result.status === 0;
}

function buildCommand(opts) {
  const provider = String(opts.provider || 'codex').toLowerCase();
  const systemPromptFile = resolve(opts.systemPromptFile);
  const projectDir = resolve(opts.projectDir);

  if (!existsSync(systemPromptFile)) {
    throw new Error(`System prompt file not found: ${systemPromptFile}`);
  }

  if (!opts.prompt) {
    throw new Error('--prompt is required');
  }

  const systemPrompt = readFileSync(systemPromptFile, 'utf8').trim();
  const combinedPrompt = `${systemPrompt}\n\nTask:\n${opts.prompt}`;

  if (provider === 'claude') {
    if (!commandExists('claude')) {
      throw new Error('Selected provider=claude but the `claude` CLI is not available in PATH.');
    }
    const args = ['-p', '--dangerously-skip-permissions', '--append-system-prompt-file', systemPromptFile];
    if (opts.model) args.push('--model', opts.model);
    args.push(opts.prompt);
    return { command: 'claude', args, cwd: projectDir };
  }

  if (provider === 'codex' || provider === 'openai') {
    if (!commandExists('codex')) {
      throw new Error('Selected provider=' + provider + ' but the `codex` CLI is not available in PATH.');
    }
    const args = ['exec', '--full-auto', '-C', projectDir];
    if (opts.model) args.push('--model', opts.model);
    args.push(combinedPrompt);
    return { command: 'codex', args, cwd: projectDir };
  }

  throw new Error(`Unsupported provider: ${opts.provider}. Use codex, openai, or claude.`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const run = buildCommand(opts);
  const result = spawnSync(run.command, run.args, {
    cwd: run.cwd,
    stdio: 'inherit',
    env: process.env,
  });

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`run-agent.mjs failed: ${error.message}`);
  process.exit(1);
}
