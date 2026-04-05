import { MODULE_NAMES } from "../constants.mjs";
import { validateBundleModule } from "./skill.bundle.validate.mjs";
import { executeSkillsImportModule, validateSkillsImportModule } from "./skill.skills.import.mjs";
import { executeSkillListsCreateModule, validateSkillListsCreateModule } from "./skill.skill-lists.create.mjs";
import { executeAgentsCreateModule, validateAgentsCreateModule } from "./skill.agents.create.mjs";
import { executeProjectCreateModule, validateProjectCreateModule } from "./skill.project.create.mjs";
import {
  executeWorkflowTemplateCreateModule,
  validateWorkflowTemplateCreateModule
} from "./skill.workflow-template.create.mjs";
import { executeWorkflowRunCreateModule, validateWorkflowRunCreateModule } from "./skill.workflow-run.create.mjs";

export const MODULE_REGISTRY = Object.freeze({
  [MODULE_NAMES.BUNDLE_VALIDATE]: {
    validate: validateBundleModule
  },
  [MODULE_NAMES.SKILLS_IMPORT]: {
    validate: validateSkillsImportModule,
    execute: executeSkillsImportModule
  },
  [MODULE_NAMES.SKILL_LISTS_CREATE]: {
    validate: validateSkillListsCreateModule,
    execute: executeSkillListsCreateModule
  },
  [MODULE_NAMES.AGENTS_CREATE]: {
    validate: validateAgentsCreateModule,
    execute: executeAgentsCreateModule
  },
  [MODULE_NAMES.PROJECT_CREATE]: {
    validate: validateProjectCreateModule,
    execute: executeProjectCreateModule
  },
  [MODULE_NAMES.WORKFLOW_TEMPLATE_CREATE]: {
    validate: validateWorkflowTemplateCreateModule,
    execute: executeWorkflowTemplateCreateModule
  },
  [MODULE_NAMES.WORKFLOW_RUN_CREATE]: {
    validate: validateWorkflowRunCreateModule,
    execute: executeWorkflowRunCreateModule
  }
});
