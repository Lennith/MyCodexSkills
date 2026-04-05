# Workflow Checklist

## 1. Branch Setup

- Confirm repository clean enough for scoped work.
- Confirm `target_branch` (default `master`) and `mode` (`lite` or `strict`).
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
- List action IDs and affected files/modules to delete, merge, or converge.
- Describe target structure in concise form.

## 4. Implementation Gate

- Execute only design-declared edits.
- If new change appears, update design doc first.
- Prefer deletion and consolidation over new abstraction.
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

## 6. Validation Gate

For `lite`:
- Run scoped tests or critical smoke flow for changed scope.
- Block merge on failure.

For `strict`:
- Discover complete workflow command with this priority:
  1. Project docs full/CI command.
  2. CI pipeline default branch checks.
  3. Aggregate test target in build tool.
- Run complete workflow gate and block merge on failure.

## 7. Block Recovery Gate (Baseline Re-Review)

When blocked by review or test:
- Compare current change against `BASE_SHA` (pre-change original code).
- Re-review delta from baseline, not only latest patch.
- Identify root cause and minimal fix.
- Re-run review.
- Re-run required mode validation.
- Repeat until both pass.

## 8. Merge Gate

Merge only when all pass:
- Design-first compliance.
- Shared gates pass (branch, design, review, `./slim_refactor` artifacts).
- Mode gate pass (`lite` scoped validation or `strict` complete workflow).

## 9. Required Final Report

- What complexity was removed and why removable under first principles.
- What structure was converged.
- How error surface was reduced.
- Review final status.
- Validation status for selected mode.
- Merge status or block reason.
