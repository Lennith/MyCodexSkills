import { MODULE_NAMES } from "../constants.mjs";
import { requestJson } from "../utils/http-client.mjs";
import { ensureValidated } from "./module-helpers.mjs";

export async function validateWorkflowRunCreateModule(context) {
  ensureValidated(context);
  const run = context.computed.normalizedBundle.workflow_run;
  if (!run) {
    throw new Error("workflow_run section is required");
  }
  if (run.auto_start) {
    throw new Error("workflow_run.auto_start must be false");
  }
  return {
    module: MODULE_NAMES.WORKFLOW_RUN_CREATE,
    warnings: []
  };
}

export async function executeWorkflowRunCreateModule(context) {
  ensureValidated(context);
  const run = context.computed.normalizedBundle.workflow_run;
  context.execution.created.workflowRunId = run.run_id;
  await requestJson(
    context.baseUrl,
    "POST",
    "/api/workflow-runs",
    {
      run_id: run.run_id,
      template_id: run.template_id,
      name: run.name,
      description: run.description || undefined,
      workspace_path: run.workspace_path,
      variables: run.variables,
      task_overrides: run.task_overrides,
      auto_dispatch_enabled: run.auto_dispatch_enabled,
      auto_dispatch_remaining: run.auto_dispatch_remaining,
      hold_enabled: run.hold_enabled,
      reminder_mode: run.reminder_mode,
      auto_start: false
    },
    [201]
  );
  return {
    module: MODULE_NAMES.WORKFLOW_RUN_CREATE,
    created: run.run_id
  };
}
