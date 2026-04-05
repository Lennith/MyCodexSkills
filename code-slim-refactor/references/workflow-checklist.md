# Workflow Checklist

## 1. Branch Setup

- Confirm repository clean enough for scoped work.
- Confirm `target_branch` (default `master`) and `mode` (`quick` or `strict`).
- Checkout and update `target_branch`.
- Record baseline SHA as `BASE_SHA` before any refactor change.
- Create work branch `codex/refactor/<topic>-<YYYYMMDD>`.

## 2. Tracking Artifacts Gate

- Create or update `./slim_refactor/todolist.md`.
- Confirm this round status board exists and is maintained during execution.

## 3. Design-First Gate

- Create current-round design doc before editing code.
- Create or update `./slim_refactor/plan.md` using `references/plan-template.md` or `references/design-spec-template.md`.
- Document current system issues:
- redundancy
- state forks
- over-abstraction
- hidden behavior
- config path sprawl
- Define minimal closed loop that must stay working.
- Record contract invariants that must remain true for the intended current system.
- List action IDs and affected files/modules to delete, merge, or converge.
- Describe target structure in concise form.

## 4. Implementation Gate

- Execute only design-declared edits.
- If new change appears, update design doc first.
- Prefer deletion and consolidation over new abstraction.
- Do not relax backend contracts, response semantics, or assertion standards to satisfy tests.
- Update `todolist.md` status during execution.

## 5. Per-Round Review Gate

- Run review before each commit.
- Evaluate:
- regression risk
- behavior contract breaks
- missed cleanup
- state branching leftovers
- Resolve findings before commit.
- Log review outcome in `./slim_refactor/report.md`.

## 6. Contract-Mismatch Gate

When validation suggests backend/test disagreement:
- Stop implementation changes until classification is complete.
- Compare behavior against the intended current contract, not stale test expectations.
- Use a subagent for independent classification when available.
- If subagents are unavailable, run an explicit local fallback review and record that reviewer type.
- Classify the issue as exactly one of:
- `backend_regression`
- `stale_tests`
- For `backend_regression`, fix backend behavior without weakening tests.
- For `stale_tests`, only update the affected tests or skip those tests for the round.
- Record mismatch evidence, reviewer type, classification, and changed-or-skipped tests in `report.md`.

## 7. Validation Gate

For `quick`:
- Run scoped tests or critical smoke flow for changed scope.
- If they surface contract/test disagreement, route through the contract-mismatch gate.
- Block merge on failure unless the only remaining failure is an explicitly reported stale-test skip.

For `strict`:
- Discover complete workflow command with this priority:
  1. Project docs full/CI command.
  2. CI pipeline default branch checks.
  3. Aggregate test target in build tool.
- Run complete workflow gate.
- If it surfaces contract/test disagreement, route through the contract-mismatch gate.
- Block merge on failure unless the only remaining failure is an explicitly reported stale-test skip.

## 8. Block Recovery Gate (Baseline Re-Review)

When blocked by review or test:
- Compare current change against `BASE_SHA` (pre-change original code).
- Re-review delta from baseline, not only latest patch.
- Identify root cause and minimal fix.
- Re-run mismatch classification if the failure could be contract-related.
- Re-run review.
- Re-run required mode validation.
- Repeat until both pass.

## 9. Merge Gate

Merge only when all pass:
- Design-first compliance.
- Shared gates pass (branch, design, review, `./slim_refactor` artifacts).
- Contract integrity preserved or explicitly corrected.
- Mode gate pass (`quick` scoped validation or `strict` complete workflow), except for explicit stale-test skips that are reported as blocked follow-up.

## 10. Required Final Report

- What complexity was removed and why removable under first principles.
- What structure was converged.
- How error surface was reduced.
- Contract invariants kept or corrected.
- Mismatch evidence, classification, and reviewer type when applicable.
- Tests changed or skipped because of stale gates.
- Review final status.
- Validation status for selected mode.
- Merge status or block reason.