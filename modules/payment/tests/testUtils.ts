/**
 * Shared test utilities for payment use-case tests.
 * Mocks module boundaries (eventBus, uuid, libs/db, logger) once and
 * provides typed lazy port mocks plus factories for the libs/db/types
 * rows the payment ports return.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { generateUUID } from '../../../libs/uuid';
import type { PaymentGateway, PaymentMethodConfig, PaymentTransaction } from '../../../libs/db/types';
import type { PaymentBalance } from '../domain/repositories/PaymentBalanceRepository';
import type { PaymentDispute } from '../domain/repositories/PaymentDisputeRepository';
import type { PaymentFee } from '../domain/repositories/PaymentFeeRepository';
import type { PaymentReport } from '../domain/repositories/PaymentReportRepository';
import type { PaymentSettings } from '../domain/repositories/PaymentSettingsRepository';
import type { PaymentWebhook } from '../domain/repositories/PaymentWebhookRepository';
import type { StoredPaymentMethod } from '../domain/repositories/StoredPaymentMethodRepository';
import type { PSPRoutingRepository } from '../domain/repositories/PSPRoutingRepository';
import { PSPRoute } from '../domain/entities/PSPRoute';

jest.mock('../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn(), registerHandler: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'payment-uuid-123'),
  isUuid: jest.fn(() => true),
}));

jest.mock('../../../libs/logger', () => ({
  logger: { warn: jest.fn(), warning: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../../libs/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn(async (fn: (client?: unknown) => Promise<unknown>) => fn()),
}));

export const emitMock = jest.mocked(eventBus.emit);
export const uuidMock = jest.mocked(generateUUID);

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

const now = new Date('2024-01-01T00:00:00.000Z');

export function createPSPRoutingRepository(): jest.Mocked<PSPRoutingRepository> {
  return lazyMock<PSPRoutingRepository>();
}

export function createPSPRoute(overrides: Partial<Parameters<typeof PSPRoute.create>[0]> = {}): PSPRoute {
  return PSPRoute.create({
    routeId: 'route-1',
    organizationId: 'org-1',
    provider: 'stripe',
    priority: 1,
    apiKey: 'sk_test_123',
    webhookSecret: 'whsec_123',
    testMode: true,
    ...overrides,
  });
}

// ============================================================================
// Record factories
// ============================================================================

export function createPaymentGateway(overrides: Partial<PaymentGateway> = {}): PaymentGateway {
  return {
    paymentGatewayId: 'gw-1',
    createdAt: now,
    updatedAt: now,
    organizationId: 'org-1',
    name: 'Stripe',
    provider: 'stripe',
    isActive: true,
    isDefault: false,
    isTestMode: true,
    apiKey: null,
    apiSecret: null,
    publicKey: null,
    webhookSecret: null,
    apiEndpoint: null,
    supportedPaymentMethods: 'card',
    supportedCurrencies: ['USD'],
    processingFees: null,
    checkoutSettings: null,
    metadata: null,
    deletedAt: null,
    ...overrides,
  };
}

export function createPaymentMethodConfig(overrides: Partial<PaymentMethodConfig> = {}): PaymentMethodConfig {
  return {
    paymentMethodConfigId: 'cfg-1',
    createdAt: now,
    updatedAt: now,
    organizationId: 'org-1',
    paymentMethod: 'card',
    isEnabled: true,
    displayName: 'Card',
    description: null,
    processingFeeCents: null,
    minimumAmountCents: null,
    maximumAmountCents: null,
    displayOrder: 0,
    icon: null,
    supportedCurrencies: ['USD'],
    countries: null,
    gatewayId: null,
    configuration: null,
    metadata: null,
    deletedAt: null,
    ...overrides,
  };
}

export function createPaymentTransaction(overrides: Partial<PaymentTransaction> = {}): PaymentTransaction {
  return {
    paymentTransactionId: 'txn-1',
    createdAt: now,
    updatedAt: now,
    organizationId: 'org-1',
    orderId: null,
    customerId: null,
    amountCents: '100',
    currencyCode: 'USD',
    status: 'succeeded',
    type: 'charge',
    provider: 'stripe',
    gatewayId: null,
    externalTransactionId: null,
    paymentMethod: null,
    metadata: null,
    ...overrides,
  } as PaymentTransaction;
}

export function createPaymentBalance(overrides: Partial<PaymentBalance> = {}): PaymentBalance {
  return {
    paymentBalanceId: 'bal-1',
    organizationId: 'org-1',
    currency: 'USD',
    amountCents: 1000,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createPaymentDispute(overrides: Partial<PaymentDispute> = {}): PaymentDispute {
  return {
    paymentDisputeId: 'disp-1',
    paymentId: 'p1',
    organizationId: 'org-1',
    status: 'open',
    reason: 'fraudulent',
    amountCents: 100,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createPaymentFee(overrides: Partial<PaymentFee> = {}): PaymentFee {
  return {
    paymentFeeId: 'fee-1',
    transactionId: 't1',
    organizationId: 'org-1',
    type: 'processing',
    amountCents: 3,
    currency: 'USD',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createPaymentReport(overrides: Partial<PaymentReport> = {}): PaymentReport {
  return {
    paymentReportId: 'rep-1',
    organizationId: 'org-1',
    type: 'monthly',
    currency: 'USD',
    totalAmountCents: 5000,
    transactionCount: 100,
    periodStart: now,
    periodEnd: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createPaymentSettings(overrides: Partial<PaymentSettings> = {}): PaymentSettings {
  return {
    paymentSettingsId: 'set-1',
    organizationId: 'org-1',
    capturePaymentsAutomatically: true,
    authorizationValidityPeriod: 7,
    cardVaultingEnabled: true,
    allowGuestCheckout: true,
    requireBillingAddress: false,
    requireCvv: true,
    requirePostalCodeVerification: false,
    autoRefundOnCancel: true,
    paymentAttemptLimit: 3,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createPaymentWebhook(overrides: Partial<PaymentWebhook> = {}): PaymentWebhook {
  return {
    paymentWebhookId: 'wh-1',
    externalId: 'ext-1',
    provider: 'stripe',
    eventType: 'payment.succeeded',
    payload: {},
    processedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createStoredPaymentMethod(overrides: Partial<StoredPaymentMethod> = {}): StoredPaymentMethod {
  return {
    storedPaymentMethodId: 'spm-1',
    customerId: 'cust-1',
    type: 'card',
    provider: 'stripe',
    providerToken: 'tok-1',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2030,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
