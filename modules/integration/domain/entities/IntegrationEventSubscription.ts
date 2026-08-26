/**
 * IntegrationEventSubscription Entity
 *
 * Maps a platform event to a third-party action.
 * When the specified event fires, the dispatcher sends transformed data
 * to the integration's endpoint.
 */

export type SubscriptionStatus = 'active' | 'inactive' | 'paused';

export interface IntegrationEventSubscriptionProps {
  subscriptionId: string;
  integrationId: string;
  eventType: string;
  targetAction: string;
  description: string | null;
  payloadMapping: Record<string, unknown>;
  headers: Record<string, string> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationEventSubscription {
  private props: IntegrationEventSubscriptionProps;

  private constructor(props: IntegrationEventSubscriptionProps) {
    this.props = props;
  }

  static create(params: {
    subscriptionId: string;
    integrationId: string;
    eventType: string;
    targetAction: string;
    description?: string;
    payloadMapping?: Record<string, unknown>;
    headers?: Record<string, string>;
  }): IntegrationEventSubscription {
    const now = new Date();
    return new IntegrationEventSubscription({
      subscriptionId: params.subscriptionId,
      integrationId: params.integrationId,
      eventType: params.eventType,
      targetAction: params.targetAction,
      description: params.description ?? null,
      payloadMapping: params.payloadMapping ?? {},
      headers: params.headers ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: IntegrationEventSubscriptionProps): IntegrationEventSubscription {
    return new IntegrationEventSubscription(props);
  }

  get subscriptionId(): string { return this.props.subscriptionId; }
  get integrationId(): string { return this.props.integrationId; }
  get eventType(): string { return this.props.eventType; }
  get targetAction(): string { return this.props.targetAction; }
  get description(): string | null { return this.props.description; }
  get payloadMapping(): Record<string, unknown> { return this.props.payloadMapping; }
  get headers(): Record<string, string> | null { return this.props.headers; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  updateTargetAction(action: string): void {
    this.props.targetAction = action;
    this.touch();
  }

  updatePayloadMapping(mapping: Record<string, unknown>): void {
    this.props.payloadMapping = mapping;
    this.touch();
  }

  updateHeaders(headers: Record<string, string> | null): void {
    this.props.headers = headers;
    this.touch();
  }

  subscribesToEvent(eventType: string): boolean {
    if (this.props.eventType === '*') return true;
    if (this.props.eventType === eventType) return true;
    const category = eventType.split('.')[0];
    return this.props.eventType === `${category}.*`;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      subscriptionId: this.props.subscriptionId,
      integrationId: this.props.integrationId,
      eventType: this.props.eventType,
      targetAction: this.props.targetAction,
      description: this.props.description,
      payloadMapping: this.props.payloadMapping,
      headers: this.props.headers,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
