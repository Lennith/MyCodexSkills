# Workflow Lint

Use this checklist before presenting a final workflow, and before patching an existing workflow file. This is not syntax lint. It checks whether another agent can execute the workflow reliably.

## Lint Result Format

Return a short lint section:

```text
Workflow Lint
- PASS: <check name> - <reason>
- WARN: <check name> - <risk and assumption>
- FAIL: <check name> - <blocking issue and question>
```

If any `FAIL` exists, ask the user for confirmation or missing information before final generation or file update unless the user explicitly ordered a direct draft with known gaps.

## Required Checks

### 1. Inputs

Every workflow must define the evidence or state needed to start.

Fail when:

- A decision depends on an undefined baseline, commit, branch, environment, user role, artifact, or file scope.
- The workflow requires external state but does not say where to get it.

### 2. Decisions

Every `if`, gate, or branch must have a judgeable condition.

Fail when:

- A condition uses vague terms such as "good enough", "done", "normal", or "no issue" without a source or standard.
- A human decision is required but the workflow does not ask the user.

### 3. Loops

Every loop must have an exit condition and an escalation path.

Fail when:

- A `while` or review/fix loop can run forever.
- There is no max attempt count, manual escalation, or stop condition for repeated failures.

### 4. Delegation

Every `subfun` or `.with(agent)` call must define the delegated contract.

Fail when:

- The required subagent profile is too vague to write a prompt.
- The subagent input, output, or completion criteria are missing.
- Definition-time and call-site `.with(agent)` requirements conflict.

### 5. References

Every explicit `${funname}` reference must resolve.

Fail when:

- The referenced function is not defined.
- Multiple functions can satisfy the reference.
- A call-site `.with(agent)` changes execution ownership but the workflow does not describe how results return to the main agent.

### 6. Failure Handling

Every major action must have an error path.

Fail when:

- Tests fail but no fix, retry, report, or stop path exists.
- Environment setup fails without retry or escalation.
- Subagent review returns unclear results without handling.

### 7. Artifacts

Every durable output must have a path, name, or format.

Warn when:

- The workflow says "generate report" but does not specify report content or destination.

Fail when:

- Later steps depend on a report, ledger, test result, or review output that is never produced.

### 8. Scope And Safety

The workflow must define boundaries for risky actions.

Fail when:

- It can skip tests, publish, release, delete, overwrite, mutate config, or change credentials without an explicit condition and safeguard.
- It changes code without a defined allowed scope.

### 9. Closure

All branches must end in a clear terminal state or rejoin the main flow.

Fail when:

- A branch ends without a next step, report, stop, retry, or escalation.
- The final report does not summarize outcome, skipped work, failures, and unresolved decisions.

## Severity Guidance

- Use `FAIL` for anything that prevents reliable agent execution.
- Use `WARN` for assumptions that are reasonable but should be visible.
- Use `PASS` for critical checks that are satisfied.

Keep lint concise. Do not turn it into a second workflow document.
