/**
 * Webhook Delivery Entity
 *
 * Represents a single delivery attempt of an event payload to a webhook endpoint.
 */

export type DeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

export interface WebhookDeliveryProps {
  webhookDeliveryId: string;
  webhookEndpointId: string;
  eventType: string;
  eventId: string;
  payload: unknown;
  status: DeliveryStatus;
  attempts: number;
  lastAttemptAt: Date | null;
  nextRetryAt: Date | null;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookDeliveryEntity {
  private props: WebhookDeliveryProps;

  private constructor(props: WebhookDeliveryProps) {
    this.props = props;
  }

  static create(props: {
    webhookDeliveryId: string;
    webhookEndpointId: string;
    eventType: string;
    eventId: string;
    payload: unknown;
  }): WebhookDeliveryEntity {
    const now = new Date();
    return new WebhookDeliveryEntity({
      webhookDeliveryId: props.webhookDeliveryId,
      webhookEndpointId: props.webhookEndpointId,
      eventType: props.eventType,
      eventId: props.eventId,
      payload: props.payload,
      status: 'pending',
      attempts: 0,
      lastAttemptAt: null,
      nextRetryAt: null,
      responseStatus: null,
      responseBody: null,
      errorMessage: null,
      duration: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: WebhookDeliveryProps): WebhookDeliveryEntity {
    return new WebhookDeliveryEntity(props);
  }

  // Getters
  get webhookDeliveryId(): string { return this.props.webhookDeliveryId; }
  get webhookEndpointId(): string { return this.props.webhookEndpointId; }
  get eventType(): string { return this.props.eventType; }
  get eventId(): string { return this.props.eventId; }
  get payload(): unknown { return this.props.payload; }
  get status(): DeliveryStatus { return this.props.status; }
  get attempts(): number { return this.props.attempts; }
  get lastAttemptAt(): Date | null { return this.props.lastAttemptAt; }
  get nextRetryAt(): Date | null { return this.props.nextRetryAt; }
  get responseStatus(): number | null { return this.props.responseStatus; }
  get responseBody(): string | null { return this.props.responseBody; }
  get errorMessage(): string | null { return this.props.errorMessage; }
  get duration(): number | null { return this.props.duration; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  recordSuccess(responseStatus: number, responseBody: string, durationMs: number): void {
    this.props.status = 'success';
    this.props.attempts += 1;
    this.props.lastAttemptAt = new Date();
    this.props.responseStatus = responseStatus;
    this.props.responseBody = responseBody?.substring(0, 4096) || null;
    this.props.duration = durationMs;
    this.props.nextRetryAt = null;
    this.props.errorMessage = null;
    this.touch();
  }

  recordFailure(
    errorMessage: string,
    responseStatus: number | null,
    responseBody: string | null,
    durationMs: number,
    maxRetries: number,
    retryIntervalMs: number,
    backoffMultiplier: number,
  ): void {
    this.props.attempts += 1;
    this.props.lastAttemptAt = new Date();
    this.props.responseStatus = responseStatus;
    this.props.responseBody = responseBody?.substring(0, 4096) || null;
    this.props.errorMessage = errorMessage;
    this.props.duration = durationMs;

    if (this.props.attempts >= maxRetries) {
      this.props.status = 'failed';
      this.props.nextRetryAt = null;
    } else {
      this.props.status = 'retrying';
      const delay = retryIntervalMs * Math.pow(backoffMultiplier, this.props.attempts - 1);
      this.props.nextRetryAt = new Date(Date.now() + delay);
    }
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
