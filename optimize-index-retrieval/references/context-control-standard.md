# Context Control Standard for Complex Index Retrieval

## 1) Input Contract

- `response profile`: `compact|full`
- `payload budget kb`: positive integer, default `20`
- `limit`: clamp to `1..20` if command is limit-aware
- `fields`: field mask with highest precedence

## 2) Output Contract

Always include `meta.contextControl`.

Required keys:
- `responseProfile`
- `payloadBudgetKB`
- `thresholdBytes`
- `payloadBytes`
- `oversize`
- `oversizeStage`
- `stageBreakdown`
- `searchPath`
- `optimizationHints`

Conditional key:
- `limitAdjusted.requested`
- `limitAdjusted.effective`

## 3) Stage Breakdown Rules

- Compute stage payload size in UTF-8 bytes of serialized JSON.
- Select `oversizeStage` as the largest stage contributor.
- Use stable stage names (example):
  - `triage.evaluate`
  - `playbook.resolve`
  - `decision.compose`
  - `response.emit`

## 4) Oversize Policy

- Do not silently drop fields in full profile.
- When `oversize=true`, provide executable hints.
- Hints must include at least two next-call commands.

## 5) Hint Priorities

1. `--response-profile compact`
2. `--fields` to keep minimal decision payload
3. reduce `limit` to `10` or `5`
4. split command into staged retrieval + decision

## 6) Test Gates

- limit clamp coverage: `0/1/20/21/100`
- profile default/override behavior
- payload budget override behavior
- json/text/ndjson oversize readability
- child-runner guided retry with reduced payload
- benchmark report attached for `full` vs `compact`
