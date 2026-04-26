# Workflow To Fakecode

Use this path when the user provides an existing workflow document and wants it converted into pseudocode/fakecode.

## Goal

Produce concise Agent pseudocode that preserves the workflow's executable intent. Do not invent new behavior unless clearly marked as inferred.

Use `subfun` in the output when the workflow explicitly requires a subagent, reviewer agent, worker agent, or delegated agent to execute a subflow. Use `subfun name().with(agent) {}` when the workflow names or describes the required subagent profile. Use `${funname}` when one defined function is called from another and the reference should be unambiguous. Use `${funname}.with(agent)` when only that invocation is delegated to a specific subagent.

## Extraction Checklist

Extract:

- Purpose and non-goals.
- Inputs and preconditions.
- Definitions and boundary terms.
- Main ordered steps.
- Subflows or reusable procedures.
- Decision branches.
- Loops and exit conditions.
- Commands and evidence sources.
- Artifacts and report outputs.
- Failure handling and stop conditions.
- Out-of-scope or forbidden actions.

## Output Shape

```pseudo
WORKFLOW <name>

PURPOSE:
  ...

INPUTS:
  ...

DEFINITIONS:
  ...

MAIN:
  STEP 1:
    ACTION ...
    OUTPUT ...

  IF <condition>:
    ...
  ELSE:
    ...

FUNCTION <subflow>:
  ...

SUBFUN <delegated-subflow>:
  OWNER:
    subagent
  REQUIRED_AGENT:
    ...
  ...

ARTIFACTS:
  ...

OUT_OF_SCOPE:
  ...
```

## Rules

- Preserve release gates, test gates, and stop conditions.
- Preserve commands and artifact paths when present.
- Preserve subagent/delegation requirements as `subfun`.
- Preserve required subagent profiles as `.with(agent)` when the source workflow defines one.
- Use `${funname}.with(agent)` when a normal reusable function is executed by a specific subagent at one call site.
- Use `${funname}` for clear calls to already-defined flows when ambiguity would affect execution.
- Convert prose boundaries into explicit `IF`, `LOOP`, `STOP`, or `OUT_OF_SCOPE` blocks.
- If the original workflow is exploratory and non-gating, keep that distinction explicit.
- If a required execution detail is missing, add `UNKNOWN / NEEDS CONFIRMATION` instead of silently filling it in.
