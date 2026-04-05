import { MODULE_NAMES } from "../constants.mjs";
import { requestJson } from "../utils/http-client.mjs";
import { ensureValidated } from "./module-helpers.mjs";

export async function validateSkillListsCreateModule(context) {
  ensureValidated(context);
  return {
    module: MODULE_NAMES.SKILL_LISTS_CREATE,
    warnings: []
  };
}

export async function executeSkillListsCreateModule(context) {
  ensureValidated(context);
  const lists = context.computed.normalizedBundle.skill_lists;
  const created = [];
  for (const item of lists) {
    await requestJson(
      context.baseUrl,
      "POST",
      "/api/skill-lists",
      {
        list_id: item.list_id,
        display_name: item.display_name || item.list_id,
        description: item.description || undefined,
        include_all: item.include_all,
        skill_ids: item.skill_ids
      },
      [201]
    );
    created.push(item.list_id);
  }
  context.execution.created.skillLists.push(...created);
  return {
    module: MODULE_NAMES.SKILL_LISTS_CREATE,
    created
  };
}
