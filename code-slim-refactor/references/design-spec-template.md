# Design Spec Template

Use this template before any refactor code change.

## 1. Context

- mode: `lite` or `strict`
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

## 4. Planned Convergence Actions

Use action IDs for traceability.

| Action ID | Type (`remove` / `merge` / `simplify` / `keep`) | Target | First-principles reason | Risk |
|---|---|---|---|---|
| A1 | remove | | | |
| A2 | merge | | | |
| A3 | simplify | | | |

## 5. Files and Modules Affected

Explicitly list delete, merge, and update targets.

## 6. Target Structure (Post-change)

Provide a concise structure description after convergence.

## 7. Risks and Validation Plan

- Main regression risks:
- Per-round review focus:
- Validation command(s):
- Mode gate expectation:
  - lite: scoped validation/smoke
  - strict: complete workflow gate

## 8. Change Control

State that only items declared in this design are allowed.
Any extra change requires this design to be updated first.
