---
name: optimize-index-retrieval
description: Optimize context control for complex index-based skills without changing business scoring semantics. Use when a skill has large retrieval payloads, context explosion, unstable agent retries, or oversized search responses. Trigger for requests about response-profile/fields/limit/payload budget, oversize hints, staged payload breakdown, and benchmark comparison between full and compact outputs. Do not use for scoring-threshold changes, label policy changes, schema migrations, or non-index feature design.
---

# Optimize Index Retrieval

## Goal

Implement a strict, reusable optimization standard for complex index retrieval flows.
Keep retrieval and decision semantics unchanged; optimize only response shaping, context budget control, and retry guidance.

## Non-Goals

- Change scoring logic, thresholds, or label mapping.
- Redesign business workflow beyond retrieval context control.
- Replace domain datasets, schema, or storage models.

## Workflow

1. Freeze semantics first.
- Keep labels, thresholds, scoring weights, and ranking logic unchanged.
- Limit changes to response contract, payload control, and observability.

2. Add context-control inputs.
- Add `response profile` with exactly two values: `compact|full`.
- Default `compact` for heavy decision/intake commands.
- Default `full` for diagnostic and low-volume commands.
- Add `payload budget` in KB, default `20` (`20*1024` UTF-8 bytes).
- Clamp retrieval `limit` to `1..20`; report both requested and effective values.

3. Add oversize observability.
- Never silently truncate `full` output.
- Always compute payload bytes with UTF-8 serialized output.
- After profile + field mask are applied, run oversize check.
- If oversized, keep output visible and append:
  - `meta.contextControl.oversize=true`
  - `meta.contextControl.thresholdBytes`
  - `meta.contextControl.payloadBytes`
  - `meta.contextControl.oversizeStage`
  - `meta.contextControl.stageBreakdown`
  - `meta.contextControl.optimizationHints`
  - `meta.contextControl.limitAdjusted.requested/effective` when limit applies.

4. Provide explicit next-call hints.
- Generate at least 2 directly executable hint commands.
- Hints must prioritize:
  - switch to compact profile,
  - reduce `limit` (for example 20 -> 10 -> 5),
  - narrow fields,
  - split one heavy call into staged calls.
- For text mode, print an `OVERSIZE_HINT` block with copyable commands.

5. Validate with contract + child-runner + perf benchmark.
- Add contract tests for profile defaults, limit clamp, payload budget, oversize metadata completeness.
- Add output tests for `json/text/ndjson` consistency.
- Add child-runner simulation: first call oversized, second call follows hint and payload decreases while key decision fields remain available.
- Run `scripts/benchmark_context_control.py` to compare profiles and report payload/latency deltas.

## Required Contract

Load and apply [references/context-control-standard.md](references/context-control-standard.md) as the authoritative output contract.

## Performance Benchmark Capability

Use bundled script:
`./scripts/benchmark_context_control.py`

Example:

```powershell
python ./scripts/benchmark_context_control.py `
  --command-template "python skills/p1max-qa-playbook-workflow/workflow.py triage.decide --source internal --params @tmp/triage_input.json --payload-budget-kb 20 --response-profile {profile} --output json" `
  --stdout-format auto `
  --rounds 10 `
  --profile-a full `
  --profile-b compact `
  --min-payload-drop-pct 50
```

Expected use:
- Confirm payload reduction is substantial.
- Confirm latency regression is controlled.
- Produce JSON summary for release notes or review comments.
- Set `--stdout-format ndjson` when the target command emits NDJSON.

## Delivery Checklist

- Contract fields exist and are populated when oversized.
- `fields` keeps highest priority and still triggers oversize evaluation.
- No scoring/decision semantic change is introduced.
- Tests include child-runner guided retry.
- Benchmark script output is attached in review.
