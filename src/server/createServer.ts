import { ProjectConfig, Ticket } from "../domain/types.js";
import { logger } from "../utils/logger.js";
import { ToolRegistry } from "../tools/toolRegistry.js";
import { WorkflowRegistry } from "../workflows/workflowRegistry.js";
import { TicketingService } from "../services/ticketingService.js";

export interface ServerRuntime {
  start(): Promise<void>;
  stop(): Promise<void>;
  runWorkflow(workflowName: string, ticketId: string): Promise<Map<string, unknown>>;
  listWorkflows(): string[];
  listTools(): string[];
}

interface CreateServerOptions {
  config: ProjectConfig;
  toolRegistry: ToolRegistry;
  workflowRegistry: WorkflowRegistry;
}

export function createServer({ config, toolRegistry, workflowRegistry }: CreateServerOptions): ServerRuntime {
  const ticketService = new TicketingService(config.dataPaths.tickets);

  async function start(): Promise<void> {
    logger.info(
      {
        serverName: config.server.name,
        tools: toolRegistry.list().map((tool) => tool.name),
        workflows: workflowRegistry.list().map((workflow) => workflow.name),
      },
      "Starting MCP server runtime",
    );

    await attemptSdkBootstrap();
  }

  async function stop(): Promise<void> {
    logger.info("Shutting down MCP server runtime");
  }

  async function runWorkflow(workflowName: string, ticketId: string): Promise<Map<string, unknown>> {
    const ticket = resolveTicket(ticketId);
    const artifacts = await workflowRegistry.run(workflowName, ticket);
    logger.info({ workflowName, ticketId }, "Workflow execution completed");
    return artifacts;
  }

  function listWorkflows(): string[] {
    return workflowRegistry.list().map((workflow) => workflow.name);
  }

  function listTools(): string[] {
    return toolRegistry.list().map((tool) => tool.name);
  }

  function resolveTicket(ticketId: string): Ticket {
    const ticket = ticketService.findTicket(ticketId);

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found in local data set.`);
    }

    return ticket;
  }

  return {
    start,
    stop,
    runWorkflow,
    listWorkflows,
    listTools,
  };
}

async function attemptSdkBootstrap(): Promise<void> {
  try {
    const sdkModule = (await import("@modelcontextprotocol/sdk")) as Record<string, unknown>;

    if (typeof sdkModule?.Server === "function") {
      logger.info(
        "Detected '@modelcontextprotocol/sdk'. Wire server registration logic to Server class in createServer.ts.",
      );
    } else {
      logger.debug("@modelcontextprotocol/sdk module does not expose a Server constructor in this environment.");
    }
  } catch (error) {
    logger.debug(
      { error: (error as Error).message },
      "@modelcontextprotocol/sdk not installed. Using lightweight runtime stub instead.",
    );
  }
}
