---
name: eat-template-builder
description: Scaffold and build EasyAgentTeam template bundles from a reusable workspace, with required plan alignment before generation, Markdown Mermaid workflow confirmation before final workflow output, and built-in check/publish commands through the local template bundle guard runtime. Use when the user wants to create or update an EasyAgentTeam template workspace, define reusable agents and workflow templates, import skills into a template bundle, validate a bundle, or publish it to the EasyAgentTeam backend.
---

# EasyAgentTeam Template Builder

## Start With A Workspace Copy

1. Create a fresh workspace copy with `scripts/init_eat_workspace.py <target-dir>`.
2. Work inside that copied workspace, not inside the skill folder.
3. Keep the generated layout intact:
   - `.agent-tools/`
   - `agents/`
   - `roles/`
   - `skills/`
   - `bundles/`
   - `reports/`
   - `workspace/`

## Plan-First Rule

Do not write the final bundle or run `check`/`publish` until planning is aligned with the user.

Clarify and lock:
- goal and scope
- reusable agent responsibilities
- skills to import
- IDs and naming rules
- project and workflow shape
- deliverables and evidence files

If a workflow is involved, present a Markdown Mermaid flowchart and get explicit user confirmation before generating the final workflow template, workflow run, or bundle.

Read `references/planning-checklist.md` when details are still fuzzy.

## Working Contract

Follow the generated workspace contract in `AGENTS.md` and keep the six-step evidence flow closed:
1. `goal`
2. `roles`
3. `agents`
4. `project/workflow`
5. `bundle`
6. `submit`

Each step must leave evidence under `reports/step-0X-*` before moving forward.

## Bundle Rules

- Keep agent prompts limited to function, usable external tools, and method.
- Do not describe EasyAgentTeam runtime internals inside agent prompts.
- Keep roles reusable rather than one-off.
- Keep workflow task contracts explicit: objective, input, output, constraints, boundary, exception handling, acceptance criteria.
- Keep `artifacts` under `workspace/` and make `write_set` cover them without cross-task overlap.
- Keep `workflow_run.auto_start` false.
- An empty local `skills/` directory is allowed during planning; local skill import stays skipped until real skill packages are added.

Read `references/workspace-contract.md` if you need the detailed constraints.

## Validation And Publish

Use only these entrypoints inside the copied workspace:
- `node .agent-tools/scripts/template_bundle_guard.mjs check`
- `node .agent-tools/scripts/template_bundle_guard.mjs publish`

`publish` must remain check-first and must not auto-start runs.

## References

- `references/planning-checklist.md`
- `references/workspace-contract.md`
