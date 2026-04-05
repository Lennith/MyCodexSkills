import { MODULE_NAMES } from "../constants.mjs";
import { AgentWorkspaceError } from "../errors.mjs";
import { resolveSkillSources } from "../utils/skill-source-utils.mjs";
import {
  assertString,
  normalizeRouteDiscussRounds,
  normalizeRouteTable,
  normalizeStringArray,
  validateDiscussRoundsAgainstAgents,
  validateIdByType,
  validateRouteTableAgainstAgents,
  validateTaskGraph
} from "../utils/validation-utils.mjs";

function normalizeSkillLists(raw) {
  return (Array.isArray(raw) ? raw : []).map((item) => ({
    list_id: assertString(item?.list_id ?? item?.listId),
    display_name: assertString(item?.display_name ?? item?.displayName),
    description: assertString(item?.description),
    include_all: Boolean(item?.include_all ?? item?.includeAll),
    skill_ids: normalizeStringArray(item?.skill_ids ?? item?.skillIds)
  }));
}

function normalizeAgents(raw) {
  return (Array.isArray(raw) ? raw : []).map((item) => ({
    agent_id: assertString(item?.agent_id ?? item?.agentId),
    display_name: assertString(item?.display_name ?? item?.displayName),
    prompt: assertString(item?.prompt),
    summary: assertString(item?.summary),
    skill_list: normalizeStringArray(item?.skill_list ?? item?.skillList),
    provider_id: assertString(item?.provider_id ?? item?.providerId),
    default_model_params:
      item?.default_model_params && typeof item.default_model_params === "object"
        ? item.default_model_params
        : item?.defaultModelParams && typeof item.defaultModelParams === "object"
          ? item.defaultModelParams
          : undefined,
    model_selection_enabled:
      item?.model_selection_enabled !== undefined
        ? Boolean(item.model_selection_enabled)
        : item?.modelSelectionEnabled !== undefined
          ? Boolean(item.modelSelectionEnabled)
          : undefined
  }));
}

function normalizeProject(rawProject, fallbackAgentIds) {
  if (!rawProject || typeof rawProject !== "object") {
    return null;
  }
  const agentIds = normalizeStringArray(rawProject.agent_ids ?? rawProject.agentIds);
  return {
    project_id: assertString(rawProject.project_id ?? rawProject.projectId),
    name: assertString(rawProject.name),
    workspace_path: assertString(rawProject.workspace_path ?? rawProject.workspacePath),
    template_id: assertString(rawProject.template_id ?? rawProject.templateId),
    agent_ids: agentIds.length > 0 ? agentIds : fallbackAgentIds,
    route_table: normalizeRouteTable(rawProject.route_table ?? rawProject.routeTable),
    task_assign_route_table: normalizeRouteTable(rawProject.task_assign_route_table ?? rawProject.taskAssignRouteTable),
    route_discuss_rounds: normalizeRouteDiscussRounds(rawProject.route_discuss_rounds ?? rawProject.routeDiscussRounds),
    auto_dispatch_enabled:
      rawProject.auto_dispatch_enabled !== undefined
        ? Boolean(rawProject.auto_dispatch_enabled)
        : rawProject.autoDispatchEnabled !== undefined
          ? Boolean(rawProject.autoDispatchEnabled)
          : true,
    auto_dispatch_remaining:
      rawProject.auto_dispatch_remaining !== undefined
        ? Number(rawProject.auto_dispatch_remaining)
        : rawProject.autoDispatchRemaining !== undefined
          ? Number(rawProject.autoDispatchRemaining)
          : 5,
    hold_enabled:
      rawProject.hold_enabled !== undefined
        ? Boolean(rawProject.hold_enabled)
        : rawProject.holdEnabled !== undefined
          ? Boolean(rawProject.holdEnabled)
          : false,
    reminder_mode: assertString(rawProject.reminder_mode ?? rawProject.reminderMode) || "backoff"
  };
}

function normalizeWorkflowTemplate(rawTemplate) {
  if (!rawTemplate || typeof rawTemplate !== "object") {
    return null;
  }
  const graphValidation = validateTaskGraph(rawTemplate.tasks);
  return {
    template_id: assertString(rawTemplate.template_id ?? rawTemplate.templateId),
    name: assertString(rawTemplate.name),
    description: assertString(rawTemplate.description),
    tasks: graphValidation.normalizedTasks,
    taskErrors: graphValidation.errors,
    route_table: normalizeRouteTable(rawTemplate.route_table ?? rawTemplate.routeTable),
    task_assign_route_table: normalizeRouteTable(
      rawTemplate.task_assign_route_table ?? rawTemplate.taskAssignRouteTable
    ),
    route_discuss_rounds: normalizeRouteDiscussRounds(
      rawTemplate.route_discuss_rounds ?? rawTemplate.routeDiscussRounds
    ),
    default_variables:
      rawTemplate.default_variables && typeof rawTemplate.default_variables === "object"
        ? rawTemplate.default_variables
        : rawTemplate.defaultVariables && typeof rawTemplate.defaultVariables === "object"
          ? rawTemplate.defaultVariables
          : {}
  };
}

function normalizeWorkflowRun(rawRun, workflowTemplate, fallbackWorkspacePath) {
  if (!rawRun || typeof rawRun !== "object") {
    return null;
  }
  const templateId = assertString(rawRun.template_id ?? rawRun.templateId) || workflowTemplate?.template_id || "";
  return {
    run_id: assertString(rawRun.run_id ?? rawRun.runId),
    template_id: templateId,
    name: assertString(rawRun.name) || `${workflowTemplate?.name || templateId} run`,
    description: assertString(rawRun.description),
    workspace_path: assertString(rawRun.workspace_path ?? rawRun.workspacePath) || fallbackWorkspacePath || "",
    variables: rawRun.variables && typeof rawRun.variables === "object" ? rawRun.variables : {},
    task_overrides:
      rawRun.task_overrides && typeof rawRun.task_overrides === "object"
        ? rawRun.task_overrides
        : rawRun.taskOverrides && typeof rawRun.taskOverrides === "object"
          ? rawRun.taskOverrides
          : {},
    auto_dispatch_enabled:
      rawRun.auto_dispatch_enabled !== undefined
        ? Boolean(rawRun.auto_dispatch_enabled)
        : rawRun.autoDispatchEnabled !== undefined
          ? Boolean(rawRun.autoDispatchEnabled)
          : false,
    auto_dispatch_remaining:
      rawRun.auto_dispatch_remaining !== undefined
        ? Number(rawRun.auto_dispatch_remaining)
        : rawRun.autoDispatchRemaining !== undefined
          ? Number(rawRun.autoDispatchRemaining)
          : 0,
    hold_enabled:
      rawRun.hold_enabled !== undefined
        ? Boolean(rawRun.hold_enabled)
        : rawRun.holdEnabled !== undefined
          ? Boolean(rawRun.holdEnabled)
          : false,
    reminder_mode: assertString(rawRun.reminder_mode ?? rawRun.reminderMode) || "backoff",
    auto_start: Boolean(rawRun.auto_start ?? rawRun.autoStart)
  };
}

function addConflictError(errors, label, id) {
  errors.push(`${label} already exists in backend: ${id}`);
}

function validateConflicts(errors, existingSet, plannedValues, label) {
  for (const value of plannedValues) {
    if (existingSet.has(value)) {
      addConflictError(errors, label, value);
    }
  }
}

function validateBasics(normalized, errors) {
  if (!normalized.skills_sources || normalized.skills_sources.length === 0) {
    errors.push("skills_sources must contain at least one source path");
  }
  if (!normalized.project) {
    errors.push("project section is required");
  }
  if (!normalized.workflow_template) {
    errors.push("workflow_template section is required");
  }
  if (!normalized.workflow_run) {
    errors.push("workflow_run section is required");
  }
  if (normalized.agents.length === 0) {
    errors.push("agents must contain at least one agent");
  }
}

function validateIdRules(normalized, errors) {
  for (const agent of normalized.agents) {
    if (!validateIdByType("agentId", agent.agent_id)) {
      errors.push(`invalid agent_id: ${agent.agent_id || "(empty)"}`);
    }
    if (!agent.prompt) {
      errors.push(`agent '${agent.agent_id || "(empty)"}' missing prompt`);
    }
  }
  for (const list of normalized.skill_lists) {
    if (!validateIdByType("skillListId", list.list_id)) {
      errors.push(`invalid skill list id: ${list.list_id || "(empty)"}`);
    }
  }
  if (normalized.project && !validateIdByType("projectId", normalized.project.project_id)) {
    errors.push(`invalid project_id: ${normalized.project.project_id || "(empty)"}`);
  }
  if (
    normalized.workflow_template &&
    !validateIdByType("workflowTemplateId", normalized.workflow_template.template_id)
  ) {
    errors.push(`invalid workflow template_id: ${normalized.workflow_template.template_id || "(empty)"}`);
  }
  if (normalized.workflow_run && !validateIdByType("workflowRunId", normalized.workflow_run.run_id)) {
    errors.push(`invalid workflow run_id: ${normalized.workflow_run.run_id || "(empty)"}`);
  }
}

function validateReferences(normalized, existing, predictedSkillIds, errors) {
  const bundleAgentIds = new Set(normalized.agents.map((item) => item.agent_id));
  const agentClosure = new Set([...existing.agents, ...bundleAgentIds]);

  const bundleSkillListIds = new Set(normalized.skill_lists.map((item) => item.list_id));
  const skillListClosure = new Set([...existing.skillLists, ...bundleSkillListIds]);

  const skillClosure = new Set([...existing.skills, ...predictedSkillIds]);
  for (const list of normalized.skill_lists) {
    for (const skillId of list.skill_ids) {
      if (!skillClosure.has(skillId)) {
        errors.push(`skill_list '${list.list_id}' references unknown skill_id '${skillId}'`);
      }
    }
  }

  for (const agent of normalized.agents) {
    for (const listId of agent.skill_list) {
      if (!skillListClosure.has(listId)) {
        errors.push(`agent '${agent.agent_id}' references unknown skill_list '${listId}'`);
      }
    }
  }

  const project = normalized.project;
  if (project) {
    if (!project.name) {
      errors.push("project.name is required");
    }
    if (!project.workspace_path) {
      errors.push("project.workspace_path is required");
    }
    for (const agentId of project.agent_ids) {
      if (!agentClosure.has(agentId)) {
        errors.push(`project.agent_ids references unknown agent '${agentId}'`);
      }
    }
    validateRouteTableAgainstAgents(project.route_table, agentClosure, "project", errors);
    validateRouteTableAgainstAgents(project.task_assign_route_table, agentClosure, "project", errors);
    validateDiscussRoundsAgainstAgents(project.route_discuss_rounds, agentClosure, "project", errors);
  }

  const template = normalized.workflow_template;
  if (template) {
    if (!template.name) {
      errors.push("workflow_template.name is required");
    }
    errors.push(...template.taskErrors);
    for (const task of template.tasks) {
      if (task.ownerRole && !agentClosure.has(task.ownerRole)) {
        errors.push(`workflow task '${task.taskId}' owner_role '${task.ownerRole}' is outside agent closure`);
      }
    }
    validateRouteTableAgainstAgents(template.route_table, agentClosure, "workflow_template", errors);
    validateRouteTableAgainstAgents(template.task_assign_route_table, agentClosure, "workflow_template", errors);
    validateDiscussRoundsAgainstAgents(template.route_discuss_rounds, agentClosure, "workflow_template", errors);
  }

  const run = normalized.workflow_run;
  if (run) {
    if (!run.workspace_path) {
      errors.push("workflow_run.workspace_path is required");
    }
    if (!run.template_id) {
      errors.push("workflow_run.template_id is required");
    }
    if (template && run.template_id !== template.template_id) {
      errors.push(
        `workflow_run.template_id '${run.template_id}' must match workflow_template.template_id '${template.template_id}'`
      );
    }
    if (run.auto_start) {
      errors.push("workflow_run.auto_start must be false for agent-workspace v1");
    }
  }
}

function hasRoutePresence(routeTable, agentId) {
  if (!routeTable) {
    return false;
  }
  for (const [from, targets] of Object.entries(routeTable)) {
    if (from === agentId) {
      return true;
    }
    for (const target of targets) {
      if (target === agentId) {
        return true;
      }
    }
  }
  return false;
}

function validateProjectQaGuardRule(normalized, errors) {
  const project = normalized.project;
  if (!project) {
    return;
  }

  const qaGuardIds = normalized.agents
    .map((agent) => agent.agent_id)
    .filter((agentId) => agentId.toLowerCase().endsWith("_qa_guard"));

  if (qaGuardIds.length === 0) {
    errors.push("project mode requires one dedicated QA Guard agent with id suffix '_qa_guard'");
    return;
  }

  const projectQaGuards = qaGuardIds.filter((agentId) => project.agent_ids.includes(agentId));
  if (projectQaGuards.length === 0) {
    errors.push("project.agent_ids must include the dedicated QA Guard agent");
    return;
  }

  for (const qaGuardId of projectQaGuards) {
    const inProjectRouting =
      hasRoutePresence(project.route_table, qaGuardId) || hasRoutePresence(project.task_assign_route_table, qaGuardId);
    if (!inProjectRouting) {
      errors.push(`project routing must include QA Guard '${qaGuardId}' in route_table or task_assign_route_table`);
    }
  }

  const template = normalized.workflow_template;
  if (template) {
    const qaOwners = new Set(template.tasks.map((task) => task.ownerRole));
    const assigned = projectQaGuards.some((agentId) => qaOwners.has(agentId));
    if (!assigned) {
      errors.push("workflow_template.tasks must assign at least one task owner_role to project QA Guard");
    }
  }
}

const FRAMEWORK_PROMPT_TERMS = [
  "easyagentteam",
  "workspace contract",
  "manager-routed",
  "toolcall",
  "route_table",
  "task_assign_route_table",
  "accountability.report_to",
  "progress.md"
];

const ROLE_FUNCTION_TERMS = ["role", "objective", "responsibility", "function", "职责", "职能", "角色"];
const ROLE_TOOLS_TERMS = ["tool", "tools", "api", "sdk", "service", "工具", "接口", "调用"];
const ROLE_METHOD_TERMS = ["method", "approach", "workflow", "process", "strategy", "方法", "流程", "策略"];

const FORBIDDEN_TEMPLATE_EXECUTION_PATTERNS = [
  {
    id: "workflow_run_start_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/start\b/i
  },
  {
    id: "workflow_run_stop_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/stop\b/i
  },
  {
    id: "workflow_sessions_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/sessions\b/i
  },
  {
    id: "workflow_task_actions_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/task-actions\b/i
  },
  {
    id: "workflow_messages_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/messages\/send\b/i
  },
  {
    id: "workflow_orchestrator_api",
    pattern: /\/api\/workflow-runs\/[^/\s]+\/orchestrator\b/i
  },
  {
    id: "task_report_action",
    pattern: /\bTASK_REPORT\b|task_report_(done|in_progress|block)\b/i
  },
  {
    id: "task_actions_literal",
    pattern: /\baction_type\s*[:=]\s*["']TASK_REPORT["']/i
  },
  {
    id: "manual_run_control",
    pattern: /\b(start|stop)\s+run\b/i
  }
];

const FORBIDDEN_INTERNAL_PATH_PATTERNS = [
  { id: "server_src_path", pattern: /(?:^|[\s"'`(])server\/src\//i },
  { id: "orchestrator_service_path", pattern: /src\/services\/orchestrator\//i },
  { id: "agent_workspace_internal_path", pattern: /agent-workspace\/(src|campaign|tests)\//i }
];

const TASK_CONTRACT_GROUPS = [
  {
    key: "objective",
    terms: ["objective", "goal", "outcome", "目标", "目的", "交付目标"]
  },
  {
    key: "input",
    terms: ["input", "precondition", "dependency", "输入", "前置", "依赖"]
  },
  {
    key: "output",
    terms: ["output", "deliverable", "artifact", "输出", "产出", "交付物"]
  },
  {
    key: "constraints",
    terms: ["constraint", "boundary", "scope", "non-goal", "限制", "边界", "约束", "禁止"]
  },
  {
    key: "exception",
    terms: ["exception", "fallback", "retry", "error", "异常", "失败", "阻塞", "回退"]
  },
  {
    key: "verification",
    terms: ["verification", "acceptance", "criteria", "verify", "check", "验收", "验证", "通过标准", "验收标准"]
  }
];

const TASK_OWNERSHIP_BOUNDARY_TERMS = [
  "own task",
  "only this task",
  "only update this task",
  "do not update other tasks",
  "本任务",
  "仅更新本任务",
  "不得更新其他任务",
  "仅汇报本任务"
];

const DISALLOWED_ARTIFACT_EXTENSIONS = new Set([
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".docx",
  ".doc",
  ".pdf",
  ".zip",
  ".apk",
  ".exe",
  ".bin"
]);

function textContainsAny(source, terms) {
  const text = String(source ?? "").toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function normalizeTaskId(task) {
  return assertString(task?.task_id ?? task?.taskId);
}

function collectForbiddenPatternMatches(text, patternDescriptors) {
  const source = String(text ?? "");
  const hits = [];
  for (const descriptor of patternDescriptors) {
    if (descriptor.pattern.test(source)) {
      hits.push(descriptor.id);
    }
  }
  return hits;
}

function buildTaskContractText(task, raw) {
  return [
    task.title,
    raw.content,
    raw.description,
    ...(Array.isArray(task.acceptance) ? task.acceptance : []),
    ...(Array.isArray(task.artifacts) ? task.artifacts : []),
    ...(Array.isArray(task.writeSet) ? task.writeSet : [])
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function toNormalizedRelativePath(raw) {
  return String(raw ?? "").trim().replace(/\\/g, "/");
}

function getPathExtension(artifactPath) {
  const normalized = toNormalizedRelativePath(artifactPath);
  const filename = normalized.split("/").pop() ?? "";
  const dot = filename.lastIndexOf(".");
  if (dot < 0) {
    return "";
  }
  return filename.slice(dot).toLowerCase();
}

function artifactCoveredByWriteSet(artifactPath, writeSetPaths) {
  const artifact = toNormalizedRelativePath(artifactPath);
  if (!artifact) {
    return false;
  }
  for (const writeSetPath of writeSetPaths) {
    const normalizedWrite = toNormalizedRelativePath(writeSetPath);
    if (!normalizedWrite) {
      continue;
    }
    if (normalizedWrite.endsWith("/**")) {
      const prefix = normalizedWrite.slice(0, -2);
      if (artifact.startsWith(prefix)) {
        return true;
      }
      continue;
    }
    if (normalizedWrite.endsWith("/*")) {
      const prefix = normalizedWrite.slice(0, -1);
      if (artifact.startsWith(prefix)) {
        return true;
      }
      continue;
    }
    if (artifact === normalizedWrite || artifact.startsWith(`${normalizedWrite}/`)) {
      return true;
    }
  }
  return false;
}

function validateSkillPackageHardRules(skillDescriptors, errors) {
  for (const descriptor of skillDescriptors) {
    const skillFile = String(descriptor?.skillFilePath ?? "");
    const frontmatterName = String(descriptor?.frontmatterName ?? "").trim();
    const frontmatterSkillId = String(descriptor?.frontmatterSkillId ?? "").trim();
    if (!frontmatterName) {
      const hint = frontmatterSkillId
        ? `frontmatter 'skill_id' is present ('${frontmatterSkillId}') but 'name' is required`
        : "frontmatter 'name' is missing";
      errors.push(`skill package '${skillFile}' invalid: ${hint}`);
    }
  }
}

function validateAgentPromptHardRules(normalized, errors) {
  for (const agent of normalized.agents) {
    const prompt = String(agent.prompt ?? "");
    const missing = [];
    if (!textContainsAny(prompt, ROLE_FUNCTION_TERMS)) {
      missing.push("function");
    }
    if (!textContainsAny(prompt, ROLE_TOOLS_TERMS)) {
      missing.push("tools");
    }
    if (!textContainsAny(prompt, ROLE_METHOD_TERMS)) {
      missing.push("method");
    }
    if (missing.length > 0) {
      errors.push(
        `agent '${agent.agent_id}' prompt must include function/tools/method sections; missing: ${missing.join(", ")}`
      );
    }

    const frameworkHits = FRAMEWORK_PROMPT_TERMS.filter((term) => prompt.toLowerCase().includes(term.toLowerCase()));
    if (frameworkHits.length > 0) {
      errors.push(
        `agent '${agent.agent_id}' prompt includes forbidden framework runtime terms: ${frameworkHits.join(", ")}`
      );
    }

    const executionHits = collectForbiddenPatternMatches(prompt, FORBIDDEN_TEMPLATE_EXECUTION_PATTERNS);
    if (executionHits.length > 0) {
      errors.push(
        `agent '${agent.agent_id}' prompt includes forbidden execution-control instructions: ${executionHits.join(", ")}`
      );
    }

    const pathHits = collectForbiddenPatternMatches(prompt, FORBIDDEN_INTERNAL_PATH_PATTERNS);
    if (pathHits.length > 0) {
      errors.push(`agent '${agent.agent_id}' prompt references forbidden internal paths: ${pathHits.join(", ")}`);
    }
  }
}

function validateTaskContractHardRules(normalized, rawTasks, errors) {
  const template = normalized.workflow_template;
  if (!template) {
    return;
  }
  const rawMap = new Map(rawTasks.map((task) => [normalizeTaskId(task), task]));
  const writeSetOwners = new Map();
  for (const task of template.tasks) {
    const raw = rawMap.get(task.taskId) ?? {};
    const text = buildTaskContractText(task, raw);
    const missingGroups = TASK_CONTRACT_GROUPS.filter((group) => !textContainsAny(text, group.terms)).map(
      (group) => group.key
    );
    if (missingGroups.length > 0) {
      errors.push(
        `workflow task '${task.taskId}' is missing required business contract fields: ${missingGroups.join(", ")}`
      );
    }

    const artifacts = Array.isArray(task.artifacts) ? task.artifacts : [];
    if (artifacts.length === 0) {
      errors.push(`workflow task '${task.taskId}' must declare at least one artifact path`);
    }
    const writeSet = Array.isArray(task.writeSet) ? task.writeSet : [];
    if (writeSet.length === 0) {
      errors.push(`workflow task '${task.taskId}' must declare at least one write_set path`);
    }
    for (const writePath of writeSet) {
      const normalizedWritePath = toNormalizedRelativePath(writePath);
      if (!normalizedWritePath.startsWith("workspace/")) {
        errors.push(
          `workflow task '${task.taskId}' write_set must be workspace-relative and start with 'workspace/': ${normalizedWritePath}`
        );
      }
      const owners = writeSetOwners.get(normalizedWritePath) ?? [];
      owners.push(task.taskId);
      writeSetOwners.set(normalizedWritePath, owners);
    }

    for (const artifact of artifacts) {
      const normalizedArtifact = toNormalizedRelativePath(artifact);
      if (!normalizedArtifact.startsWith("workspace/")) {
        errors.push(
          `workflow task '${task.taskId}' artifact must be workspace-relative and start with 'workspace/': ${normalizedArtifact}`
        );
      }
      const ext = getPathExtension(normalizedArtifact);
      if (DISALLOWED_ARTIFACT_EXTENSIONS.has(ext)) {
        errors.push(
          `workflow task '${task.taskId}' artifact uses disallowed extension '${ext}' (prefer text-native formats like .md/.json/.csv/.txt/.yml)`
        );
      }
      if (writeSet.length > 0 && !artifactCoveredByWriteSet(normalizedArtifact, writeSet)) {
        errors.push(
          `workflow task '${task.taskId}' artifact '${normalizedArtifact}' is not covered by declared write_set paths`
        );
      }
    }

    const executionHits = collectForbiddenPatternMatches(text, FORBIDDEN_TEMPLATE_EXECUTION_PATTERNS);
    if (executionHits.length > 0) {
      errors.push(
        `workflow task '${task.taskId}' includes forbidden execution-control instructions: ${executionHits.join(", ")}`
      );
    }

    const pathHits = collectForbiddenPatternMatches(text, FORBIDDEN_INTERNAL_PATH_PATTERNS);
    if (pathHits.length > 0) {
      errors.push(`workflow task '${task.taskId}' references forbidden internal paths: ${pathHits.join(", ")}`);
    }
  }
  for (const [writePath, owners] of writeSetOwners.entries()) {
    const uniqueOwners = [...new Set(owners)];
    if (uniqueOwners.length > 1) {
      errors.push(`workflow tasks share the same write_set path '${writePath}': ${uniqueOwners.join(", ")}`);
    }
  }
}

function validateAgentPromptWarnings(normalized, warnings) {
  for (const agent of normalized.agents) {
    const prompt = String(agent.prompt ?? "");
    const lowered = prompt.toLowerCase();
    const overloadCount = FRAMEWORK_PROMPT_TERMS.reduce(
      (count, term) => count + (lowered.includes(term.toLowerCase()) ? 1 : 0),
      0
    );
    if (overloadCount >= 2) {
      warnings.push(
        `agent '${agent.agent_id}' prompt may over-emphasize framework internals; prefer role function/tools/method focus`
      );
    }

    const missing = [];
    if (!textContainsAny(prompt, ROLE_FUNCTION_TERMS)) {
      missing.push("function");
    }
    if (!textContainsAny(prompt, ROLE_TOOLS_TERMS)) {
      missing.push("tools");
    }
    if (!textContainsAny(prompt, ROLE_METHOD_TERMS)) {
      missing.push("method");
    }
    if (missing.length > 0) {
      warnings.push(`agent '${agent.agent_id}' prompt is missing role context sections: ${missing.join(", ")}`);
    }
  }
}

function validateTaskContractWarnings(normalized, rawTasks, warnings) {
  const template = normalized.workflow_template;
  if (!template) {
    return;
  }
  const rawMap = new Map(rawTasks.map((task) => [normalizeTaskId(task), task]));

  for (const task of template.tasks) {
    const raw = rawMap.get(task.taskId) ?? {};
    const text = buildTaskContractText(task, raw);

    const missingGroups = TASK_CONTRACT_GROUPS.filter((group) => !textContainsAny(text, group.terms)).map(
      (group) => group.key
    );
    if (missingGroups.length >= 2) {
      warnings.push(
        `workflow task '${task.taskId}' may lack business contract details: ${missingGroups.join(", ")}`
      );
    }

    if (!textContainsAny(text, TASK_OWNERSHIP_BOUNDARY_TERMS)) {
      warnings.push(
        `workflow task '${task.taskId}' should state ownership boundary (only update/report this task, not other tasks)`
      );
    }

    if (!/[0-9]/.test(text)) {
      warnings.push(
        `workflow task '${task.taskId}' should include measurable numeric limits (for example file count, size cap, or SLA timeout)`
      );
    }
  }
}

export async function validateBundleModule(context) {
  const errors = [];
  const warnings = [];
  const raw = context.bundle;
  const rawWorkflowTasks = Array.isArray(raw?.workflow_template?.tasks) ? raw.workflow_template.tasks : [];

  const normalized = {
    bundle_id: context.bundleId,
    skills_sources: Array.isArray(raw.skills_sources) ? raw.skills_sources.map((item) => String(item)) : [],
    skill_lists: normalizeSkillLists(raw.skill_lists),
    agents: normalizeAgents(raw.agents),
    project: null,
    workflow_template: null,
    workflow_run: null
  };

  normalized.project = normalizeProject(
    raw.project,
    normalized.agents.map((item) => item.agent_id)
  );
  normalized.workflow_template = normalizeWorkflowTemplate(raw.workflow_template);
  normalized.workflow_run = normalizeWorkflowRun(
    raw.workflow_run,
    normalized.workflow_template,
    normalized.project?.workspace_path
  );

  validateBasics(normalized, errors);
  validateIdRules(normalized, errors);

  const duplicateAgentIds = normalized.agents.map((item) => item.agent_id);
  if (duplicateAgentIds.length !== new Set(duplicateAgentIds).size) {
    errors.push("bundle agents contains duplicate agent_id");
  }
  const duplicateListIds = normalized.skill_lists.map((item) => item.list_id);
  if (duplicateListIds.length !== new Set(duplicateListIds).size) {
    errors.push("bundle skill_lists contains duplicate list_id");
  }

  const skillResolution = await resolveSkillSources(context.bundleDir, normalized.skills_sources);
  const predictedSkillIds = skillResolution.predictedSkillIds;
  if (predictedSkillIds.length === 0) {
    warnings.push("skills_sources resolved zero skill packages; local skill import will be skipped until a skill is added");
  }
  if (predictedSkillIds.length !== new Set(predictedSkillIds).size) {
    errors.push("skills_sources resolve duplicate predicted skill_id");
  }
  validateSkillPackageHardRules(skillResolution.descriptors, errors);

  validateReferences(normalized, context.existing, predictedSkillIds, errors);
  validateProjectQaGuardRule(normalized, errors);
  validateAgentPromptHardRules(normalized, errors);
  validateTaskContractHardRules(normalized, rawWorkflowTasks, errors);
  validateAgentPromptWarnings(normalized, warnings);
  validateTaskContractWarnings(normalized, rawWorkflowTasks, warnings);
  validateConflicts(errors, context.existing.skills, predictedSkillIds, "skill_id");
  validateConflicts(
    errors,
    context.existing.skillLists,
    normalized.skill_lists.map((item) => item.list_id),
    "skill_list"
  );
  validateConflicts(
    errors,
    context.existing.agents,
    normalized.agents.map((item) => item.agent_id),
    "agent_id"
  );
  validateConflicts(errors, context.existing.projects, [normalized.project?.project_id].filter(Boolean), "project_id");
  validateConflicts(
    errors,
    context.existing.workflowTemplates,
    [normalized.workflow_template?.template_id].filter(Boolean),
    "workflow_template_id"
  );
  validateConflicts(
    errors,
    context.existing.workflowRuns,
    [normalized.workflow_run?.run_id].filter(Boolean),
    "workflow_run_id"
  );

  if (errors.length > 0) {
    throw new AgentWorkspaceError("bundle validation failed", "BUNDLE_VALIDATION_FAILED", { errors, warnings });
  }

  context.computed.normalizedBundle = normalized;
  context.computed.predictedSkillIds = predictedSkillIds;
  context.computed.resolvedSkillSources = skillResolution.sources;
  context.computed.skillDescriptors = skillResolution.descriptors;
  return {
    module: MODULE_NAMES.BUNDLE_VALIDATE,
    errors,
    warnings
  };
}

