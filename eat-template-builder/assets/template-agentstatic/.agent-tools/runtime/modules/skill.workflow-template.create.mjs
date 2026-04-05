import { MODULE_NAMES } from "../constants.mjs";
import { requestJson } from "../utils/http-client.mjs";
import { ensureValidated } from "./module-helpers.mjs";

function toApiTask(task) {
  return {
    task_id: task.taskId,
    title: task.title,
    owner_role: task.ownerRole,
    parent_task_id: task.parentTaskId || undefined,
    dependencies: task.dependencies,
    write_set: task.writeSet,
    acceptance: task.acceptance,
    artifacts: task.artifacts
  };
}

export async function validateWorkflowTemplateCreateModule(context) {
  ensureValidated(context);
  if (!context.computed.normalizedBundle.workflow_template) {
    throw new Error("workflow_template section is required");
  }
  return {
    module: MODULE_NAMES.WORKFLOW_TEMPLATE_CREATE,
    warnings: []
  };
}

export async function executeWorkflowTemplateCreateModule(context) {
  ensureValidated(context);
  const template = context.computed.normalizedBundle.workflow_template;
  context.execution.created.workflowTemplateId = template.template_id;
  await requestJson(
    context.baseUrl,
    "POST",
    "/api/workflow-templates",
    {
      template_id: template.template_id,
      name: template.name,
      description: template.description || undefined,
      tasks: template.tasks.map(toApiTask),
      route_table: template.route_table,
      task_assign_route_table: template.task_assign_route_table,
      route_discuss_rounds: template.route_discuss_rounds,
      default_variables: template.default_variables
    },
    [201]
  );
  return {
    module: MODULE_NAMES.WORKFLOW_TEMPLATE_CREATE,
    created: template.template_id
  };
}
