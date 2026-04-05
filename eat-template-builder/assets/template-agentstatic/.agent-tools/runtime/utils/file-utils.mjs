import fs from "node:fs/promises";
import path from "node:path";
import { AgentWorkspaceError } from "../errors.mjs";

export async function readJsonFile(absolutePath) {
  try {
    const raw = await fs.readFile(absolutePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) {
      throw new AgentWorkspaceError(
        `JSON file must be UTF-8 without BOM: ${absolutePath}`,
        "JSON_BOM_NOT_ALLOWED",
        {
          path: absolutePath
        }
      );
    }
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof AgentWorkspaceError) {
      throw error;
    }
    throw new AgentWorkspaceError(`failed to read JSON file: ${absolutePath}`, "JSON_READ_FAILED", {
      path: absolutePath,
      cause: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function writeJsonFile(absolutePath, payload) {
  await ensureDir(path.dirname(absolutePath));
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(absolutePath, content, "utf8");
}

export async function writeTextFile(absolutePath, content) {
  await ensureDir(path.dirname(absolutePath));
  await fs.writeFile(absolutePath, content, "utf8");
}

export async function ensureDir(absolutePath) {
  await fs.mkdir(absolutePath, { recursive: true });
}

export async function exists(absolutePath) {
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

