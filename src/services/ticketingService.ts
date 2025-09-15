import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Ticket, TicketSchema } from "../domain/types.js";
import { logger } from "../utils/logger.js";

export class TicketingService {
  private cache: Ticket[] | null = null;
  private readonly absolutePath: string;

  constructor(private readonly dataPath: string) {
    this.absolutePath = resolve(process.cwd(), dataPath);
  }

  private loadFromDisk(): Ticket[] {
    const raw = readFileSync(this.absolutePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const result = TicketSchema.array().safeParse(parsed);

    if (!result.success) {
      logger.error({ issues: result.error.issues }, "Failed to load ticket data");
      throw new Error("Ticket data validation failed");
    }

    logger.debug({ count: result.data.length }, "Loaded tickets from disk");
    return result.data;
  }

  private ensureCache(): Ticket[] {
    if (!this.cache) {
      this.cache = this.loadFromDisk();
    }

    return this.cache;
  }

  listTickets(): Ticket[] {
    return this.ensureCache();
  }

  findTicket(id: string): Ticket | undefined {
    return this.ensureCache().find((ticket) => ticket.id === id);
  }

  updateTicket(updatedTicket: Ticket): void {
    const tickets = this.ensureCache();
    const index = tickets.findIndex((ticket) => ticket.id === updatedTicket.id);

    if (index === -1) {
      throw new Error(`Ticket ${updatedTicket.id} not found`);
    }

    tickets[index] = {
      ...tickets[index],
      ...updatedTicket,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(this.absolutePath, JSON.stringify(tickets, null, 2));
    logger.info({ ticketId: updatedTicket.id }, "Persisted ticket update to disk");
  }
}
