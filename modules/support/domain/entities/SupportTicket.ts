/**
 * Support Ticket Aggregate Root
 *
 * Represents a customer support ticket with lifecycle management,
 * priority handling, and assignment tracking.
 */

export type TicketStatus = 'open' | 'pending' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'order' | 'shipping' | 'return' | 'product' | 'payment' | 'account' | 'technical' | 'other';
export type TicketChannel = 'web' | 'email' | 'phone' | 'chat' | 'social';
export type SenderType = 'customer' | 'agent' | 'system';

export interface SupportTicketProps {
  supportTicketId: string;
  ticketNumber: string;
  customerId?: string;
  orderId?: string;
  email: string;
  name?: string;
  phone?: string;
  subject: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  subcategory?: string;
  channel: TicketChannel;
  assignedAgentId?: string;
  lastMessageBy?: string;
  lastMessageByType?: SenderType;
  lastMessageAt?: Date;
  firstResponseAt?: Date;
  responseTimeMinutes?: number;
  resolvedAt?: Date;
  resolutionTimeMinutes?: number;
  resolutionType?: string;
  resolutionNotes?: string;
  customerSatisfaction?: number;
  customerFeedback?: string;
  feedbackRequested: boolean;
  feedbackRequestedAt?: Date;
  tags?: string[];
  isEscalated: boolean;
  escalatedTo?: string;
  escalatedAt?: Date;
  escalationReason?: string;
  isSpam: boolean;
  reopenCount: number;
  customFields?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  dueAt?: Date;
}

export class SupportTicket {
  private props: SupportTicketProps;

  constructor(props: SupportTicketProps) {
    this.props = props;
  }

  get supportTicketId(): string {
    return this.props.supportTicketId;
  }

  get customerId(): string | undefined {
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
    this.props.assignedAgentId = agentId;
    this.props.status = 'in_progress';
  }

  resolve(): void {
    this.props.status = 'resolved';
    this.props.resolvedAt = new Date();
  }

  close(): void {
    this.props.status = 'closed';
    this.props.closedAt = new Date();
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
