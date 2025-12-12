/**
 * Notification Entity
 */

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

export interface NotificationProps {
  notificationId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: NotificationType;
  channel: string;
  templateId?: string;
  subject?: string;
  content: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  retryCount: number;
  scheduledFor?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Notification {
  private props: NotificationProps;

  private constructor(props: NotificationProps) {
    this.props = props;
  }

  static create(props: {
    notificationId: string;
    recipientId: string;
    recipientEmail?: string;
    recipientPhone?: string;
    type: NotificationType;
    channel: string;
    templateId?: string;
    subject?: string;
    content: string;
    data?: Record<string, any>;
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }): Notification {
    const now = new Date();
    return new Notification({
      ...props,
      status: 'pending',
      retryCount: 0,
      createdAt: now,
      updatedAt: now
    });
  }

  static reconstitute(props: NotificationProps): Notification {
    return new Notification(props);
  }

  get notificationId(): string { return this.props.notificationId; }
  get recipientId(): string { return this.props.recipientId; }
  get type(): NotificationType { return this.props.type; }
  get status(): NotificationStatus { return this.props.status; }
  get content(): string { return this.props.content; }
  get createdAt(): Date { return this.props.createdAt; }

  markAsSent(): void {
    this.props.status = 'sent';
    this.props.sentAt = new Date();
    this.touch();
  }

  markAsDelivered(): void {
    this.props.status = 'delivered';
    this.props.deliveredAt = new Date();
    this.touch();
  }

  markAsRead(): void {
    this.props.status = 'read';
    this.props.readAt = new Date();
    this.touch();
  }

  markAsFailed(errorMessage: string): void {
    this.props.status = 'failed';
    this.props.errorMessage = errorMessage;
    this.props.retryCount += 1;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
