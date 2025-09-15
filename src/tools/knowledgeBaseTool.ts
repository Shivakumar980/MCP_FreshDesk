import { z } from "zod";
import { ProjectConfig, ToolDefinition, ToolInvocationContext, ToolResult } from "../domain/types.js";
import { KnowledgeBaseService } from "../services/knowledgeBaseService.js";

const KnowledgeToolParameters = z.object({
  query: z.string().min(2, "Provide a more descriptive query"),
  limit: z.number().int().min(1).max(10).default(3),
});

interface KnowledgeToolDependencies {
  projectConfig: ProjectConfig;
}

export function createKnowledgeBaseTool({ projectConfig }: KnowledgeToolDependencies): ToolDefinition {
  const service = new KnowledgeBaseService(projectConfig.dataPaths.knowledgeBase);

  async function handler(context: ToolInvocationContext): Promise<ToolResult> {
    const params = interpretParameters(context);
    const results = service.search(params.query, params.limit);

    if (results.length === 0) {
      return {
        type: "text",
        content: "No knowledge base matches found for the provided query.",
      };
    }

    return {
      type: "json",
      content: {
        query: params.query,
        results: results.map((article) => ({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          url: article.url,
          tags: article.tags,
        })),
      },
      summary: `Retrieved ${results.length} potential knowledge base matches.`,
    };
  }

  return {
    name: "knowledge_base_search",
    description: "Retrieve relevant FreshDesk knowledge base articles for a user question or ticket context.",
    handler,
    parameters: KnowledgeToolParameters,
  };
}

function interpretParameters(context: ToolInvocationContext) {
  const raw = context.query.trim();

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return KnowledgeToolParameters.parse(parsed);
    } catch (error) {
      return KnowledgeToolParameters.parse({ query: context.query });
    }
  }

  return KnowledgeToolParameters.parse({ query: context.query });
}
