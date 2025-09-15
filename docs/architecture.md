# Architecture Notes

This document captures the reasoning behind the skeleton architecture and provides prompts you can expand into a thesis-style project report.

## High-level design

- **Entry point (`src/index.ts`)**: Loads configuration, builds registries, and boots the server runtime. It is the integration point for MCP transports.
- **Configuration (`src/config/`)**: Validates project configuration via Zod, ensuring deterministic behaviour across environments.
- **Domain models (`src/domain/`)**: Centralised schemas for tickets, knowledge articles, and workflows. Shared Zod schemas make it easier to reuse validation in tools and services.
- **Services (`src/services/`)**: Data access layer for tickets and knowledge articles. Currently file-backed but can be replaced with API or database clients.
- **Tools (`src/tools/`)**: Encapsulate functionality exposed to MCP clients. Tools consume services and return typed responses that can be fed into AI agents.
- **Workflows (`src/workflows/`)**: Define multi-step automation paths that invoke tools in sequence. The registry exposes a `run` method that higher-level orchestrators (e.g., an agent loop) can call.
- **Server runtime (`src/server/createServer.ts`)**: Provides lifecycle hooks (`start`, `stop`, `runWorkflow`) and a placeholder `attemptSdkBootstrap` helper so you can connect the skeleton to a real MCP transport later.

## Extension prompts

Use the following prompts to guide deeper exploration:

1. **MCP transport integration**
   - Evaluate stdio vs WebSocket transports for your deployment environment.
   - Design authentication and rate-limiting strategies if the server is exposed externally.

2. **AI orchestration layer**
   - Specify how an LLM agent should decide which tools to call.
   - Describe prompt templates and memory strategies for long-running investigations.

3. **Data governance**
   - Determine when `allowTicketUpdates` should be toggled on and how audit logs should be structured.
   - Explore redaction pipelines to remove sensitive data before AI processing.

4. **Evaluation methodology**
   - Outline offline evaluation suites for accuracy, latency, and safety.
   - Consider user-in-the-loop experiments to measure operator satisfaction.

5. **Security considerations**
   - Document the threat model for exposing internal tools via MCP.
   - Recommend secrets management practices and rotation cadences.

Keep this document updated as you iterate. It becomes a valuable artifact when presenting the project to academic or professional audiences.
