# FreshDesk MCP Server Skeleton

This repository provides a graduate-level yet approachable starting point for building an AI-assisted [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that triages FreshDesk-style support tickets. The codebase demonstrates how to structure an MCP server that orchestrates tools, workflows, and knowledge assets so you can showcase proficiency with AI tooling and the MCP ecosystem.

## Why this project?

The project is framed as an **AI augmentation layer for FreshDesk** that can:

- Retrieve contextual knowledge base articles for a ticket.
- Inspect or update offline ticket data via MCP tools.
- Orchestrate end-to-end triage workflows that combine tool calls and AI reasoning.
- Provide governance hooks for auditability and safe automation.

This makes it a compelling portfolio piece because it blends MCP concepts, AI tooling, and practical automation for customer support operations.

## Repository layout

```
.
├── config/                # Project configuration consumed by the runtime
├── data/                  # Sample tickets and knowledge base content
├── docs/                  # Architectural notes and design prompts
├── src/                   # TypeScript source code for the MCP server skeleton
│   ├── config/            # Configuration loader and validation
│   ├── domain/            # Core domain models shared across the app
│   ├── server/            # Server bootstrap logic and MCP integration hook
│   ├── services/          # Data access layers for tickets and knowledge articles
│   ├── tools/             # Tool definitions exposed over MCP
│   ├── workflows/         # Workflow orchestration primitives
│   └── utils/             # Cross-cutting helpers (e.g., logging)
├── package.json           # npm scripts and dependencies
└── tsconfig.json          # TypeScript compiler configuration
```

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the TypeScript build**

   ```bash
   npm run build
   ```

3. **Start the lightweight runtime**

   ```bash
   node dist/index.js
   ```

   The default bootstrap logs available tools and workflows. To execute the demo workflow against a specific ticket, set environment variables:

   ```bash
   DEMO_WORKFLOW=ticket_triage DEMO_TICKET_ID=TCK-1001 node dist/index.js
   ```

4. **Connect via MCP tooling (optional)**

   The runtime detects the presence of `@modelcontextprotocol/sdk`. After installing the SDK, extend `src/server/createServer.ts` to register the `toolRegistry` and `workflowRegistry` with the MCP server transport of your choice (e.g., stdio, WebSocket).

## Suggested implementation roadmap

The skeleton emphasises patterns you can expand into a full graduate-level project:

1. **Integrate an actual MCP transport**
   - Use `@modelcontextprotocol/sdk` to expose the registered tools over stdio or WebSocket.
   - Implement structured tool schemas so MCP clients (such as IDE extensions) can discover capabilities.

2. **Add AI reasoning loops**
   - Introduce an LLM client (OpenAI, Anthropic, Azure, etc.) that interprets ticket context, calls MCP tools, and drafts responses.
   - Store prompts and chain-of-thought outputs to support reproducibility and research.

3. **Implement advanced workflows**
   - Expand beyond `ticket_triage` to include quality audits, escalation detection, or automated post-mortem summaries.
   - Add human-in-the-loop checkpoints controlled via the `governance` configuration.

4. **Observability and evaluation**
   - Capture workflow metrics, tool invocation traces, and success criteria.
   - Build evaluation harnesses that replay historical tickets to benchmark automation quality.

5. **Deployability**
   - Containerise the runtime with Docker.
   - Provide Terraform or pulumi scripts for cloud deployment if targeting production scenarios.

## Customisation tips

- Modify `config/project.config.json` to point at real ticket stores or knowledge bases.
- Extend the `ToolRegistry` with domain-specific tools—e.g., FreshDesk API clients, CRM lookups, or internal runbooks.
- Replace the placeholder recommendation logic in `src/workflows/triageWorkflow.ts` with AI-generated action plans.
- Wire in persistence layers (PostgreSQL, Redis) and toggle `allowTicketUpdates` when you are ready to make stateful changes.
- Use the `docs/architecture.md` file as a living design document for thesis-style documentation.

## Testing

The project ships with a Vitest test runner stub. Add suites under `tests/` (create the folder) and update `npm test` once you implement business logic. Static validation via ESLint can be enabled through the provided configuration.

## License

[MIT](./LICENSE)
