---
name: code-slim-refactor
description: Conduct convergence-oriented simplification refactors for local Git repositories with two gate strengths (lite and strict). Use when requests mention 精简重构, 收敛重构, code slim, slim refactor, remove redundancy, or reduce error surface. Both modes require branch-first delivery, design-before-code, per-round review, and ./slim_refactor trace artifacts; strict additionally requires complete workflow gate before merge.
---

# Code Slim Refactor

## Core Goal

Run practical convergence refactors that remove non-essential complexity and keep a minimal working loop.
Keep reasons traceable and reduce error surface.

## Modes

Choose one mode per run:
- `lite`: branch + design + review + `./slim_refactor` tracking + scoped validation or smoke gate.
- `strict`: everything in `lite` plus complete workflow gate before merge.

## Required Shared Gates

Apply all shared gates in both modes:
- Create and use a dedicated work branch. Never edit directly on target branch.
- Write design before code edits.
- Run review in every change round.
- Track run artifacts in repository path `./slim_refactor`:
  - `./slim_refactor/todolist.md`
  - `./slim_refactor/plan.md`
  - `./slim_refactor/report.md`
- Restrict implementation to design-declared changes. Update design first when scope changes.

## Mode Selection

Collect and confirm these inputs before execution:
- `repo_path`: Absolute path to the target Git repository.
- `target_branch`: Branch to merge into. Default `master`.
- `scope`: Optional path scope.
- `refactor_goal`: One-line convergence objective.
- `mode`: `lite` or `strict`. Default `lite`.

Auto-upgrade to `strict` when user intent includes terms such as:
- 完整门禁
- 完整测试
- full gate
- complete workflow
- release-blocking validation

If an input is missing, infer safe defaults and state them.

## Execution Workflow

Follow steps in order:

1. Baseline and branch setup
- Checkout and sync `target_branch`.
- Record `BASE_SHA`.
- Create branch `codex/refactor/<topic>-<YYYYMMDD>`.

2. Initialize tracking artifacts
- Create or update `./slim_refactor/todolist.md` using `references/todolist-template.md`.
- Set current round tasks and status.

3. Design first
- Create or update `./slim_refactor/plan.md` using `references/plan-template.md`.
- Include current issues, minimal closed loop, action IDs, target structure, and validation plan.

4. Implement only declared actions
- Apply only plan-declared actions.
- Prefer deletion and convergence over new abstractions.
- Update `todolist.md` status during execution.

5. Per-round review gate
- Run review for each change round.
- Focus on regressions, hidden state forks, and missed cleanup.
- Record findings and resolutions in `./slim_refactor/report.md`.

6. Validation gate
- In `lite`: run scoped tests or critical smoke checks relevant to changed scope.
- In `strict`: run complete workflow command set. Block merge on failure.

7. Finalize report and merge decision
- Complete `./slim_refactor/report.md` using `references/report-template.md`.
- Include file to action traceability and validation evidence.
- Merge only when mode-required gates pass.

## Output Requirements

Final summary must include:
- removed non-essential complexity,
- converged structure,
- error-surface reduction,
- review result,
- validation result for selected mode,
- merge or block decision.

## References

- `references/workflow-checklist.md`
- `references/design-spec-template.md`
- `references/todolist-template.md`
- `references/plan-template.md`
- `references/report-template.md`
