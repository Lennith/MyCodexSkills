export const MODULE_NAMES = Object.freeze({
  BUNDLE_VALIDATE: "skill.bundle.validate",
  SKILLS_IMPORT: "skill.skills.import",
  SKILL_LISTS_CREATE: "skill.skill-lists.create",
  AGENTS_CREATE: "skill.agents.create",
  PROJECT_CREATE: "skill.project.create",
  WORKFLOW_TEMPLATE_CREATE: "skill.workflow-template.create",
  WORKFLOW_RUN_CREATE: "skill.workflow-run.create",
  BUNDLE_APPLY: "skill.bundle.apply"
});

export const APPLY_MODULE_ORDER = Object.freeze([
  MODULE_NAMES.SKILLS_IMPORT,
  MODULE_NAMES.SKILL_LISTS_CREATE,
  MODULE_NAMES.AGENTS_CREATE,
  MODULE_NAMES.PROJECT_CREATE,
  MODULE_NAMES.WORKFLOW_TEMPLATE_CREATE,
  MODULE_NAMES.WORKFLOW_RUN_CREATE
]);

export const MODULE_CHECKABLE = new Set([
  MODULE_NAMES.BUNDLE_VALIDATE,
  MODULE_NAMES.SKILLS_IMPORT,
  MODULE_NAMES.SKILL_LISTS_CREATE,
  MODULE_NAMES.AGENTS_CREATE,
  MODULE_NAMES.PROJECT_CREATE,
  MODULE_NAMES.WORKFLOW_TEMPLATE_CREATE,
  MODULE_NAMES.WORKFLOW_RUN_CREATE
]);

export const ID_RULES = Object.freeze({
  agentId: /^[a-zA-Z0-9._:-]+$/,
  skillListId: /^[a-zA-Z0-9._:-]+$/,
  projectId: /^[a-zA-Z0-9_-]+$/,
  workflowTemplateId: /^[a-zA-Z0-9_-]+$/,
  workflowRunId: /^[a-zA-Z0-9_-]+$/
});

export const DEFAULT_REPORT_ROOT = "agent-workspace/reports";

