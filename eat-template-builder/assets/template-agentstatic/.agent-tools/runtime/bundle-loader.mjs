import path from "node:path";
import { readJsonFile } from "./utils/file-utils.mjs";
import { AgentWorkspaceError } from "./errors.mjs";

export async function loadTemplateBundle(bundlePathRaw) {
  const bundlePath = path.resolve(bundlePathRaw);
  const bundle = await readJsonFile(bundlePath);
  if (!bundle || typeof bundle !== "object") {
    throw new AgentWorkspaceError("bundle JSON must be an object", "BUNDLE_INVALID");
  }
  const bundleIdRaw = typeof bundle.bundle_id === "string" ? bundle.bundle_id.trim() : "";
  const bundleId = bundleIdRaw || path.basename(bundlePath, path.extname(bundlePath));
  return {
    bundlePath,
    bundleDir: path.dirname(bundlePath),
    bundleId,
    bundle
  };
}

