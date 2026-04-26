# Fakecode Syntax

Use these conventions when interpreting or producing fakecode. They are semantic hints for the agent, not a strict grammar.

## `fun`

`fun name { ... }` defines a normal workflow, subflow, or reusable procedure.

When converting to a final workflow, represent `fun` definitions as ordinary sections or reusable functions. The main agent may execute them directly unless a call-site rule requires delegation.

## `subfun`

`subfun name { ... }` defines a flow that must be executed by a subagent.

`subfun name().with(agent) { ... }` defines a flow that must be executed by a subagent matching `agent`.

The `agent` value may be:

- A short agent name, such as `reviewer`, `qa-agent`, or `security-reviewer`.
- Natural language describing the required agent role or capability.
- A compact agent definition that must be included in the delegated prompt.

`with(agent)` is not an exclusive capability list. It means the subagent prompt must include at least the role/capability described by `agent`; the prompt may include additional context and requirements needed to execute the flow correctly.

When converting to an agent-readable workflow:

- Mark the subflow as `SUBAGENT FUNCTION <name>`.
- State that the main agent delegates this flow to a subagent.
- If `.with(agent)` is present, state the required subagent profile and include it in the delegation prompt.
- Define the subagent's input, expected output, and completion criteria.
- Define how the main agent consumes the subagent result.
- Add failure handling for subagent timeout, unclear result, or failed review.

Example:

```pseudo
SUBAGENT FUNCTION fourDimensionReview:
  OWNER:
    subagent
  REQUIRED_AGENT:
    review-agent
  INPUT:
    current implementation
    review dimensions
  OUTPUT:
    review result
    blocking issues
  COMPLETION:
    all dimensions pass OR issues are reported
```

If the user writes `subfun` but does not define what the subagent should return, classify it as `Must Confirm` unless a safe output contract is obvious.

If the user writes `.with(agent)` and the agent role/capability is too vague to produce a prompt, classify it as `Should Clarify` or `Must Confirm` depending on execution risk.

## Explicit Function Reference

`${funname}` is an explicit reference to a previously defined `fun` or `subfun`.

`${funname}.with(agent)` is an explicit reference that forces this call site to be executed by a subagent matching `agent`, even if `funname` was originally defined as a normal `fun`.

Interpret it as:

- Call or inline the referenced flow at this point.
- Preserve delegation semantics: if `${funname}` points to a `subfun`, it remains subagent-executed.
- Apply call-site delegation override: if `${funname}.with(agent)` is used, execute that invocation through the specified subagent.
- The override affects this invocation only; it does not permanently change the original function definition.
- If no matching definition exists, classify as `Must Confirm`.

If both definition-time `.with(agentA)` and call-site `.with(agentB)` are present:

- Combine both requirements when compatible.
- Ask for confirmation when the two agent requirements conflict.

Explicit call example:

```kotlin
fun releaseTest {
  run qa
}

fun fullFlow {
  ${releaseTest}.with(qa-agent)
}
```

Means: execute the defined `releaseTest` flow here through a `qa-agent` subagent for this call.

Definition-time binding example:

```kotlin
subfun fourDimensionReview().with(review-agent) {
  review current implementation from product, code, test, and risk dimensions
}
```

Means: define `fourDimensionReview` as a mandatory subagent flow, and include `review-agent` capability/role requirements in the subagent prompt.

## Natural-Language Function Mention

When a function name appears as normal text without `${...}`, treat it as natural language first.

The agent may still link it to a defined function by semantic matching, but this is weaker than `${funname}`.

Rules:

- If exactly one defined function clearly matches, treat it as an inferred reference and label the assumption.
- If multiple functions might match, ask for confirmation.
- If no function matches, treat it as normal prose/action text.
- Do not require the user to wrap every function call in `${...}`.

## Reference Resolution Priority

Resolve references in this order:

1. Exact `${funname}.with(agent)` match with call-site delegation override.
2. Exact `${funname}` match.
3. Exact `subfun name().with(agent)` or `subfun name` definition.
4. Exact `fun name` definition.
5. Exact bare text match to a defined function name.
6. Semantic match to one defined function.
7. Natural language action.
8. Must Confirm when ambiguity affects execution.
