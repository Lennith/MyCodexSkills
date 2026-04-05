import { MODULE_NAMES } from "../constants.mjs";
import { requestJson } from "../utils/http-client.mjs";
import { ensureValidated } from "./module-helpers.mjs";

export async function validateProjectCreateModule(context) {
  ensureValidated(context);
  if (!context.computed.normalizedBundle.project) {
    throw new Error("project section is required");
  }
  return {
    module: MODULE_NAMES.PROJECT_CREATE,
    warnings: []
  };
}

export async function executeProjectCreateModule(context) {
  ensureValidated(context);
  const project = context.computed.normalizedBundle.project;
  context.execution.created.projectId = project.project_id;
  await requestJson(
    context.baseUrl,
    "POST",
    "/api/projects",
    {
      project_id: project.project_id,
      name: project.name,
      workspace_path: project.workspace_path,
      template_id: project.template_id || undefined,
      agent_ids: project.agent_ids,
      route_table: project.route_table,
      task_assign_route_table: project.task_assign_route_table,
      route_discuss_rounds: project.route_discuss_rounds,
      auto_dispatch_enabled: project.auto_dispatch_enabled,
      auto_dispatch_remaining: project.auto_dispatch_remaining,
      hold_enabled: project.hold_enabled,
      reminder_mode: project.reminder_mode
    },
    [201]
  );
  return {
    module: MODULE_NAMES.PROJECT_CREATE,
    created: project.project_id
  };
}
