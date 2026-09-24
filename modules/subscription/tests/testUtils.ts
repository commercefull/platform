/**
 * Shared test helpers for the subscription module.
 * Boundary mocks (event bus) + typed port mocks + domain record factories.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { SubscriptionRepository } from '../domain/repositories/SubscriptionRepository';
import type { SubscriptionProduct, SubscriptionPlan, CustomerSubscription } from '../domain/types';
import type { CreateSubscriptionRepoPort } from '../application/useCases/CreateSubscription';
import type { CancelSubscriptionRepoPort } from '../application/useCases/CancelSubscription';
import type { PauseSubscriptionUseCase } from '../application/useCases/PauseSubscription';
import type { ResumeSubscriptionUseCase } from '../application/useCases/ResumeSubscription';
import type { ProcessRenewalUseCase } from '../application/useCases/ProcessRenewal';
import type { ChangeSubscriptionPlanUseCase } from '../application/useCases/ChangeSubscriptionPlan';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

/**
 * A full `jest.Mocked<SubscriptionRepository>`: every accessed method is a
 * lazily-created `jest.fn`, so tests configure only the methods they exercise.
 */
export function createSubscriptionRepository(): jest.Mocked<SubscriptionRepository> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<SubscriptionRepository>;
}

export function createCreateSubscriptionRepo(): jest.Mocked<CreateSubscriptionRepoPort> {
  return {
    getSubscriptionPlan: jest.fn(),
    getSubscriptionProduct: jest.fn(),
    createCustomerSubscription: jest.fn(),
  };
}

export function createCancelSubscriptionRepo(): jest.Mocked<CancelSubscriptionRepoPort> {
  return {
    getCustomerSubscription: jest.fn(),
    getSubscriptionProduct: jest.fn(),
    cancelSubscription: jest.fn(),
  };
}

export function createPauseSubscriptionRepo(): jest.Mocked<ConstructorParameters<typeof PauseSubscriptionUseCase>[0]> {
  return {
    findById: jest.fn(),
    update: jest.fn(),
  };
}

export function createResumeSubscriptionRepo(): jest.Mocked<ConstructorParameters<typeof ResumeSubscriptionUseCase>[0]> {
  return {
    findById: jest.fn(),
    update: jest.fn(),
  };
}

export function createProcessRenewalPorts(): {
  subscriptionRepo: jest.Mocked<ConstructorParameters<typeof ProcessRenewalUseCase>[0]>;
  paymentService: jest.Mocked<ConstructorParameters<typeof ProcessRenewalUseCase>[1]>;
  invoiceService: jest.Mocked<ConstructorParameters<typeof ProcessRenewalUseCase>[2]>;
} {
  return {
    subscriptionRepo: { findById: jest.fn(), update: jest.fn() },
    paymentService: { charge: jest.fn() },
    invoiceService: { create: jest.fn() },
  };
}

export function createChangePlanPorts(): {
  subscriptionRepo: jest.Mocked<ConstructorParameters<typeof ChangeSubscriptionPlanUseCase>[0]>;
  planRepo: jest.Mocked<ConstructorParameters<typeof ChangeSubscriptionPlanUseCase>[1]>;
} {
  return {
    subscriptionRepo: { findById: jest.fn(), update: jest.fn() },
    planRepo: { findById: jest.fn() },
  };
}

export function createSubscriptionProduct(overrides: Partial<SubscriptionProduct> = {}): SubscriptionProduct {
  return {
    subscriptionProductId: 'prod-1',
    productId: 'p-1',
    isSubscriptionOnly: true,
    allowOneTimePurchase: false,
    trialDays: 0,
    trialRequiresPayment: false,
    billingAnchor: 'subscription_start',
    prorateOnChange: false,
    allowPause: true,
    allowSkip: true,
    allowEarlyCancel: true,
    cancelNoticeDays: 0,
    autoRenew: true,
    renewalReminderDays: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createSubscriptionPlan(overrides: Partial<SubscriptionPlan> = {}): SubscriptionPlan {
  return {
    subscriptionPlanId: 'plan-1',
    subscriptionProductId: 'prod-1',
    name: 'Monthly Box',
    billingInterval: 'month',
    billingIntervalCount: 1,
    priceCents: 2999,
    currency: 'USD',
    setupFeeCents: 0,
    isContractRequired: false,
    discountPercent: 0,
    discountAmountCents: 0,
    includesFreeShipping: false,
    sortOrder: 0,
    isPopular: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createCustomerSubscription(overrides: Partial<CustomerSubscription> = {}): CustomerSubscription {
  return {
    customerSubscriptionId: 'sub-1',
    customerId: 'cust-1',
    subscriptionPlanId: 'plan-1',
    status: 'active',
    quantity: 1,
    unitPriceCents: 29.99,
    discountAmountCents: 0,
    taxAmountCents: 0,
    totalPriceCents: 29.99,
    currency: 'USD',
    billingInterval: 'month',
    billingIntervalCount: 1,
    cancelAtPeriodEnd: false,
    pauseCount: 0,
    skipCount: 0,
    billingCycleCount: 1,
    lifetimeValue: 0,
    failedPaymentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as CustomerSubscription;
}
