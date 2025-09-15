import { z } from "zod";

export const TicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  description: z.string(),
  status: z.enum(["open", "pending", "resolved", "closed"]).default("open"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  productArea: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const KnowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  url: z.string().url().optional(),
  body: z.string(),
});

export type KnowledgeArticle = z.infer<typeof KnowledgeArticleSchema>;

export const ProjectConfigSchema = z.object({
  server: z.object({
    name: z.string(),
    description: z.string(),
    port: z.number().int().nonnegative().default(8000),
  }),
  aiProviders: z.object({
    defaultModel: z.string(),
    fallbackModel: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.2),
  }),
  dataPaths: z.object({
    tickets: z.string(),
    knowledgeBase: z.string(),
  }),
  governance: z.object({
    allowTicketUpdates: z.boolean().default(false),
    auditLogPath: z.string().optional(),
  }).default({ allowTicketUpdates: false }),
});

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>;

export interface ToolInvocationContext {
  ticket: Ticket | null;
  query: string;
  projectConfig: ProjectConfig;
}

export interface ToolResult {
  type: "text" | "json";
  content: string | Record<string, unknown>;
  summary?: string;
}

export type ToolHandler = (context: ToolInvocationContext) => Promise<ToolResult>;

export interface ToolDefinition {
  name: string;
  description: string;
  handler: ToolHandler;
  parameters?: z.ZodTypeAny;
  outputSchema?: z.ZodTypeAny;
}

export interface WorkflowContext {
  ticket: Ticket;
  tools: {
    invoke(name: string, context: ToolInvocationContext): Promise<ToolResult>;
  };
  config: ProjectConfig;
  artifacts: Map<string, unknown>;
}

export type WorkflowStep = (context: WorkflowContext) => Promise<void>;

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
}
