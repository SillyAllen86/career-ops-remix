# Batch Processing

Process multiple job offers in parallel via the provider-neutral adapter in `scripts/run-agent.mjs`. Each worker still runs the full evaluation pipeline (report + PDF + tracker TSV) autonomously.

## Quick start

1. Add offers to `batch-input.tsv` (`id`, `url`, `source`, `notes`)
2. Preview pending work:

```bash
./batch/batch-runner.sh --dry-run
```

3. Run the batch with the primary runtime:

```bash
./batch/batch-runner.sh --provider codex
```

4. Optional provider overrides:

```bash
./batch/batch-runner.sh --provider openai
./batch/batch-runner.sh --provider claude
```

5. Results are merged into `data/applications.md` and verified automatically at the end.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--parallel N` | `1` | Number of concurrent workers |
| `--provider NAME` | `codex` | Runtime provider: `codex`, `openai`, `claude` |
| `--dry-run` | off | Preview pending offers without processing |
| `--retry-failed` | off | Only retry offers marked as `failed` in state |
| `--start-from N` | `0` | Skip offers with ID below N |
| `--max-retries N` | `2` | Max retry attempts per offer before giving up |
| `--min-score N` | `0` | Skip PDF/tracker for offers scoring below N |

## Directory layout

```
batch/
  batch-runner.sh          # Orchestrator script
  batch-prompt.md          # Prompt template for workers
  batch-input.tsv          # Input offers
  batch-state.tsv          # Processing state (resumable)
  logs/                    # Per-offer worker logs
  tracker-additions/       # TSV lines produced by workers
    merged/                # TSVs already merged into applications.md
```

## How it works

1. `batch-runner.sh` reads `batch-input.tsv` and `batch-state.tsv`.
2. For each pending offer, it resolves placeholders in `batch-prompt.md`, assigns the next report number, and calls `scripts/run-agent.mjs`.
3. `scripts/run-agent.mjs` selects the configured provider runtime and forwards the task to it.
4. The worker produces a report in `reports/`, a PDF in `output/`, and one tracker TSV in `tracker-additions/`.
5. At the end, `merge-tracker.mjs` merges TSVs into `data/applications.md` and `verify-pipeline.mjs` checks integrity.

## Compatibility notes

- Claude users can continue with `--provider claude`
- Codex/OpenAI is the primary documented path
- Output contracts, tracker merge behavior, retries, resume semantics, numbering, and logs are preserved
