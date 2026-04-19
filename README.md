# MyCodexSkills

Personal Codex Skill collection for enhancing AI assistant capabilities.

## Skills

### code-slim-refactor

A skill for code slim refactoring (convergence refactoring). Use this when you need explicit convergence-oriented refactoring for local Git repositories. Supports the following scenarios:
- Code slimming
- Slim refactor / convergence refactoring
- Redundancy removal
- Structured simplification

Provides two working modes:
- **quick**: Lightweight convergence for small, well-bounded refactoring tasks
- **strict**: Formal refactoring workflow with full traceability and merge gates

### eat-template-builder

A template building tool for use with the [EasyAgentTeam](https://github.com/Lennith/EasyAgentTeam) project. Used to scaffold and build EasyAgentTeam template bundles with features including:
- Creating templates from reusable workspace scaffolding
- Defining reusable agents and roles
- Building workflow templates
- Importing skills into template bundles
- Validating and publishing templates to the EasyAgentTeam backend

Follows the plan-first principle: planning must be aligned with the user before generating the final template. Markdown Mermaid flowcharts are required for workflow confirmation.

### optimize-index-retrieval

A skill for optimizing context control in complex index-based retrieval flows without changing business scoring semantics. Use this when a skill has large retrieval payloads, context explosion, unstable agent retries, or oversized search responses. Supports the following scenarios:
- Response profile tuning (`compact` vs `full`)
- Payload budget control and limit clamping
- Oversize detection with actionable hints
- Staged payload breakdown for heavy calls
- Benchmark comparison between full and compact outputs

Provides explicit next-call hints and includes a bundled benchmark script (`scripts/benchmark_context_control.py`) to validate payload reduction and latency impact.
