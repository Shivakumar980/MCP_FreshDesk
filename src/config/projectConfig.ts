import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProjectConfig, ProjectConfigSchema } from "../domain/types.js";
import { logger } from "../utils/logger.js";

const CONFIG_PATH = resolve(process.cwd(), "config", "project.config.json");

export function loadProjectConfig(customPath?: string): ProjectConfig {
  const pathToRead = customPath ? resolve(process.cwd(), customPath) : CONFIG_PATH;
  const rawFile = readFileSync(pathToRead, "utf-8");
  const parsed = JSON.parse(rawFile) as unknown;
  const result = ProjectConfigSchema.safeParse(parsed);

  if (!result.success) {
    logger.error({ issues: result.error.issues }, "Invalid project configuration");
    throw new Error("Configuration validation failed");
  }

  return result.data;
}
