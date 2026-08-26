/**
 * Integration Entity (Aggregate Root)
 *
 * Represents a third-party service connection (e.g. Mailchimp, QuickBooks, Slack).
 */

export type IntegrationProvider =
  | 'mailchimp'
  | 'klaviyo'
  | 'hubspot'
  | 'sendgrid'
  | 'quickbooks'
  | 'xero'
  | 'stripe'
  | 'slack'
  | 'zapier'
  | 'custom'
  | string;

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface IntegrationProps {
  integrationId: string;
  organizationId: string;
  name: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  description: string | null;
  webhookUrl: string | null;
  config: Record<string, unknown>;
  lastSyncAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Integration {
  private props: IntegrationProps;

  private constructor(props: IntegrationProps) {
    this.props = props;
  }

  static create(params: {
    integrationId: string;
    organizationId: string;
    name: string;
    provider: IntegrationProvider;
    description?: string;
    webhookUrl?: string;
    config?: Record<string, unknown>;
  }): Integration {
    const now = new Date();
    return new Integration({
      integrationId: params.integrationId,
      organizationId: params.organizationId,
      name: params.name,
      provider: params.provider,
      status: 'pending',
      description: params.description ?? null,
      webhookUrl: params.webhookUrl ?? null,
      config: params.config ?? {},
      lastSyncAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: IntegrationProps): Integration {
    return new Integration(props);
  }

  get integrationId(): string { return this.props.integrationId; }
  get organizationId(): string { return this.props.organizationId; }
  get name(): string { return this.props.name; }
  get provider(): IntegrationProvider { return this.props.provider; }
  get status(): IntegrationStatus { return this.props.status; }
  get description(): string | null { return this.props.description; }
  get webhookUrl(): string | null { return this.props.webhookUrl; }
  get config(): Record<string, unknown> { return this.props.config; }
  get lastSyncAt(): Date | null { return this.props.lastSyncAt; }
  get lastError(): string | null { return this.props.lastError; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  activate(): void {
    this.props.status = 'active';
    this.props.lastError = null;
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'inactive';
    this.touch();
  }

  markError(message: string): void {
    this.props.status = 'error';
    this.props.lastError = message;
    this.touch();
  }

  markSynced(): void {
    this.props.lastSyncAt = new Date();
    this.props.lastError = null;
    if (this.props.status === 'error' || this.props.status === 'pending') {
      this.props.status = 'active';
    }
    this.touch();
  }

  updateName(name: string): void {
    this.props.name = name;
    this.touch();
  }

  updateDescription(description: string | null): void {
    this.props.description = description;
    this.touch();
  }

  updateWebhookUrl(url: string | null): void {
    this.props.webhookUrl = url;
    this.touch();
  }

  updateConfig(config: Record<string, unknown>): void {
    this.props.config = config;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      integrationId: this.props.integrationId,
      organizationId: this.props.organizationId,
      name: this.props.name,
      provider: this.props.provider,
      status: this.props.status,
      description: this.props.description,
      webhookUrl: this.props.webhookUrl,
      config: this.props.config,
      lastSyncAt: this.props.lastSyncAt,
      lastError: this.props.lastError,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
