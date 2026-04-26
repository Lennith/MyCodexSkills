# Examples

Use these examples when the syntax rules feel abstract. They illustrate interpretation style, not a strict output contract.

## Example 1: Basic Fakecode To Workflow

User fakecode:

```kotlin
fun releaseTest {
  if (source code outside qa has no diff from baseline commit) {
    skip completed test items
    update qa code
  } else {
    run full qa
  }
}

fun fullFlow {
  if (requirement done) {
    while (!review pass from 4 dimensions) {
      fix by review result
    }
    ${releaseTest}
  }
}
```

Debug highlights:

- Must Confirm: baseline commit is undefined.
- Must Confirm: `qa` scope is undefined.
- Must Confirm: the 4 review dimensions are undefined.
- Suggested Guardrail: add max review iterations or human escalation.

Agent pseudocode:

```pseudo
WORKFLOW fullFlow

FUNCTION releaseTest:
  IF non_qa_source_diff(current_code, baseline_commit) == false:
    ACTION skip completed test items
    ACTION update qa code
  ELSE:
    ACTION run full QA

MAIN:
  IF requirement_done:
    LOOP UNTIL review_passes_all_4_dimensions:
      ACTION run review
      ACTION fix issues from review result
    CALL releaseTest
  ELSE:
    STOP and report requirement not done
```

ASCII flowchart:

```text
Start
  |
  v
+------------------------------+
| 1. Check requirement status   |
|    - Decide if work is done   |
+--------------+---------------+
               |
               v
          +----------+
          | Done?    |
          +----+-----+
        No     |     Yes
        |      |      |
        v      |      v
+--------------+   +------------------------------+
| Stop/report  |   | 2. Run 4-dimension review    |
+--------------+   |    - Fix review issues       |
                   +--------------+---------------+
                                  |
                                  v
                             +----------+
                             | Pass?    |
                             +----+-----+
                           No     |     Yes
                           |      |      |
                           +------+      v
                                +------------------------------+
                                | 3. Execute releaseTest       |
                                +--------------+---------------+
                                               |
                                               v
                                             End
```

## Example 2: `subfun` Requires Subagent

User fakecode:

```kotlin
subfun review {
  check product, code, tests, risk
}

fun fullFlow {
  ${review}
  fix issues
}
```

Interpretation:

- `review` must be delegated to a subagent.
- The workflow must define subagent input, output, and completion criteria.

Agent pseudocode:

```pseudo
SUBAGENT FUNCTION review:
  OWNER:
    subagent
  INPUT:
    current implementation
    review dimensions: product, code, tests, risk
  OUTPUT:
    pass/fail result
    blocking issues
  COMPLETION:
    all dimensions reviewed

MAIN:
  DELEGATE review TO subagent
  IF review failed:
    ACTION fix issues
```

## Example 3: Definition-Time `.with(agent)`

User fakecode:

```kotlin
subfun review().with(strict code reviewer) {
  review maintainability, tests, edge cases
}
```

Interpretation:

- The subagent prompt must explicitly include `strict code reviewer`.
- The final workflow may add more context, but must not omit that role/capability.

Agent pseudocode:

```pseudo
SUBAGENT FUNCTION review:
  OWNER:
    subagent
  REQUIRED_AGENT:
    strict code reviewer
  PROMPT_MUST_INCLUDE:
    review maintainability, tests, edge cases
  OUTPUT:
    pass/fail result
    actionable findings
```

## Example 4: Call-Site `.with(agent)` Override

User fakecode:

```kotlin
fun qa {
  run regression tests
  summarize failures
}

fun release {
  ${qa}.with(qa-agent)
}
```

Interpretation:

- `qa` is a normal reusable function.
- This invocation of `qa` must be delegated to `qa-agent`.
- The original `qa` definition remains normal for other call sites.

Agent pseudocode:

```pseudo
FUNCTION qa:
  ACTION run regression tests
  ACTION summarize failures

MAIN:
  DELEGATE qa TO subagent:
    REQUIRED_AGENT: qa-agent
    INPUT: current build and test config
    OUTPUT: regression result and failure summary
```

## Example 5: Bare Name Is Natural Language First

User fakecode:

```kotlin
fun releaseTest {
  run release QA
}

fun fullFlow {
  release test after review
}
```

Interpretation:

- `release test after review` is natural language first.
- If there is exactly one clear match to `releaseTest`, infer a call and label the assumption.
- If there are multiple possible matches, ask the user.

Agent pseudocode:

```pseudo
ASSUMPTION:
  "release test" refers to defined function releaseTest

MAIN:
  AFTER review:
    CALL releaseTest
```

## Example 6: Updating An Existing Workflow

Existing workflow:

```pseudo
WORKFLOW release
MAIN:
  run full QA
  generate report
```

User change:

```kotlin
fun smartQA {
  if (only qa files changed) {
    skip completed tests
  } else {
    run full QA
  }
}

replace full QA with ${smartQA}.with(qa-agent)
```

Debug highlights:

- Must Confirm: how to identify `qa files`.
- Must Confirm: where completed tests are recorded.
- Should Clarify: whether skipping completed tests is allowed in release workflow.

Proposed update:

```pseudo
FUNCTION smartQA:
  IF changed_files are only in confirmed QA scope:
    ACTION skip completed tests using confirmed test ledger
  ELSE:
    ACTION run full QA

MAIN:
  DELEGATE smartQA TO subagent:
    REQUIRED_AGENT: qa-agent
  ACTION generate report
```
