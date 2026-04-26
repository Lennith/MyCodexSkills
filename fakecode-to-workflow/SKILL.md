---
name: fakecode-to-workflow
description: Translate fakecode and workflows both ways. Use for pseudocode-to-workflow, workflow-to-pseudocode, ASCII flowcharts, workflow debug, or updating existing workflow docs.
---

# Fakecode To Workflow

Translate between loose human fakecode and agent-readable workflow documents. Treat user input as intent, not syntax; do not validate Kotlin, Chinese punctuation, brackets, or indentation.

## Route

Choose exactly the reference needed for the user's request:

- Fakecode/pseudocode -> workflow: read [fakecode-to-workflow.md](references/fakecode-to-workflow.md).
- Existing workflow -> fakecode/pseudocode: read [workflow-to-fakecode.md](references/workflow-to-fakecode.md).
- Update an existing workflow from user fakecode or edits: read [update-existing-workflow.md](references/update-existing-workflow.md).

When fakecode syntax matters, also read [syntax.md](references/syntax.md).
When behavior is unclear or examples would disambiguate the pattern, read [examples.md](references/examples.md).
Before final workflow output or file updates, read and apply [workflow-lint.md](references/workflow-lint.md).
For update tasks, also read [workflow-to-fakecode.md](references/workflow-to-fakecode.md) if you need to normalize the current workflow before applying changes.

## Invariants

- Debug logic and closure risks before producing a final workflow.
- Lint generated workflows for agent executability before final output or file updates.
- Final workflows must be agent-readable: explicit actions, inputs, decisions, outputs, loops, failure paths, artifacts, stop conditions, and out-of-scope boundaries.
- Use ASCII Markdown flowcharts only; do not use Mermaid or images.
- Ask the user to confirm unresolved boundaries before final generation or file updates, unless they explicitly asked to apply directly and the risks are already clear.
