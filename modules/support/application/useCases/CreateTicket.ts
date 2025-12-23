/**
 * CreateTicket Use Case
 */

export interface CreateTicketInput {
  customerId: string;
  subject: string;
  description: string;
  type: 'question' | 'issue' | 'complaint' | 'return_request' | 'refund_request';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  orderId?: string;
  attachments?: string[];
  tags?: string[];
}

export interface CreateTicketOutput {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
}

export class CreateTicketUseCase {
  constructor(private readonly supportRepository: any) {}

  async execute(input: CreateTicketInput): Promise<CreateTicketOutput> {
    if (!input.customerId || !input.subject || !input.description || !input.type) {
      throw new Error('Customer ID, subject, description, and type are required');
    }

    const ticketId = `tkt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}`;

    // Auto-set priority for certain types
    let priority = input.priority || 'medium';
    if (input.type === 'return_request' || input.type === 'refund_request') {
      priority = 'high';
    }

    const ticket = await this.supportRepository.createTicket({
      ticketId,
      ticketNumber,
      customerId: input.customerId,
      subject: input.subject,
      description: input.description,
      type: input.type,
      priority,
      status: 'open',
      orderId: input.orderId,
      attachments: input.attachments || [],
      tags: input.tags || [],
    });

    return {
      ticketId: ticket.ticketId,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt.toISOString(),
    };
  }
}
