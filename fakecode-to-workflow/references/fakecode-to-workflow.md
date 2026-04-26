# Fakecode To Workflow

Use this path when the user provides loose fakecode/pseudocode and wants an agent-readable workflow.

## Sequence

1. Debug the user's fakecode.
2. Generate Agent pseudocode WORKFLOW.
3. Generate an ASCII Markdown flowchart.
4. Run workflow lint on the proposed workflow.
5. Ask for confirmation before writing the final workflow if lint has failures, unresolved boundaries exist, or the user wants a file created/updated.
6. Generate the final agent-readable workflow after confirmation.

## Input Interpretation

Treat input as intent, not syntax.

- `fun name {}` means a workflow, subflow, or reusable procedure.
- `subfun name {}` means the flow must be delegated to a subagent.
- `subfun name().with(agent) {}` means the flow must be delegated to a subagent matching the named or described agent profile.
- `${funname}` means an explicit call/reference to a previously defined `fun` or `subfun`.
- `${funname}.with(agent)` means this call site must execute the referenced function through the specified subagent, even if the function was defined as a normal `fun`.
- A bare function name without `${...}` is natural language first; link it to a definition only when the semantic match is clear.
- `if/else` means a decision branch.
- `while/until` means a loop and requires an exit condition.
- Chinese business terms and abstract descriptions are valid input.
- Do not require valid brackets, punctuation, indentation, or Kotlin syntax.

For detailed reference resolution rules, read `syntax.md`.

## Debug Pass

Debug workflow closure, not grammar. Look for:

- Undefined decision sources.
- Ambiguous domain boundaries.
- Missing inputs, baselines, or version references.
- Missing output artifacts.
- Loops without max attempts, exit conditions, or escalation.
- Branches that do not rejoin or terminate.
- Failure states without handling.
- Code/file/config changes without permission scope.
- `subfun` definitions without clear subagent input/output/completion contract.
- `.with(agent)` declarations too vague to produce a concrete subagent prompt.
- Conflicting definition-time and call-site `.with(agent)` requirements.
- `${funname}` references with no matching definition.
- Test skipping, release, publish, delete, overwrite, or config mutation without safeguards.
- Terms an agent cannot judge from available evidence.

Classify findings:

- Must Confirm: blocks final workflow generation.
- Should Clarify: can proceed with a stated assumption.
- Suggested Guardrail: improves closure or safety.

Ask only the questions needed to make the workflow executable by an agent.

## Lint Pass

Before final workflow output, apply `workflow-lint.md`.

- If lint has `FAIL`, ask the user for missing information before finalizing unless the user explicitly asks for a draft with known gaps.
- If lint has `WARN`, include assumptions in the workflow.
- Keep the lint report short.

## Agent Pseudocode Shape

```pseudo
WORKFLOW <name>

INPUTS:
  ...

DEFINITIONS:
  ...

FUNCTION <subflow>:
  INPUT:
    ...
  IF <condition with evidence source>:
    ...
  ELSE:
    ...

MAIN:
  STEP 1:
    ACTION ...
    OUTPUT ...
  LOOP UNTIL <exit condition>:
    ACTION ...
    IF <failure condition>:
      HANDLE ...

SUBAGENT FUNCTION <subflow>:
  OWNER:
    subagent
  REQUIRED_AGENT:
    <agent role/capability from .with(...) when present>
  INPUT:
    ...
  OUTPUT:
    ...
  COMPLETION:
    ...
```

Use the user's language for names and domain terms. Make implicit edges explicit. Label assumptions.

## ASCII Flowchart

Use fenced `text`. Do not use Mermaid or images.

```text
Start
  |
  v
+------------------------------+
| 1. Step name                  |
|    - Key action               |
|    - Evidence / decision data |
+--------------+---------------+
               |
               v
          +----------+
          | Decision?|
          +----+-----+
        No     |     Yes
        |      |      |
        v      v      v
+--------------+   +--------------+
| No branch    |   | Yes branch   |
+------+-------+   +------+-------+
       |                  |
       +--------+---------+
                |
                v
              End
```

Rules:

- Match the user's preferred box style if provided.
- Show loops by pointing failed checks back to the relevant prior step.
- Label branches clearly, such as `yes/no`, `pass/fail`, or `success/failure`.
- Include important sub-actions inside boxes.
- Keep boxes readable; do not pack long paragraphs into one box.

## Final Workflow Shape

After confirmation, generate this structure unless the target repo already has a stronger local format:

```markdown
# Workflow: <Name>

## Purpose
## Inputs
## Preconditions
## Definitions
## Steps
## Loops And Exit Conditions
## Artifacts
## Failure Handling
## Stop Conditions
## Out Of Scope
## Final Report
```

For each step, make clear:

- Action: what the agent does.
- Input: what evidence or state the action uses.
- Decision: how the branch is judged.
- Output: what artifact or state changes.
- Failure handling: retry, fix, escalate, ask user, or stop.
