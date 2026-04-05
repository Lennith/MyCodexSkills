---
name: code-slim-refactor
description: Conduct explicit convergence-oriented refactors for local Git repositories when the user asks for code slim, slim refactor, 收敛重构, 精简重构, redundancy removal, or a structured simplification pass with review gates. Use this skill for deliberate refactor work, not for routine cleanup or ordinary bug fixes.
---

# Code Slim Refactor

## Trigger Boundary

Use this skill only when the user explicitly wants a structured simplification or convergence refactor.

Do not trigger it for:
- small cleanup
- routine bug fixes
- one-off renames
- ordinary refactors that do not need a dedicated convergence workflow

## Modes

Choose one mode per run:
- `quick`: lightweight convergence pass for a small or well-bounded area
- `strict`: formal refactor pass with full traceability and merge gates

Default to `quick` unless the user asks for a formal, auditable, or release-sensitive refactor.

## Required Inputs

- `repo_path`: absolute path to the Git repository
- `refactor_goal`: one-line convergence objective
- `scope`: optional path or module scope
- `mode`: `quick` or `strict`
- `target_branch`: only required for `strict`, default `master`

## Core Rule

This workflow does not preserve old external compatibility by default, but it must preserve the intended current contract of the scoped system.

Never change backend contracts, response semantics, or assertion standards merely to make tests pass.

## Quick Mode

Use `quick` when the task is bounded and the user mainly wants convergence, not a formal artifact trail.

Required steps:
1. State the goal, scope, and main complexity to remove.
2. Keep a short action list in the conversation or a minimal local note if helpful.
3. Apply only scoped changes tied to that action list.
4. Preserve backend contracts, response semantics, and assertion standards.
5. Run focused validation for the changed area.
6. If validation suggests backend/test disagreement, stop and run the contract-mismatch gate before any more edits.
7. Report what complexity was removed, what stayed, and any remaining risk.

`./slim_refactor/` artifacts are optional in `quick` mode.

## Strict Mode

Use `strict` when the refactor must be traceable, auditable, or merge-gated.

Required gates:
1. Create and use a dedicated work branch. Never edit directly on the target branch.
2. Write design before code edits.
3. Track artifacts under `./slim_refactor/`:
   - `todolist.md`
   - `plan.md`
   - `report.md`
4. Preserve backend contracts, response semantics, and assertion standards.
5. Run review in every change round.
6. Run the contract-mismatch gate whenever validation suggests backend/test disagreement.
7. Run the complete workflow gate before merge.

## Contract-Mismatch Gate

Use this gate whenever tests fail in a way that could reflect a contract disagreement instead of a real regression.

Required actions:
1. Stop implementation changes until classification is complete.
2. Compare current behavior, intended current contract, and test expectations.
3. Launch an independent subagent review when subagents are available.
4. If subagents are unavailable, perform an explicit local review fallback and record that fallback in the round output.
5. Classify the mismatch as exactly one of:
   - `backend_regression`: backend behavior is wrong for the intended current contract.
   - `stale_tests`: tests lag the intended current contract.

Allowed actions after classification:
- `backend_regression`: fix backend behavior to the intended current contract. Do not weaken tests to hide the issue.
- `stale_tests`: only update the affected tests or skip those tests for this round. Do not relax backend contracts or assertion standards.

If tests are skipped, report the stale-gate condition, the skipped scope, and the required follow-up before ending the round.

## Execution Workflow

### Quick

1. Confirm goal, scope, and validation target.
2. Remove non-essential complexity with the smallest coherent change set.
3. Prefer deletion and convergence over new abstraction.
4. Preserve the intended current backend contract while changing structure.
5. Validate the affected scope.
6. If validation suggests contract/test disagreement, run the contract-mismatch gate before more edits.
7. Summarize convergence result and residual risk.

### Strict

1. Checkout and sync `target_branch`.
2. Record `BASE_SHA`.
3. Create branch `codex/refactor/<topic>-<YYYYMMDD>`.
4. Create or update `./slim_refactor/todolist.md`.
5. Create or update `./slim_refactor/plan.md`.
6. Implement only plan-declared actions.
7. Preserve the intended current backend contract while converging structure.
8. Run review for each change round and record findings in `./slim_refactor/report.md`.
9. If validation suggests contract/test disagreement, run the contract-mismatch gate and record reviewer type plus classification.
10. Run the complete workflow gate.
11. Finalize `report.md` with traceability and merge or block decision.

## Output Requirements

Always report:
- removed complexity
- converged structure
- validation result
- remaining risk
- contract invariants kept or corrected
- mismatch classification when applicable
- reviewer type (`subagent` or `local_fallback`) when mismatch review happened
- tests changed or skipped when stale tests were found

For `strict`, also report:
- branch name
- artifact paths
- review result
- merge or block decision

## References

- `references/workflow-checklist.md`
- `references/design-spec-template.md`
- `references/todolist-template.md`
- `references/plan-template.md`
- `references/report-template.md`