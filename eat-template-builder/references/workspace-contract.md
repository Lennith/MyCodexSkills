# Workspace Contract

## Responsibilities

- Design reusable agents from the user goal.
- Generate a submit-ready `TemplateBundle`.
- Validate with the local template bundle guard before publish.
- Fix bundle issues from guard output before retrying publish.

## Agent Prompt Constraints

- Keep prompts limited to function, usable external tools, and method.
- Do not describe routing, envelope, task report, toolcall protocol, or other framework runtime details.
- Prefer reusable roles over one-off temporary prompts.

## Workflow Task Contract

Each task must define:
- objective
- input
- output
- constraints
- boundary
- exception handling
- acceptance criteria

Also keep:
- `artifacts` under `workspace/`
- `write_set` covering every artifact path
- no overlapping write sets across tasks

## Workspace Layout

- `workspace/`: task outputs
- `roles/`: role notes
- `agents/`: agent definitions
- `skills/`: imported skill packages for `skills_sources`
- `bundles/`: final bundle JSON files
- `reports/`: step evidence and template guard reports
- `.agent-tools/`: local helper skill, config, runtime, and publish scripts

## Allowed Submission Entrypoints

- `node .agent-tools/scripts/template_bundle_guard.mjs check`
- `node .agent-tools/scripts/template_bundle_guard.mjs publish`