# Update Existing Workflow

Use this path when the user wants to change an existing workflow using fakecode, pseudocode, or natural-language edits.

## Sequence

1. Read the existing workflow.
2. Convert the relevant current behavior into Agent pseudocode if needed.
3. Interpret the user's requested change as fakecode intent.
4. Debug the requested change against the existing workflow.
5. Show conflicts, missing boundaries, and changed execution behavior.
6. Produce proposed updated Agent pseudocode WORKFLOW.
7. Produce an ASCII Markdown flowchart for the updated flow.
8. Run workflow lint on the proposed updated workflow.
9. Ask for confirmation before editing unless the user explicitly asked to apply directly.
10. Patch the existing workflow while preserving local style and unrelated content.

## Debug Existing-vs-New Conflicts

Check whether the requested change conflicts with:

- Existing workflow purpose.
- Release gate or non-release-gate boundaries.
- Test skip rules.
- Artifact paths.
- Config mutation rules.
- Stop conditions.
- User confirmation requirements.
- Existing commands and modes.
- Ownership boundaries in the repository.
- New `subfun` delegation requirements versus existing single-agent execution.
- New `.with(agent)` requirements versus existing delegation owner or prompt contract.
- `${funname}` references that have no matching current or newly defined function.

## Patch Rules

- Preserve the document's existing format when reasonable.
- Keep unrelated sections unchanged.
- Do not remove safety boundaries unless the user explicitly requested it and the new boundary is clear.
- Add definitions for any new ambiguous terms introduced by the user's fakecode.
- Preserve `subfun` as a mandatory subagent execution boundary in the final workflow.
- Preserve `subfun name().with(agent)` as a mandatory subagent execution boundary with a required subagent profile.
- Preserve explicit `${funname}` calls as unambiguous references in the updated Agent pseudocode before patching.
- Preserve `${funname}.with(agent)` as a call-site subagent override without changing the original function definition unless the user asks for that.
- Update artifacts and final report requirements when the flow changes outputs.
- Update loops and failure handling when the change adds retry/review/fix cycles.

## Lint Before Patch

Apply `workflow-lint.md` before editing the workflow file.

- Do not patch when lint has `FAIL` unless the user explicitly accepts the unresolved gap.
- Preserve lint warnings as assumptions or TODO-style confirmation notes only when the target workflow format allows them.

## Confirmation Triggers

Ask before patching when:

- There are Must Confirm debug findings.
- The change can skip tests, release, publish, delete, overwrite, or mutate config.
- The baseline, scope, or evidence source is undefined.
- The workflow could loop indefinitely.
- The requested update contradicts an existing boundary.
