---
name: template-bundle-guard
description: Validate and publish a TemplateBundle inside the current EasyAgentTeam template workspace with retry-friendly reports. Use before submission and whenever check or publish needs to run through the local template bundle guard commands.
---

# Template Bundle Guard

Use this helper skill before submission. It is the only allowed submission entry.

## Commands

- Check: `node .agent-tools/scripts/template_bundle_guard.mjs check`
- Publish: `node .agent-tools/scripts/template_bundle_guard.mjs publish`

## Reports

- `reports/template-guard/last_check.json|md`
- `reports/template-guard/last_publish.json|md`

## Behavior

- `check`: validate only; output structured errors and hints for retry.
- `publish`: always runs `check` first, then apply if `check` passes.
- `publish` never starts the run lifecycle.