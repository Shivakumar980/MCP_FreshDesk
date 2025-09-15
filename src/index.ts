import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectConfig } from "./config/projectConfig.js";
import { createToolRegistry } from "./tools/toolRegistry.js";
import { createWorkflowRegistry } from "./workflows/workflowRegistry.js";
import { createServer } from "./server/createServer.js";
import { logger } from "./utils/logger.js";

loadEnv();

export async function bootstrap(): Promise<void> {
  const projectConfig = loadProjectConfig();
  const toolRegistry = createToolRegistry({ projectConfig });
  const workflowRegistry = createWorkflowRegistry({ projectConfig, toolRegistry });
  const server = createServer({ config: projectConfig, toolRegistry, workflowRegistry });

  await server.start();

  if (process.env.DEMO_WORKFLOW && process.env.DEMO_TICKET_ID) {
    const artifacts = await server.runWorkflow(process.env.DEMO_WORKFLOW, process.env.DEMO_TICKET_ID);
    logger.info({ artifacts: Object.fromEntries(artifacts.entries()) }, "Demo workflow execution completed");
  }
}

const isMainModule = (() => {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1] ? resolve(process.argv[1]) : undefined;
  return scriptPath ? resolve(modulePath) === scriptPath : false;
})();

if (isMainModule) {
  bootstrap().catch((error) => {
    logger.error({ err: error }, "Failed to start MCP server runtime");
    process.exit(1);
  });
}
