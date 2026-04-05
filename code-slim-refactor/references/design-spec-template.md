# Design Spec Template

Use this template before any refactor code change.

## 1. Context

- mode: `quick` or `strict`
- Repository:
- Scope:
- Target branch:
- Refactor goal:

## 2. Current Issues

List proven problems only:
- redundancy
- state forks
- over-abstraction
- hidden behavior
- config path sprawl

## 3. Minimal Closed Loop to Keep

Define the smallest still-working behavior set that must remain valid.

## 4. Contract Invariants

State the intended current contract that must stay valid during this refactor:
- backend behavior invariants:
- response semantics invariants:
- assertion standards that must not be weakened:

## 5. Planned Convergence Actions

Use action IDs for traceability.

| Action ID | Type (`remove` / `merge` / `simplify` / `keep`) | Target | First-principles reason | Risk |
|---|---|---|---|---|
| A1 | remove | | | |
| A2 | merge | | | |
| A3 | simplify | | | |

## 6. Files and Modules Affected

Explicitly list delete, merge, and update targets.

## 7. Target Structure (Post-change)

Provide a concise structure description after convergence.

## 8. Risks and Validation Plan

- Main regression risks:
- Per-round review focus:
- Validation command(s):
- Contract-mismatch indicators to watch for:
- Mode gate expectation:
  - quick: scoped validation or smoke
  - strict: complete workflow gate

## 9. Contract-Mismatch Decision Rule

If validation suggests backend/test disagreement:
- reviewer type: `subagent` or `local_fallback`
- classification options:
  - `backend_regression`
  - `stale_tests`
- allowed stale-test action: update affected tests or skip them for this round

## 10. Change Control

State that only items declared in this design are allowed.
Any extra change requires this design to be updated first.