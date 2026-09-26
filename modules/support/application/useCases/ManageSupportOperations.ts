/**
 * ManageSupportOperations Use Case
 *
 * Agent management and ticket administration façade shared by business
 * controllers, GraphQL resolvers, and admin views. Composes the ticket detail
 * read (ticket + messages + attachments) and owns the resolve/close/escalate
 * transitions.
 */

export interface AgentFilters {
  isActive?: boolean;
  isAvailable?: boolean;
  department?: string;
}

export interface AdminTicketFilters {
  customerId?: string;
  assignedAgentId?: string;
  status?: string;
  priority?: string;
  category?: string;
  isEscalated?: boolean;
}

export interface SupportOperationsPort {
  getAgents(filters?: AgentFilters): Promise<unknown[]>;
  getAgent(agentId: string): Promise<unknown>;
  saveAgent(agent: Record<string, unknown>): Promise<unknown>;
  getTickets(
    filters?: AdminTicketFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: unknown[]; total: number }>;
  getTicket(ticketId: string): Promise<unknown>;
  getMessages(ticketId: string, includeInternal?: boolean): Promise<unknown[]>;
  getAttachments(ticketId: string): Promise<unknown[]>;
  updateTicket(ticketId: string, updates: Record<string, unknown>): Promise<unknown>;
  resolveTicket(ticketId: string, resolutionType: string, resolutionNotes?: string): Promise<void>;
  closeTicket(ticketId: string): Promise<void>;
  escalateTicket(ticketId: string, escalatedTo: string, reason: string): Promise<void>;
}

export class ManageSupportOperationsUseCase {
  constructor(private readonly support: SupportOperationsPort) {}

  async listAgents(filters?: AgentFilters) {
    return this.support.getAgents(filters);
  }

  async getAgent(agentId: string) {
    return this.support.getAgent(agentId);
  }

  async saveAgent(agent: Record<string, unknown>) {
    return this.support.saveAgent(agent);
  }

  async listTickets(filters: AdminTicketFilters, pagination: { limit?: number; offset?: number }) {
    return this.support.getTickets(filters, pagination);
  }

  async getTicketDetail(ticketId: string) {
    const ticket = await this.support.getTicket(ticketId);
    if (!ticket) {
      return null;
    }
    const messages = await this.support.getMessages(ticketId, true);
    const attachments = await this.support.getAttachments(ticketId);
    return { ...(ticket as Record<string, unknown>), messages, attachments };
  }

  async updateTicket(ticketId: string, updates: Record<string, unknown>) {
    return this.support.updateTicket(ticketId, updates);
  }

  async assignTicket(ticketId: string, agentId: string) {
    return this.support.updateTicket(ticketId, { assignedAgentId: agentId });
  }

  async resolveTicket(ticketId: string, resolutionType: string, resolutionNotes?: string) {
    return this.support.resolveTicket(ticketId, resolutionType, resolutionNotes);
  }

  async closeTicket(ticketId: string) {
    return this.support.closeTicket(ticketId);
  }

  async escalateTicket(ticketId: string, escalatedTo: string, reason: string) {
    return this.support.escalateTicket(ticketId, escalatedTo, reason);
  }
}
