import fs from "node:fs/promises";
import path from "node:path";
import { AgentWorkspaceError } from "../errors.mjs";

const SKILL_FILE = "SKILL.md";

function normalizeSkillId(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFrontmatterFields(content) {
  const normalized = content.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return {
      name: "",
      skill_id: ""
    };
  }
  const frontmatter = match[1] ?? "";
  const lines = frontmatter
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const getField = (key) => {
    const line = lines.find((item) => item.toLowerCase().startsWith(`${key}:`));
    if (!line) {
      return "";
    }
    return line
      .slice(line.indexOf(":") + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  };

  return {
    name: getField("name"),
    skill_id: getField("skill_id")
  };
}

function pickCanonicalSkillName(frontmatterFields, fallbackName) {
  if (frontmatterFields.name) {
    return frontmatterFields.name;
  }
  if (frontmatterFields.skill_id) {
    return frontmatterFields.skill_id;
  }
  return fallbackName;
}

async function collectSkillFilesFromDirectory(rootDir, recursive) {
  const discovered = [];
  if (!recursive) {
    const direct = path.join(rootDir, SKILL_FILE);
    try {
      const stat = await fs.stat(direct);
      if (stat.isFile()) {
        discovered.push(direct);
      }
    } catch {
      // ignore
    }
    return discovered;
  }

  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(absolute);
      } else if (entry.isFile() && entry.name.toLowerCase() === SKILL_FILE.toLowerCase()) {
        discovered.push(absolute);
      }
    }
  }
  return discovered;
}

async function collectSkillFiles(sourcePath, recursive) {
  const absolute = path.resolve(sourcePath);
  let stat;
  try {
    stat = await fs.stat(absolute);
  } catch {
    throw new AgentWorkspaceError(`skill source not found: ${absolute}`, "SKILL_SOURCE_NOT_FOUND", { sourcePath });
  }
  if (stat.isFile()) {
    if (path.basename(absolute).toLowerCase() !== SKILL_FILE.toLowerCase()) {
      throw new AgentWorkspaceError(`skill source file must be ${SKILL_FILE}: ${absolute}`, "SKILL_SOURCE_INVALID", {
        sourcePath
      });
    }
    return [absolute];
  }
  if (!stat.isDirectory()) {
    throw new AgentWorkspaceError(`skill source is not file/directory: ${absolute}`, "SKILL_SOURCE_INVALID", {
      sourcePath
    });
  }
  const discovered = await collectSkillFilesFromDirectory(absolute, recursive);
  return discovered;
}

async function toSkillDescriptor(skillFilePath) {
  const skillRoot = path.dirname(skillFilePath);
  const content = await fs.readFile(skillFilePath, "utf8");
  const frontmatter = parseFrontmatterFields(content);
  const fallbackName = path.basename(skillRoot);
  const name = pickCanonicalSkillName(frontmatter, fallbackName);
  const skillId = normalizeSkillId(name);
  if (!skillId) {
    throw new AgentWorkspaceError(`invalid derived skill id from source: ${skillFilePath}`, "SKILL_ID_INVALID", {
      skillFilePath,
      name
    });
  }
  return {
    skillFilePath,
    skillRoot,
    name,
    skillId,
    frontmatterName: frontmatter.name,
    frontmatterSkillId: frontmatter.skill_id
  };
}

export async function resolveSkillSources(bundleDir, skillsSourcesRaw) {
  const sourcesRaw = Array.isArray(skillsSourcesRaw)
    ? skillsSourcesRaw
    : typeof skillsSourcesRaw === "string" && skillsSourcesRaw.trim()
      ? [skillsSourcesRaw.trim()]
      : [];
  const sources = sourcesRaw
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .map((item) => (path.isAbsolute(item) ? item : path.resolve(bundleDir, item)));

  const files = [];
  const resolvedSources = [];
  for (const source of sources) {
    const discovered = await collectSkillFiles(source, true);
    if (discovered.length > 0) {
      resolvedSources.push(source);
    }
    for (const skillFile of discovered) {
      files.push(skillFile);
    }
  }

  const dedupedFiles = Array.from(new Set(files.map((item) => path.resolve(item)))).sort((a, b) => a.localeCompare(b));
  const descriptors = [];
  for (const skillFilePath of dedupedFiles) {
    descriptors.push(await toSkillDescriptor(skillFilePath));
  }

  return {
    sources: resolvedSources,
    descriptors,
    predictedSkillIds: descriptors.map((item) => item.skillId)
  };
}

