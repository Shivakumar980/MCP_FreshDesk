import { ProjectConfig, ToolDefinition, ToolInvocationContext, ToolResult } from "../domain/types.js";
import { logger } from "../utils/logger.js";
import { createKnowledgeBaseTool } from "./knowledgeBaseTool.js";
import { createTicketingTool } from "./ticketingTool.js";

export interface ToolRegistry {
  register(tool: ToolDefinition): void;
  list(): ToolDefinition[];
  invoke(name: string, context: ToolInvocationContext): Promise<ToolResult>;
}

export interface ToolRegistryDependencies {
  projectConfig: ProjectConfig;
}

export function createToolRegistry({ projectConfig }: ToolRegistryDependencies): ToolRegistry {
  const registry = new Map<string, ToolDefinition>();

  const baseTools = [
    createKnowledgeBaseTool({ projectConfig }),
    createTicketingTool({ projectConfig }),
  ];

  for (const tool of baseTools) {
    registry.set(tool.name, tool);
  }

  function register(tool: ToolDefinition) {
    if (registry.has(tool.name)) {
      logger.warn({ tool: tool.name }, "Overwriting existing tool registration");
    }

    registry.set(tool.name, tool);
  }

  async function invoke(name: string, context: ToolInvocationContext): Promise<ToolResult> {
    const tool = registry.get(name);

    if (!tool) {
      throw new Error(`Tool '${name}' is not registered`);
    }

    logger.debug({ tool: name, query: context.query }, "Invoking MCP tool");
    const result = await tool.handler(context);

    if (tool.outputSchema) {
      tool.outputSchema.parse(result.content);
    }

    return result;
  }

  function list(): ToolDefinition[] {
    return Array.from(registry.values());
  }

  return {
    register,
    list,
    invoke,
  };
}
