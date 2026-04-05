#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTemplateBundleGuardCli } from "../runtime/template-bundle-guard.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..", "..");
const exitCode = await runTemplateBundleGuardCli(process.argv.slice(2), { workspaceRoot });
process.exitCode = Number.isFinite(Number(exitCode)) ? Number(exitCode) : 1;