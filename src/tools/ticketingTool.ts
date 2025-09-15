import { z } from "zod";
import { ProjectConfig, ToolDefinition, ToolInvocationContext, ToolResult } from "../domain/types.js";
import { TicketingService } from "../services/ticketingService.js";

const TicketingToolParameters = z.object({
  action: z.enum(["list_open", "get_details", "update_status"]).default("get_details"),
  ticketId: z.string().optional(),
  status: z.enum(["open", "pending", "resolved", "closed"]).optional(),
});

interface TicketingToolDependencies {
  projectConfig: ProjectConfig;
}

export function createTicketingTool({ projectConfig }: TicketingToolDependencies): ToolDefinition {
  const service = new TicketingService(projectConfig.dataPaths.tickets);

  async function handler(context: ToolInvocationContext): Promise<ToolResult> {
    const params = interpretParameters(context);

    switch (params.action) {
      case "list_open": {
        const openTickets = service
          .listTickets()
          .filter((ticket) => ticket.status === "open" || ticket.status === "pending")
          .map((ticket) => ({ id: ticket.id, subject: ticket.subject, priority: ticket.priority }));

        return {
          type: "json",
          content: { tickets: openTickets },
          summary: `Identified ${openTickets.length} open or pending tickets awaiting action.`,
        };
      }
      case "get_details": {
        const ticketId = params.ticketId ?? context.ticket?.id;

        if (!ticketId) {
          return {
            type: "text",
            content: "Ticket ID is required to retrieve ticket details.",
          };
        }

        const ticket = service.findTicket(ticketId);

        if (!ticket) {
          return {
            type: "text",
            content: `No ticket found with ID ${ticketId}.`,
          };
        }

        return {
          type: "json",
          content: ticket,
          summary: `Loaded ticket ${ticketId} for downstream analysis steps.`,
        };
      }
      case "update_status": {
        if (!projectConfig.governance.allowTicketUpdates) {
          return {
            type: "text",
            content: "Ticket updates are disabled in the current governance configuration.",
          };
        }

        const ticketId = params.ticketId ?? context.ticket?.id;
        if (!ticketId || !params.status) {
          return {
            type: "text",
            content: "Ticket ID and target status are required to update a ticket.",
          };
        }

        const ticket = service.findTicket(ticketId);
        if (!ticket) {
          return {
            type: "text",
            content: `Cannot update ticket ${ticketId} because it does not exist in the offline data set.`,
          };
        }

        service.updateTicket({ ...ticket, status: params.status });
        return {
          type: "text",
          content: `Ticket ${ticketId} updated to status '${params.status}'.`,
        };
      }
      default:
        return {
          type: "text",
          content: "Unsupported ticketing action requested.",
        };
    }
  }

  return {
    name: "ticketing_operations",
    description: "Inspect or update FreshDesk-style tickets used within automated MCP workflows.",
    handler,
    parameters: TicketingToolParameters,
  };
}

function interpretParameters(context: ToolInvocationContext) {
  const raw = context.query.trim();

  if (raw.length === 0) {
    return TicketingToolParameters.parse({ action: "get_details", ticketId: context.ticket?.id });
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return TicketingToolParameters.parse({ ticketId: context.ticket?.id, ...parsed });
  } catch (error) {
    return TicketingToolParameters.parse({
      action: raw.includes("list") ? "list_open" : "get_details",
      ticketId: context.ticket?.id,
    });
  }
}
