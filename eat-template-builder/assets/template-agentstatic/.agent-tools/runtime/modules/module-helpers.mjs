import { AgentWorkspaceError } from "../errors.mjs";

export function ensureValidated(context) {
  if (!context?.computed?.normalizedBundle) {
    throw new AgentWorkspaceError("bundle has not been validated", "BUNDLE_NOT_VALIDATED");
  }
}

export function timedStep(moduleName) {
  const startedAt = new Date().toISOString();
  return {
    module: moduleName,
    startedAt
  };
}

