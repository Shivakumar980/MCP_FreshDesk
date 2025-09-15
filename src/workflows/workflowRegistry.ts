import { ProjectConfig, Ticket, WorkflowDefinition } from "../domain/types.js";
import { logger } from "../utils/logger.js";
import { ToolRegistry } from "../tools/toolRegistry.js";
import { createTriageWorkflow } from "./triageWorkflow.js";

export interface WorkflowRegistry {
  register(workflow: WorkflowDefinition): void;
  list(): WorkflowDefinition[];
  run(workflowName: string, ticket: Ticket): Promise<Map<string, unknown>>;
}

interface WorkflowRegistryDependencies {
  projectConfig: ProjectConfig;
  toolRegistry: ToolRegistry;
}

export function createWorkflowRegistry({ projectConfig, toolRegistry }: WorkflowRegistryDependencies): WorkflowRegistry {
  const workflows = new Map<string, WorkflowDefinition>();

  const defaultWorkflows = [createTriageWorkflow()];
  for (const workflow of defaultWorkflows) {
    workflows.set(workflow.name, workflow);
  }

  function register(workflow: WorkflowDefinition) {
    if (workflows.has(workflow.name)) {
      logger.warn({ workflow: workflow.name }, "Overwriting existing workflow definition");
    }

    workflows.set(workflow.name, workflow);
  }

  async function run(workflowName: string, ticket: Ticket): Promise<Map<string, unknown>> {
    const workflow = workflows.get(workflowName);

    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' is not registered.`);
    }

    const artifacts = new Map<string, unknown>();

    for (const step of workflow.steps) {
      await step({
        ticket,
        tools: {
          invoke: (toolName, ctx) => toolRegistry.invoke(toolName, ctx),
        },
        config: projectConfig,
        artifacts,
      });
    }

    return artifacts;
  }

  function list(): WorkflowDefinition[] {
    return Array.from(workflows.values());
  }

  return {
    register,
    list,
    run,
  };
}
