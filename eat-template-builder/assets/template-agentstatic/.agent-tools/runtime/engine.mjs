import { APPLY_MODULE_ORDER, MODULE_CHECKABLE, MODULE_NAMES } from "./constants.mjs";
import { AgentWorkspaceError, isAgentWorkspaceError } from "./errors.mjs";
import { MODULE_REGISTRY } from "./modules/module-registry.mjs";
import { requestJson } from "./utils/http-client.mjs";

function moduleItem(name) {
  const item = MODULE_REGISTRY[name];
  if (!item) {
    throw new AgentWorkspaceError(`unknown module: ${name}`, "MODULE_UNKNOWN", { module: name });
  }
  return item;
}

async function runModuleValidation(context, name) {
  const descriptor = moduleItem(name);
  if (!descriptor.validate) {
    return { module: name, warnings: [] };
  }
  return descriptor.validate(context);
}

async function runModuleExecution(context, name) {
  const descriptor = moduleItem(name);
  if (!descriptor.execute) {
    return { module: name };
  }
  if (process.env.AGENT_WORKSPACE_FAIL_MODULE === name) {
    throw new AgentWorkspaceError(`failure injected at module: ${name}`, "MODULE_FAILURE_INJECTED", {
      module: name
    });
  }
  return descriptor.execute(context);
}

async function safeRollbackCall(context, action, id, routePath) {
  try {
    await requestJson(context.baseUrl, "DELETE", routePath, undefined, [200, 404]);
    context.execution.rollback.push({ action, id, status: "ok" });
  } catch (error) {
    context.execution.rollback.push({
      action,
      id,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function rollbackCreatedResources(context) {
  const created = context.execution.created;
  if (created.workflowRunId) {
    await safeRollbackCall(
      context,
      "delete_workflow_run",
      created.workflowRunId,
      `/api/workflow-runs/${encodeURIComponent(created.workflowRunId)}`
    );
  }
  if (created.workflowTemplateId) {
    await safeRollbackCall(
      context,
      "delete_workflow_template",
      created.workflowTemplateId,
      `/api/workflow-templates/${encodeURIComponent(created.workflowTemplateId)}`
    );
  }
  if (created.projectId) {
    await safeRollbackCall(
      context,
      "delete_project",
      created.projectId,
      `/api/projects/${encodeURIComponent(created.projectId)}`
    );
  }
  for (const agentId of [...created.agents].reverse()) {
    await safeRollbackCall(context, "delete_agent", agentId, `/api/agents/${encodeURIComponent(agentId)}`);
  }
  for (const listId of [...created.skillLists].reverse()) {
    await safeRollbackCall(context, "delete_skill_list", listId, `/api/skill-lists/${encodeURIComponent(listId)}`);
  }
  for (const skillId of [...created.skills].reverse()) {
    await safeRollbackCall(context, "delete_skill", skillId, `/api/skills/${encodeURIComponent(skillId)}`);
  }
}

function buildExecutionResult(mode, context, status, extras = {}) {
  return {
    time: new Date().toISOString(),
    mode,
    status,
    bundle_id: context.bundleId,
    base_url: context.baseUrl,
    dry_run: Boolean(context.dryRun),
    validation_errors: extras.validationErrors ?? [],
    validation_warnings: extras.validationWarnings ?? [],
    steps: context.execution.steps,
    created_resources: {
      skills: context.execution.created.skills,
      skill_lists: context.execution.created.skillLists,
      agents: context.execution.created.agents,
      project_id: context.execution.created.projectId,
      workflow_template_id: context.execution.created.workflowTemplateId,
      workflow_run_id: context.execution.created.workflowRunId
    },
    rollback: context.execution.rollback,
    error: extras.error
  };
}

export async function runValidate(context) {
  const validation = await runModuleValidation(context, MODULE_NAMES.BUNDLE_VALIDATE);
  return buildExecutionResult("validate", context, "pass", {
    validationErrors: validation.errors ?? [],
    validationWarnings: validation.warnings ?? []
  });
}

export async function runModuleCheck(context, moduleName) {
  if (!MODULE_CHECKABLE.has(moduleName)) {
    throw new AgentWorkspaceError(`module-check unsupported module: ${moduleName}`, "MODULE_CHECK_UNSUPPORTED", {
      module: moduleName
    });
  }
  await runModuleValidation(context, MODULE_NAMES.BUNDLE_VALIDATE);
  const validation = await runModuleValidation(context, moduleName);
  context.execution.steps.push({
    module: moduleName,
    status: "validated",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  });
  return buildExecutionResult("module-check", context, "pass", {
    validationErrors: validation.errors ?? [],
    validationWarnings: validation.warnings ?? []
  });
}

export async function runApply(context) {
  try {
    const validation = await runModuleValidation(context, MODULE_NAMES.BUNDLE_VALIDATE);
    context.execution.steps.push({
      module: MODULE_NAMES.BUNDLE_VALIDATE,
      status: "validated",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      warnings: validation.warnings ?? []
    });
  } catch (error) {
    const validationError = isAgentWorkspaceError(error)
      ? error
      : new AgentWorkspaceError(
          error instanceof Error ? error.message : String(error),
          "BUNDLE_VALIDATION_FAILED_UNEXPECTED"
        );
    return buildExecutionResult("apply", context, "fail", {
      error: {
        message: validationError.message,
        code: validationError.code,
        details: validationError.details
      },
      validationErrors: validationError.details?.errors ?? [validationError.message],
      validationWarnings: validationError.details?.warnings ?? []
    });
  }

  if (context.dryRun) {
    return buildExecutionResult("apply", context, "pass", {
      validationErrors: [],
      validationWarnings: []
    });
  }

  for (const moduleName of APPLY_MODULE_ORDER) {
    const step = {
      module: moduleName,
      status: "pending",
      startedAt: new Date().toISOString(),
      completedAt: null,
      details: undefined
    };
    context.execution.steps.push(step);
    try {
      await runModuleValidation(context, moduleName);
      const output = await runModuleExecution(context, moduleName);
      step.status = "applied";
      step.details = output;
      step.completedAt = new Date().toISOString();
    } catch (error) {
      step.status = "failed";
      step.completedAt = new Date().toISOString();
      step.details = { error: error instanceof Error ? error.message : String(error) };
      await rollbackCreatedResources(context);
      const wrapped = isAgentWorkspaceError(error)
        ? error
        : new AgentWorkspaceError(error instanceof Error ? error.message : String(error), "APPLY_FAILED");
      return buildExecutionResult("apply", context, "fail", {
        error: {
          message: wrapped.message,
          code: wrapped.code,
          details: wrapped.details
        }
      });
    }
  }

  return buildExecutionResult("apply", context, "pass");
}

