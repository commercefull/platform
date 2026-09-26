/**
 * ManageCustomerTickets Use Case
 *
 * Customer-facing ticket workflows: create (with initial message),
 * view (with ownership check + read-receipt side effect), reply
 * (ownership + closed-ticket invariant), satisfaction feedback
 * (ownership + resolved-only + range validation), and agent replies.
 */

import { SupportTicketNotFoundError, SupportValidationError } from '../../domain/errors/SupportErrors';
import type { TicketCategory, TicketChannel, TicketPriority, TicketStatus, SenderType } from '../../domain/repositories/SupportRepository';

export interface SupportTicketRecord {
  supportTicketId: string;
  customerId?: string | null;
  status: string;
  name?: string | null;
  email: string;
}

export interface SupportMessageRecord {
  supportMessageId: string;
}

interface SupportAgentRecord {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface CreateTicketRecordParams {
  customerId?: string;
  orderId?: string;
  email: string;
  name?: string;
  phone?: string;
  subject: string;
  description?: string;
  priority?: TicketPriority;
  category?: TicketCategory;
  channel?: TicketChannel;
}

export interface AddMessageRecordParams {
  supportTicketId: string;
  senderId?: string;
  senderType: SenderType;
  senderName?: string;
  senderEmail?: string;
  message: string;
  messageHtml?: string;
  messageType?: string;
  isInternal?: boolean;
  isAutoReply?: boolean;
}

export interface ManageCustomerTicketsPort {
  createTicket(params: CreateTicketRecordParams): Promise<SupportTicketRecord>;
  getTicket(ticketId: string): Promise<SupportTicketRecord | null>;
  addMessage(message: AddMessageRecordParams): Promise<SupportMessageRecord>;
  getMessages(ticketId: string, includeInternal?: boolean): Promise<unknown[]>;
  getAttachments(ticketId: string): Promise<unknown[]>;
  markMessagesRead(ticketId: string, readBy: string): Promise<void>;
  submitFeedback(ticketId: string, satisfaction: number, feedback?: string): Promise<void>;
  getAgent(agentId: string): Promise<SupportAgentRecord | null>;
  getTickets(
    filters?: { customerId?: string; status?: TicketStatus },
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: SupportTicketRecord[]; total: number }>;
}

export class ManageCustomerTicketsUseCase {
  constructor(private readonly support: ManageCustomerTicketsPort) {}

  async getTickets(
    filters?: { customerId?: string; status?: TicketStatus },
    pagination?: { limit?: number; offset?: number },
  ) {
    return this.support.getTickets(filters, pagination);
  }

  /** Create a ticket, adding the description as the first message. */
  async createTicket(input: CreateTicketRecordParams): Promise<SupportTicketRecord> {
    const ticket = await this.support.createTicket(input);

    if (input.description) {
      await this.support.addMessage({
        supportTicketId: ticket.supportTicketId,
        senderId: input.customerId,
        senderType: 'customer',
        senderName: input.name,
        senderEmail: input.email,
        message: input.description,
      });
    }

    return ticket;
  }

  /** Load a customer's ticket with messages/attachments and mark it read. */
  async getTicketDetail(ticketId: string, customerId: string): Promise<Record<string, unknown>> {
    const ticket = await this.support.getTicket(ticketId);

    if (!ticket || ticket.customerId !== customerId) {
      throw new SupportTicketNotFoundError(ticketId);
    }

    const messages = await this.support.getMessages(ticketId, false); // Exclude internal
    const attachments = await this.support.getAttachments(ticketId);

    await this.support.markMessagesRead(ticketId, customerId || '');

    return { ...ticket, messages, attachments };
  }

  /** Customer reply — requires ownership and an open ticket. */
  async addCustomerMessage(
    ticketId: string,
    customerId: string,
    body: { name?: string; email?: string; message: string },
  ): Promise<SupportMessageRecord> {
    const ticket = await this.support.getTicket(ticketId);

    if (!ticket || ticket.customerId !== customerId) {
      throw new SupportTicketNotFoundError(ticketId);
    }

    if (ticket.status === 'closed') {
      throw new SupportValidationError('Cannot reply to closed ticket');
    }

    return this.support.addMessage({
      supportTicketId: ticketId,
      senderId: customerId,
      senderType: 'customer',
      senderName: body.name || ticket.name || undefined,
      senderEmail: body.email || ticket.email,
      message: body.message,
    });
  }

  /** Satisfaction feedback — resolved/closed tickets only, 1–5. */
  async submitFeedback(ticketId: string, customerId: string, satisfaction: number, feedback?: string): Promise<void> {
    const ticket = await this.support.getTicket(ticketId);

    if (!ticket || ticket.customerId !== customerId) {
      throw new SupportTicketNotFoundError(ticketId);
    }

    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      throw new SupportValidationError('Can only submit feedback for resolved tickets');
    }

    if (satisfaction < 1 || satisfaction > 5) {
      throw new SupportValidationError('Satisfaction must be between 1 and 5');
    }

    await this.support.submitFeedback(ticketId, satisfaction, feedback);
  }

  /** Agent reply — enriches the message with the agent's display name/email. */
  async addAgentMessage(
    ticketId: string,
    agentId: string,
    body: { message: string; messageHtml?: string; isInternal?: boolean },
  ): Promise<SupportMessageRecord> {
    const agent = await this.support.getAgent(agentId);

    return this.support.addMessage({
      supportTicketId: ticketId,
      senderId: agentId,
      senderType: 'agent',
      senderName: agent ? `${agent.firstName} ${agent.lastName}` : undefined,
      senderEmail: agent?.email ?? undefined,
      message: body.message,
      messageHtml: body.messageHtml,
      isInternal: body.isInternal || false,
    });
  }
}
