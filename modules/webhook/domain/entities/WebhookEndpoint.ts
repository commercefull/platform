/**
 * Webhook Endpoint Entity (Aggregate Root)
 *
 * Represents a registered webhook endpoint that receives event notifications.
 */

import { randomBytes } from 'crypto';

export interface WebhookEndpointProps {
  webhookEndpointId: string;
  merchantId: string | null;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  headers: Record<string, string> | null;
  retryPolicy: {
    maxRetries: number;
    retryIntervalMs: number;
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookEndpointEntity {
  private props: WebhookEndpointProps;

  private constructor(props: WebhookEndpointProps) {
    this.props = props;
  }

  static create(props: {
    webhookEndpointId: string;
    name: string;
    url: string;
    events: string[];
    merchantId?: string;
    headers?: Record<string, string>;
    retryPolicy?: Partial<WebhookEndpointProps['retryPolicy']>;
  }): WebhookEndpointEntity {
    const now = new Date();
    return new WebhookEndpointEntity({
      webhookEndpointId: props.webhookEndpointId,
      merchantId: props.merchantId || null,
      name: props.name,
      url: props.url,
      secret: randomBytes(32).toString('hex'),
      events: props.events,
      isActive: true,
      headers: props.headers || null,
      retryPolicy: {
        maxRetries: props.retryPolicy?.maxRetries ?? 5,
        retryIntervalMs: props.retryPolicy?.retryIntervalMs ?? 5000,
        backoffMultiplier: props.retryPolicy?.backoffMultiplier ?? 2,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: WebhookEndpointProps): WebhookEndpointEntity {
    return new WebhookEndpointEntity(props);
  }

  // Getters
  get webhookEndpointId(): string { return this.props.webhookEndpointId; }
  get merchantId(): string | null { return this.props.merchantId; }
  get name(): string { return this.props.name; }
  get url(): string { return this.props.url; }
  get secret(): string { return this.props.secret; }
  get events(): string[] { return this.props.events; }
  get isActive(): boolean { return this.props.isActive; }
  get headers(): Record<string, string> | null { return this.props.headers; }
  get retryPolicy(): WebhookEndpointProps['retryPolicy'] { return this.props.retryPolicy; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Domain methods
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updateEvents(events: string[]): void {
    this.props.events = events;
    this.touch();
  }

  updateUrl(url: string): void {
    this.props.url = url;
    this.touch();
  }

  updateName(name: string): void {
    this.props.name = name;
    this.touch();
  }

  updateHeaders(headers: Record<string, string> | null): void {
    this.props.headers = headers;
    this.touch();
  }

  regenerateSecret(): string {
    this.props.secret = randomBytes(32).toString('hex');
    this.touch();
    return this.props.secret;
  }

  subscribesToEvent(eventType: string): boolean {
    if (this.props.events.includes('*')) return true;
    if (this.props.events.includes(eventType)) return true;
    // Check wildcard category match: "product.*"
    const category = eventType.split('.')[0];
    return this.props.events.includes(`${category}.*`);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      webhookEndpointId: this.props.webhookEndpointId,
      merchantId: this.props.merchantId,
      name: this.props.name,
      url: this.props.url,
      events: this.props.events,
      isActive: this.props.isActive,
      headers: this.props.headers,
      retryPolicy: this.props.retryPolicy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
