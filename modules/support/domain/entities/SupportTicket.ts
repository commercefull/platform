/**
 * Support Ticket Aggregate Root
 *
 * Represents a customer support ticket with lifecycle management,
 * priority handling, and assignment tracking.
 */

export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'order' | 'payment' | 'shipping' | 'return' | 'product' | 'account' | 'technical';

export interface SupportTicketProps {
  supportTicketId: string;
  customerId: string;
  orderId?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  resolvedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export class SupportTicket {
  private props: SupportTicketProps;

  constructor(props: SupportTicketProps) {
    this.props = props;
  }

  get supportTicketId(): string {
    return this.props.supportTicketId;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get status(): TicketStatus {
    return this.props.status;
  }

  get priority(): TicketPriority {
    return this.props.priority;
  }

  get isOpen(): boolean {
    return this.props.status !== 'closed' && this.props.status !== 'resolved';
  }

  assignTo(agentId: string): void {
    this.props.assignedTo = agentId;
    this.props.status = 'in_progress';
  }

  resolve(): void {
    this.props.status = 'resolved';
    this.props.resolvedAt = new Date().toISOString();
  }

  close(): void {
    this.props.status = 'closed';
    this.props.closedAt = new Date().toISOString();
  }

  reopen(): void {
    if (this.props.status === 'closed' || this.props.status === 'resolved') {
      this.props.status = 'open';
      this.props.resolvedAt = undefined;
      this.props.closedAt = undefined;
    }
  }

  escalate(): void {
    const priorities: TicketPriority[] = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorities.indexOf(this.props.priority);
    if (currentIndex < priorities.length - 1) {
      this.props.priority = priorities[currentIndex + 1];
    }
  }

  toJSON(): SupportTicketProps {
    return { ...this.props };
  }
}
