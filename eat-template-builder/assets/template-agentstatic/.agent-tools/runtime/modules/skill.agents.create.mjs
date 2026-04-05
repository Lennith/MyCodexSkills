import { MODULE_NAMES } from "../constants.mjs";
import { requestJson } from "../utils/http-client.mjs";
import { ensureValidated } from "./module-helpers.mjs";

export async function validateAgentsCreateModule(context) {
  ensureValidated(context);
  return {
    module: MODULE_NAMES.AGENTS_CREATE,
    warnings: []
  };
}

export async function executeAgentsCreateModule(context) {
  ensureValidated(context);
  const agents = context.computed.normalizedBundle.agents;
  const created = [];
  for (const item of agents) {
    await requestJson(
      context.baseUrl,
      "POST",
      "/api/agents",
      {
        agent_id: item.agent_id,
        display_name: item.display_name || item.agent_id,
        prompt: item.prompt,
        summary: item.summary || undefined,
        skill_list: item.skill_list,
        provider_id: item.provider_id || undefined,
        default_model_params: item.default_model_params || undefined,
        model_selection_enabled:
          item.model_selection_enabled === undefined ? undefined : Boolean(item.model_selection_enabled)
      },
      [201]
    );
    created.push(item.agent_id);
  }
  context.execution.created.agents.push(...created);
  return {
    module: MODULE_NAMES.AGENTS_CREATE,
    created
  };
}
