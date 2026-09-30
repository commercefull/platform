/**
 * UpdateTicket Use Case
 */

import { SupportTicketNotFoundError } from '../../domain/errors/SupportErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export interface UpdateTicketInput {
  ticketId: string;
  status?: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  tags?: string[];
  internalNotes?: string;
  updatedBy: string;
}

export interface UpdateTicketOutput {
  ticketId: string;
  status: string;
  priority: string;
  assignedTo?: string;
  updatedAt: string;
}

interface TicketRecord {
  ticketId: string;
  customerId?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  createdAt?: Date;
  updatedAt: Date;
}

interface SupportRepository {
  findTicketById(ticketId: string): Promise<TicketRecord | null>;
  updateTicket(ticketId: string, data: Record<string, unknown>): Promise<TicketRecord>;
}

export class UpdateTicketUseCase {
  constructor(private readonly supportRepository: SupportRepository) {}

  async execute(input: UpdateTicketInput): Promise<UpdateTicketOutput> {
    const ticket = await this.supportRepository.findTicketById(input.ticketId);
    if (!ticket) {
      throw new SupportTicketNotFoundError(input.ticketId);
    }

    const updates: Record<string, unknown> = {};

    if (input.status) updates.status = input.status;
    if (input.priority) updates.priority = input.priority;
    if (input.assignedTo !== undefined) updates.assignedTo = input.assignedTo;
    if (input.tags) updates.tags = input.tags;
    if (input.internalNotes) updates.internalNotes = input.internalNotes;

    // Auto-set timestamps
    if (input.status === 'resolved' && ticket.status !== 'resolved') {
      updates.resolvedAt = new Date();
    }
    if (input.status === 'closed' && ticket.status !== 'closed') {
      updates.closedAt = new Date();
    }

    const updatedTicket = await this.supportRepository.updateTicket(input.ticketId, {
      ...updates,
      updatedBy: input.updatedBy,
    });

    if (input.status === 'resolved' && ticket.status !== 'resolved') {
      eventBus.emit('ticket.resolved', {
        ticketId: updatedTicket.ticketId,
        customerId: ticket.customerId,
        resolutionTimeMinutes: ticket.createdAt ? Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60000) : undefined,
      });
    }

    return {
      ticketId: updatedTicket.ticketId,
      status: updatedTicket.status,
      priority: updatedTicket.priority,
      assignedTo: updatedTicket.assignedTo,
      updatedAt: updatedTicket.updatedAt.toISOString(),
    };
  }
}
