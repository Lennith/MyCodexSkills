import { AgentWorkspaceError } from "../errors.mjs";

function normalizeUrl(baseUrl, routePath) {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const suffix = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${base}${suffix}`;
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function requestJson(baseUrl, method, routePath, body = undefined, expectedStatus = [200]) {
  const url = normalizeUrl(baseUrl, routePath);
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await safeJson(response);
  if (!expectedStatus.includes(response.status)) {
    throw new AgentWorkspaceError(
      `request failed: ${method} ${routePath} -> ${response.status}`,
      "HTTP_REQUEST_FAILED",
      { method, routePath, status: response.status, payload }
    );
  }
  return payload;
}

export async function fetchBackendState(baseUrl) {
  const [skills, skillLists, agents, projects, workflowTemplates, workflowRuns] = await Promise.all([
    requestJson(baseUrl, "GET", "/api/skills", undefined, [200]),
    requestJson(baseUrl, "GET", "/api/skill-lists", undefined, [200]),
    requestJson(baseUrl, "GET", "/api/agents", undefined, [200]),
    requestJson(baseUrl, "GET", "/api/projects", undefined, [200]),
    requestJson(baseUrl, "GET", "/api/workflow-templates", undefined, [200]),
    requestJson(baseUrl, "GET", "/api/workflow-runs", undefined, [200])
  ]);

  return {
    skills: new Set((skills?.items ?? []).map((item) => String(item.skillId ?? "").trim()).filter(Boolean)),
    skillLists: new Set((skillLists?.items ?? []).map((item) => String(item.listId ?? "").trim()).filter(Boolean)),
    agents: new Set((agents?.items ?? []).map((item) => String(item.agentId ?? "").trim()).filter(Boolean)),
    projects: new Set((projects?.items ?? []).map((item) => String(item.projectId ?? "").trim()).filter(Boolean)),
    workflowTemplates: new Set(
      (workflowTemplates?.items ?? []).map((item) => String(item.templateId ?? "").trim()).filter(Boolean)
    ),
    workflowRuns: new Set((workflowRuns?.items ?? []).map((item) => String(item.runId ?? "").trim()).filter(Boolean))
  };
}

