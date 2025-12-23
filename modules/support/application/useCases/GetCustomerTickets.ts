/**
 * GetCustomerTickets Use Case
 */

export interface GetCustomerTicketsInput {
  customerId: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface TicketSummary {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  lastActivityAt?: string;
  commentCount: number;
}

export interface GetCustomerTicketsOutput {
  tickets: TicketSummary[];
  total: number;
  openCount: number;
  page: number;
  limit: number;
}

export class GetCustomerTicketsUseCase {
  constructor(private readonly supportRepository: any) {}

  async execute(input: GetCustomerTicketsInput): Promise<GetCustomerTicketsOutput> {
    const page = input.page || 1;
    const limit = input.limit || 10;

    const filters: Record<string, unknown> = {
      customerId: input.customerId,
    };
    if (input.status) filters.status = input.status;
    if (input.type) filters.type = input.type;

    const [tickets, total, openCount] = await Promise.all([
      this.supportRepository.findTickets(filters, { page, limit }),
      this.supportRepository.countTickets(filters),
      this.supportRepository.countTickets({ customerId: input.customerId, status: 'open' }),
    ]);

    return {
      tickets: tickets.map((t: any) => ({
        ticketId: t.ticketId,
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        type: t.type,
        priority: t.priority,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        lastActivityAt: t.lastActivityAt?.toISOString(),
        commentCount: t.commentCount || 0,
      })),
      total,
      openCount,
      page,
      limit,
    };
  }
}
