# Slim Refactor Plan

Create or update this file before code modifications.

## 1. Context

- date:
- repo_path:
- scope:
- objective:
- constraints:

## 2. Current Problems (Proven Only)

List only verified issues:
- redundant module or logic:
- state forks:
- over-abstraction:
- hidden behavior:
- unnecessary config paths:

## 3. Minimal Closed Loop to Keep

Define the smallest still-working behavior that must remain valid:
- required capability 1:
- required capability 2:

## 4. Contract Invariants

Record the intended current contract that must remain valid:
- backend behavior invariants:
- response semantics invariants:
- assertion standards that must not be weakened:

## 5. Planned Convergence Actions

Use action IDs for traceability.

| Action ID | Type (`remove` / `merge` / `simplify` / `keep`) | Target module or file | First-principles reason | Risk |
|---|---|---|---|---|
| A1 | remove | | | |
| A2 | merge | | | |
| A3 | simplify | | | |

## 6. Target Structure (After This Round)

Describe concise structure after convergence:
- module boundaries:
- key data and control path:
- removed branches:

## 7. Validation Plan

- automated commands:
- manual smoke checks (if needed):
- pass criteria:
- mismatch indicators that require the contract-mismatch gate:

## 8. Contract-Mismatch Gate Plan

If validation suggests backend/test disagreement:
- reviewer type: `subagent` or `local_fallback`
- classification result:
- allowed stale-test action: update affected tests or skip those tests for this round
- required follow-up if stale tests are left behind:

## 9. Change Guardrail

Allow only actions declared in this plan.
If new action is required, update this plan first and then implement code changes.