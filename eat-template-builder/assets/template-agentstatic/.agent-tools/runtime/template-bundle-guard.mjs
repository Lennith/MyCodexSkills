import path from "node:path";
import { AgentWorkspaceError, isAgentWorkspaceError } from "./errors.mjs";
import { loadTemplateBundle } from "./bundle-loader.mjs";
import { createRuntimeContext } from "./context.mjs";
import { runApply, runValidate } from "./engine.mjs";
import { readJsonFile, writeJsonFile, writeTextFile } from "./utils/file-utils.mjs";

function parseArgs(argv) {
  const args = {};
  const rest = Array.isArray(argv) ? argv : [];
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!String(token).startsWith("--")) {
      continue;
    }
    const key = String(token).slice(2);
    const next = rest[index + 1];
    if (!next || String(next).startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = String(next);
    index += 1;
  }
  const command = String(rest[0] ?? "").trim();
  return { command, args };
}

function ensureString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toAbsolutePath(workspaceRoot, maybePath) {
  const text = ensureString(maybePath);
  if (!text) {
    return "";
  }
  return path.isAbsolute(text) ? path.resolve(text) : path.resolve(workspaceRoot, text);
}

function uniqueArray(items) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))];
}

function toErrorStrings(error) {
  if (isAgentWorkspaceError(error)) {
    const detailsErrors = Array.isArray(error.details?.errors) ? error.details.errors : [];
    const base = detailsErrors.length > 0 ? detailsErrors : [error.message];
    return uniqueArray(base);
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return [String(error)];
}

function toWarningStrings(error) {
  if (!isAgentWorkspaceError(error)) {
    return [];
  }
  const detailsWarnings = Array.isArray(error.details?.warnings) ? error.details.warnings : [];
  return uniqueArray(detailsWarnings);
}

function suggestHintByMessage(message) {
  const text = String(message).toLowerCase();
  if (text.includes("already exists")) {
    return "A resource ID or name already exists in the backend. Change the shared prefix and try again.";
  }
  if (text.includes("unknown") || text.includes("outside agent closure")) {
    return "Check agent, route, and task references. They must point only to backend resources that already exist or resources created by this bundle.";
  }
  if (text.includes("missing required business contract fields")) {
    return "Fill in the TaskStep business contract fields: objective, input, output, constraints, boundary, exception handling, and acceptance criteria.";
  }
  if (text.includes("prompt includes forbidden framework runtime terms")) {
    return "Keep agent prompts focused on function, tools, and method. Remove framework runtime and routing protocol details.";
  }
  if (text.includes("artifact must be workspace-relative")) {
    return "Make artifact paths workspace-relative under workspace/ and align them with write_set.";
  }
  if (text.includes("write_set")) {
    return "Define a clear write_set for each task, cover every artifact path, and avoid overlap across tasks.";
  }
  if (text.includes("auto_start")) {
    return "workflow_run.auto_start must stay false. Runs should be started explicitly by the controller.";
  }
  return "Fix the bundle based on the validation error, then run check again.";
}

function buildHints(errors, warnings) {
  const byError = uniqueArray((Array.isArray(errors) ? errors : []).map((item) => suggestHintByMessage(item)));
  const warningHint =
    Array.isArray(warnings) && warnings.length > 0
      ? ["Warnings are present. Resolve them before publish to improve first-pass execution quality."]
      : [];
  return uniqueArray([...byError, ...warningHint]);
}

function toMarkdown(report) {
  const lines = [];
  lines.push(`# Template Bundle Guard - ${report.mode}`);
  lines.push("");
  lines.push(`- timestamp: ${report.timestamp}`);
  lines.push(`- status: ${report.status}`);
  lines.push(`- bundle_id: ${report.bundle_id || "(unknown)"}`);
  lines.push(`- bundle_path: ${report.bundle_path || "(unknown)"}`);
  lines.push(`- base_url: ${report.base_url || "(unknown)"}`);
  lines.push(`- project_id: ${report.project_id || "(none)"}`);
  lines.push(`- template_id: ${report.template_id || "(none)"}`);
  lines.push(`- run_id: ${report.run_id || "(none)"}`);
  lines.push("");
  lines.push("## Errors");
  if (report.errors.length === 0) {
    lines.push("- (none)");
  } else {
    for (const item of report.errors) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("## Hints");
  if (report.hints.length === 0) {
    lines.push("- (none)");
  } else {
    for (const item of report.hints) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  lines.push("## Warnings");
  if (report.warnings.length === 0) {
    lines.push("- (none)");
  } else {
    for (const item of report.warnings) {
      lines.push(`- ${item}`);
    }
  }
  lines.push("");
  return `${lines.join("\n").trim()}\n`;
}

async function writeGuardReport(reportDir, filenameBase, report) {
  const jsonPath = path.join(reportDir, `${filenameBase}.json`);
  const mdPath = path.join(reportDir, `${filenameBase}.md`);
  await writeJsonFile(jsonPath, report);
  await writeTextFile(mdPath, toMarkdown(report));
  return { jsonPath, mdPath };
}

function composeCheckReport(input) {
  return {
    timestamp: new Date().toISOString(),
    mode: "check",
    status: input.status,
    bundle_id: input.bundleId,
    bundle_path: input.bundlePath,
    base_url: input.baseUrl,
    errors: uniqueArray(input.errors),
    warnings: uniqueArray(input.warnings),
    hints: buildHints(input.errors, input.warnings),
    project_id: null,
    template_id: null,
    run_id: null
  };
}

async function runCheckInternal(input) {
  const errors = [];
  const warnings = [];
  let bundleId = "";
  try {
    const loaded = await loadTemplateBundle(input.bundlePath);
    bundleId = loaded.bundleId;
    const context = await createRuntimeContext({
      bundleId: loaded.bundleId,
      bundlePath: loaded.bundlePath,
      bundleDir: loaded.bundleDir,
      bundle: loaded.bundle,
      baseUrl: input.baseUrl,
      dryRun: false
    });
    const validation = await runValidate(context);
    warnings.push(...(validation.validation_warnings ?? []));
  } catch (error) {
    errors.push(...toErrorStrings(error));
    warnings.push(...toWarningStrings(error));
  }
  const status = errors.length > 0 ? "fail" : "pass";
  const report = composeCheckReport({
    status,
    bundleId,
    bundlePath: input.bundlePath,
    baseUrl: input.baseUrl,
    errors,
    warnings
  });
  return report;
}

function composePublishReport(input) {
  return {
    timestamp: new Date().toISOString(),
    mode: "publish",
    status: input.status,
    bundle_id: input.bundleId,
    bundle_path: input.bundlePath,
    base_url: input.baseUrl,
    errors: uniqueArray(input.errors),
    warnings: uniqueArray(input.warnings),
    hints: buildHints(input.errors, input.warnings),
    project_id: input.projectId ?? null,
    template_id: input.templateId ?? null,
    run_id: input.runId ?? null,
    rollback: Array.isArray(input.rollback) ? input.rollback : []
  };
}

function collectApplyErrors(applyReport) {
  const errors = [];
  if (Array.isArray(applyReport.validation_errors)) {
    errors.push(...applyReport.validation_errors);
  }
  if (applyReport.error?.details?.errors && Array.isArray(applyReport.error.details.errors)) {
    errors.push(...applyReport.error.details.errors);
  }
  if (typeof applyReport.error?.message === "string" && applyReport.error.message.trim()) {
    errors.push(applyReport.error.message);
  }
  return uniqueArray(errors);
}

function collectApplyWarnings(applyReport) {
  const warnings = [];
  if (Array.isArray(applyReport.validation_warnings)) {
    warnings.push(...applyReport.validation_warnings);
  }
  if (applyReport.error?.details?.warnings && Array.isArray(applyReport.error.details.warnings)) {
    warnings.push(...applyReport.error.details.warnings);
  }
  return uniqueArray(warnings);
}

async function runPublishInternal(input, checkReport) {
  if (checkReport.status !== "pass") {
    return composePublishReport({
      status: "fail",
      bundleId: checkReport.bundle_id,
      bundlePath: input.bundlePath,
      baseUrl: input.baseUrl,
      errors: checkReport.errors,
      warnings: checkReport.warnings,
      rollback: []
    });
  }

  try {
    const loaded = await loadTemplateBundle(input.bundlePath);
    const context = await createRuntimeContext({
      bundleId: loaded.bundleId,
      bundlePath: loaded.bundlePath,
      bundleDir: loaded.bundleDir,
      bundle: loaded.bundle,
      baseUrl: input.baseUrl,
      dryRun: false
    });
    const applyReport = await runApply(context);
    if (applyReport.status !== "pass") {
      return composePublishReport({
        status: "fail",
        bundleId: loaded.bundleId,
        bundlePath: input.bundlePath,
        baseUrl: input.baseUrl,
        errors: collectApplyErrors(applyReport),
        warnings: collectApplyWarnings(applyReport),
        projectId: applyReport.created_resources?.project_id,
        templateId: applyReport.created_resources?.workflow_template_id,
        runId: applyReport.created_resources?.workflow_run_id,
        rollback: applyReport.rollback
      });
    }
    return composePublishReport({
      status: "pass",
      bundleId: loaded.bundleId,
      bundlePath: input.bundlePath,
      baseUrl: input.baseUrl,
      errors: [],
      warnings: collectApplyWarnings(applyReport),
      projectId: applyReport.created_resources?.project_id,
      templateId: applyReport.created_resources?.workflow_template_id,
      runId: applyReport.created_resources?.workflow_run_id,
      rollback: applyReport.rollback
    });
  } catch (error) {
    return composePublishReport({
      status: "fail",
      bundleId: checkReport.bundle_id,
      bundlePath: input.bundlePath,
      baseUrl: input.baseUrl,
      errors: toErrorStrings(error),
      warnings: toWarningStrings(error),
      rollback: []
    });
  }
}

async function loadGuardConfig(configPath) {
  const config = await readJsonFile(configPath);
  const baseUrl = ensureString(config.base_url ?? config.baseUrl);
  const defaultBundlePath = ensureString(config.default_bundle_path ?? config.defaultBundlePath);
  const reportDir = ensureString(config.report_dir ?? config.reportDir);
  if (!baseUrl) {
    throw new AgentWorkspaceError("template guard config missing base_url", "TEMPLATE_GUARD_CONFIG_INVALID", {
      config_path: configPath
    });
  }
  if (!defaultBundlePath) {
    throw new AgentWorkspaceError(
      "template guard config missing default_bundle_path",
      "TEMPLATE_GUARD_CONFIG_INVALID",
      {
        config_path: configPath
      }
    );
  }
  if (!reportDir) {
    throw new AgentWorkspaceError("template guard config missing report_dir", "TEMPLATE_GUARD_CONFIG_INVALID", {
      config_path: configPath
    });
  }
  return {
    baseUrl,
    defaultBundlePath,
    reportDir
  };
}

function printSummary(report, paths) {
  console.log(`[template-bundle-guard] mode=${report.mode}`);
  console.log(`[template-bundle-guard] status=${report.status}`);
  console.log(`[template-bundle-guard] bundle_id=${report.bundle_id || "n/a"}`);
  console.log(`[template-bundle-guard] project_id=${report.project_id || "n/a"}`);
  console.log(`[template-bundle-guard] template_id=${report.template_id || "n/a"}`);
  console.log(`[template-bundle-guard] run_id=${report.run_id || "n/a"}`);
  console.log(`[template-bundle-guard] report_json=${paths.jsonPath}`);
  console.log(`[template-bundle-guard] report_md=${paths.mdPath}`);
}

export async function runTemplateBundleGuardCli(argv, options = {}) {
  const workspaceRoot = path.resolve(ensureString(options.workspaceRoot) || process.cwd());
  const configPath = toAbsolutePath(workspaceRoot, options.configPath || ".agent-tools/config.json");
  const parsed = parseArgs(argv);
  const command = parsed.command || "check";
  if (command !== "check" && command !== "publish") {
    throw new AgentWorkspaceError(
      "template bundle guard command must be check|publish",
      "TEMPLATE_GUARD_COMMAND_INVALID",
      {
        command
      }
    );
  }

  const config = await loadGuardConfig(configPath);
  const baseUrl = ensureString(parsed.args["base-url"]) || config.baseUrl;
  const bundlePath = toAbsolutePath(workspaceRoot, parsed.args.bundle || config.defaultBundlePath);
  const reportDir = toAbsolutePath(workspaceRoot, parsed.args["report-dir"] || config.reportDir);
  const guardInput = {
    baseUrl,
    bundlePath
  };

  const checkReport = await runCheckInternal(guardInput);
  const checkPaths = await writeGuardReport(reportDir, "last_check", checkReport);
  printSummary(checkReport, checkPaths);
  if (command === "check") {
    return checkReport.status === "pass" ? 0 : 1;
  }

  const publishReport = await runPublishInternal(guardInput, checkReport);
  const publishPaths = await writeGuardReport(reportDir, "last_publish", publishReport);
  printSummary(publishReport, publishPaths);
  return publishReport.status === "pass" ? 0 : 1;
}
