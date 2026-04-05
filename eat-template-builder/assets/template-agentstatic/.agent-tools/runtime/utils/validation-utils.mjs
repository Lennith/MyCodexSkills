import { ID_RULES } from "../constants.mjs";

export function assertString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeStringArray(value) {
  return Array.from(
    new Set(
      ensureArray(value)
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
    )
  );
}

export function normalizeRouteTable(raw) {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const normalized = {};
  for (const [from, targets] of Object.entries(raw)) {
    const fromKey = assertString(from);
    if (!fromKey) {
      continue;
    }
    normalized[fromKey] = normalizeStringArray(targets);
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function normalizeRouteDiscussRounds(raw) {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const normalized = {};
  for (const [from, inner] of Object.entries(raw)) {
    const fromKey = assertString(from);
    if (!fromKey || !inner || typeof inner !== "object") {
      continue;
    }
    const rounds = {};
    for (const [to, value] of Object.entries(inner)) {
      const toKey = assertString(to);
      const parsed = Number(value);
      if (!toKey || !Number.isFinite(parsed) || parsed < 1) {
        continue;
      }
      rounds[toKey] = Math.floor(parsed);
    }
    if (Object.keys(rounds).length > 0) {
      normalized[fromKey] = rounds;
    }
  }
  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function validateIdByType(idType, value) {
  const id = assertString(value);
  const rule = ID_RULES[idType];
  if (!id || !rule.test(id)) {
    return false;
  }
  return true;
}

export function validateTaskGraph(tasks) {
  const errors = [];
  const normalizedTasks = ensureArray(tasks).map((item) => ({
    taskId: assertString(item?.task_id ?? item?.taskId),
    title: assertString(item?.title),
    ownerRole: assertString(item?.owner_role ?? item?.ownerRole),
    parentTaskId: assertString(item?.parent_task_id ?? item?.parentTaskId),
    dependencies: normalizeStringArray(item?.dependencies),
    writeSet: normalizeStringArray(item?.write_set ?? item?.writeSet),
    acceptance: normalizeStringArray(item?.acceptance),
    artifacts: normalizeStringArray(item?.artifacts)
  }));

  if (normalizedTasks.length === 0) {
    errors.push("workflow_template.tasks requires at least one task");
    return { errors, normalizedTasks };
  }

  const ids = new Set();
  for (const task of normalizedTasks) {
    if (!task.taskId) {
      errors.push("task_id is required for each workflow task");
      continue;
    }
    if (ids.has(task.taskId)) {
      errors.push(`duplicate task_id detected: ${task.taskId}`);
      continue;
    }
    ids.add(task.taskId);
    if (!task.title) {
      errors.push(`task '${task.taskId}' missing title`);
    }
    if (!task.ownerRole) {
      errors.push(`task '${task.taskId}' missing owner_role`);
    }
    if (task.parentTaskId && task.parentTaskId === task.taskId) {
      errors.push(`task '${task.taskId}' cannot self-reference parent_task_id`);
    }
    for (const dep of task.dependencies) {
      if (dep === task.taskId) {
        errors.push(`task '${task.taskId}' cannot self-reference dependencies`);
      }
    }
  }

  const byId = new Map(normalizedTasks.map((item) => [item.taskId, item]));
  for (const task of normalizedTasks) {
    if (task.parentTaskId && !byId.has(task.parentTaskId)) {
      errors.push(`task '${task.taskId}' references unknown parent_task_id '${task.parentTaskId}'`);
    }
    for (const dep of task.dependencies) {
      if (!byId.has(dep)) {
        errors.push(`task '${task.taskId}' references unknown dependency '${dep}'`);
      }
    }
  }

  for (const task of normalizedTasks) {
    const visited = new Set([task.taskId]);
    let cursor = task.parentTaskId;
    while (cursor) {
      if (visited.has(cursor)) {
        errors.push(`parent_task_id cycle detected at task '${task.taskId}'`);
        break;
      }
      visited.add(cursor);
      const parent = byId.get(cursor);
      cursor = parent?.parentTaskId ?? "";
    }
  }

  return { errors, normalizedTasks };
}

export function validateRouteTableAgainstAgents(routeTable, agentClosure, prefix, errors) {
  if (!routeTable) {
    return;
  }
  for (const [from, targets] of Object.entries(routeTable)) {
    if (!agentClosure.has(from)) {
      errors.push(`${prefix} route_table contains unknown from-agent '${from}'`);
    }
    for (const target of targets) {
      if (!agentClosure.has(target)) {
        errors.push(`${prefix} route_table contains unknown to-agent '${target}'`);
      }
    }
  }
}

export function validateDiscussRoundsAgainstAgents(routeDiscussRounds, agentClosure, prefix, errors) {
  if (!routeDiscussRounds) {
    return;
  }
  for (const [from, targets] of Object.entries(routeDiscussRounds)) {
    if (!agentClosure.has(from)) {
      errors.push(`${prefix} route_discuss_rounds contains unknown from-agent '${from}'`);
    }
    for (const to of Object.keys(targets)) {
      if (!agentClosure.has(to)) {
        errors.push(`${prefix} route_discuss_rounds contains unknown to-agent '${to}'`);
      }
    }
  }
}
