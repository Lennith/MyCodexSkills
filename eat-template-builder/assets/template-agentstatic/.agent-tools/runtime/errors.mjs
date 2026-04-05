export class AgentWorkspaceError extends Error {
  constructor(message, code = "AGENT_WORKSPACE_ERROR", details = undefined) {
    super(message);
    this.name = "AgentWorkspaceError";
    this.code = code;
    this.details = details;
  }
}

export function isAgentWorkspaceError(error) {
  return Boolean(error && typeof error === "object" && error.name === "AgentWorkspaceError");
}

