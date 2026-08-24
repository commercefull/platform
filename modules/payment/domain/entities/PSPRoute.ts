/**
 * PSP Route Configuration Entity
 *
 * Represents a payment provider route in the failover chain.
 * Stored in the paymentGateway table with priority, config, and capabilities.
 */

import { PaymentValidationError } from '../errors/PaymentErrors';

export interface PSPRouteConfig {
  routeId: string;
  organizationId: string;
  provider: string;
  priority: number;
  isActive: boolean;
  config: {
    apiKey: string;
    publishableKey?: string;
    webhookSecret: string;
    testMode: boolean;
    merchantAccount?: string;
    extra?: Record<string, unknown>;
  };
  capabilities?: {
    supportsAuthCapture: boolean;
    supportsPartialCapture: boolean;
    supportsPartialRefund: boolean;
    supportsVoid: boolean;
    requiresRedirect: boolean;
    supportsTokenization: boolean;
    supportsWebhooks: boolean;
    supportedCurrencies: string[];
    supportedCountries: string[];
    minAmount?: number;
    maxAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class PSPRoute {
  private props: PSPRouteConfig;

  private constructor(props: PSPRouteConfig) {
    this.props = props;
  }

  static create(props: {
    routeId: string;
    organizationId: string;
    provider: string;
    priority: number;
    apiKey: string;
    publishableKey?: string;
    webhookSecret: string;
    testMode: boolean;
    merchantAccount?: string;
    extra?: Record<string, unknown>;
  }): PSPRoute {
    const now = new Date();
    return new PSPRoute({
      routeId: props.routeId,
      organizationId: props.organizationId,
      provider: props.provider,
      priority: props.priority,
      isActive: true,
      config: {
        apiKey: props.apiKey,
        publishableKey: props.publishableKey,
        webhookSecret: props.webhookSecret,
        testMode: props.testMode,
        merchantAccount: props.merchantAccount,
        extra: props.extra,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PSPRouteConfig): PSPRoute {
    return new PSPRoute(props);
  }

  get routeId(): string { return this.props.routeId; }
  get organizationId(): string { return this.props.organizationId; }
  get provider(): string { return this.props.provider; }
  get priority(): number { return this.props.priority; }
  get isActive(): boolean { return this.props.isActive; }
  get config(): PSPRouteConfig['config'] { return this.props.config; }
  get capabilities(): PSPRouteConfig['capabilities'] { return this.props.capabilities; }
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

  updatePriority(priority: number): void {
    if (priority < 1) throw new PaymentValidationError('Priority must be >= 1');
    this.props.priority = priority;
    this.touch();
  }

  updateConfig(updates: Partial<PSPRouteConfig['config']>): void {
    this.props.config = { ...this.props.config, ...updates };
    this.touch();
  }

  supportsCurrency(currency: string): boolean {
    const caps = this.props.capabilities;
    if (!caps || caps.supportedCurrencies.length === 0) return true;
    return caps.supportedCurrencies.includes(currency.toUpperCase());
  }

  supportsAmount(amount: number): boolean {
    const caps = this.props.capabilities;
    if (!caps) return true;
    if (caps.minAmount !== undefined && amount < caps.minAmount) return false;
    if (caps.maxAmount !== undefined && amount > caps.maxAmount) return false;
    return true;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      routeId: this.props.routeId,
      organizationId: this.props.organizationId,
      provider: this.props.provider,
      priority: this.props.priority,
      isActive: this.props.isActive,
      config: {
        ...this.props.config,
        apiKey: '[REDACTED]',
        webhookSecret: '[REDACTED]',
      },
      capabilities: this.props.capabilities,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
