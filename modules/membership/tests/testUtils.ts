/**
 * Shared test helpers for the membership module.
 * Boundary mocks (event bus) + lazily-created typed port mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { MembershipPlansPort } from '../application/useCases/ManageMembershipPlans';
import type { MembershipBenefitsPort, MembershipPlanBenefitsPort } from '../application/useCases/ManageMembershipBenefits';
import type { MembershipSubscriptionsPort } from '../application/useCases/ManageMembershipSubscriptions';
import type { MembershipAdminProgramsPort } from '../application/useCases/ManageMembershipPrograms';
import type { MembershipStorefrontPort } from '../application/useCases/ManageStorefrontMembership';
import type { AssignMembershipUseCase } from '../application/useCases/AssignMembership';
import type { CancelMembershipUseCase } from '../application/useCases/CancelMembership';
import type { CreateMembershipTierUseCase } from '../application/useCases/CreateMembershipTier';
import type { DowngradeMembershipUseCase } from '../application/useCases/DowngradeMembership';
import type { GetMembershipBenefitsUseCase } from '../application/useCases/GetMembershipBenefits';
import type { RenewMembershipUseCase } from '../application/useCases/RenewMembership';
import type { UpdateMembershipTierUseCase } from '../application/useCases/UpdateMembershipTier';
import type { UpgradeMembershipUseCase } from '../application/useCases/UpgradeMembership';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

/**
 * A lazily-created `jest.Mocked<T>`: every accessed method is a `jest.fn`,
 * so tests configure only the methods they exercise.
 */
function lazyMock<T>(): jest.Mocked<T> {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_target, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
}

export function createMembershipPlansPort(): jest.Mocked<MembershipPlansPort> {
  return lazyMock();
}

export function createMembershipBenefitsPorts(): {
  benefits: jest.Mocked<MembershipBenefitsPort>;
  planBenefits: jest.Mocked<MembershipPlanBenefitsPort>;
} {
  return { benefits: lazyMock(), planBenefits: lazyMock() };
}

export function createMembershipSubscriptionsPort(): jest.Mocked<MembershipSubscriptionsPort> {
  return lazyMock();
}

export function createAdminProgramsPort(): jest.Mocked<MembershipAdminProgramsPort> {
  return lazyMock();
}

export function createStorefrontMembershipPort(): jest.Mocked<MembershipStorefrontPort> {
  return lazyMock();
}

export function createAssignMembershipRepository(): jest.Mocked<ConstructorParameters<typeof AssignMembershipUseCase>[0]> {
  return lazyMock();
}

export function createCancelMembershipRepository(): jest.Mocked<ConstructorParameters<typeof CancelMembershipUseCase>[0]> {
  return lazyMock();
}

export function createMembershipTierRepository(): jest.Mocked<
  ConstructorParameters<typeof CreateMembershipTierUseCase>[0]
> {
  return lazyMock();
}

export function createDowngradeMembershipRepository(): jest.Mocked<
  ConstructorParameters<typeof DowngradeMembershipUseCase>[0]
> {
  return lazyMock();
}

export function createBenefitsRepository(): jest.Mocked<ConstructorParameters<typeof GetMembershipBenefitsUseCase>[0]> {
  return lazyMock();
}

export function createRenewMembershipRepository(): jest.Mocked<ConstructorParameters<typeof RenewMembershipUseCase>[0]> {
  return lazyMock();
}

export function createUpdateTierRepository(): jest.Mocked<ConstructorParameters<typeof UpdateMembershipTierUseCase>[0]> {
  return lazyMock();
}

export function createUpgradeMembershipRepository(): jest.Mocked<
  ConstructorParameters<typeof UpgradeMembershipUseCase>[0]
> {
  return lazyMock();
}

// ---------------------------------------------------------------------------
// Domain row factories
// ---------------------------------------------------------------------------

import type { MembershipBenefit, MembershipSubscription } from '../../../libs/db/types';
import type { MembershipPlan, MembershipPlanBenefit } from '../domain/repositories/MembershipRepository';

export function createMembershipPlan(overrides: Partial<MembershipPlan> = {}): MembershipPlan {
  return {
    membershipPlanId: 'plan-1',
    name: 'Gold',
    code: 'GOLD',
    description: null,
    shortDescription: null,
    isActive: true,
    isPublic: true,
    isDefault: false,
    priority: 1,
    level: 2,
    trialDays: 0,
    priceCents: 50,
    salePriceCents: null,
    setupFeeCents: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    billingPeriod: 1,
    maxMembers: null,
    autoRenew: true,
    duration: null,
    gracePeriodsAllowed: 0,
    gracePeriodDays: 0,
    membershipImage: null,
    publicDetails: null,
    privateMeta: null,
    visibilityRules: null,
    availabilityRules: null,
    customFields: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: null,
    ...overrides,
  };
}

export function createMembershipBenefit(overrides: Partial<MembershipBenefit> = {}): MembershipBenefit {
  return {
    membershipBenefitId: 'benefit-1',
    name: 'Free shipping',
    code: 'FREE_SHIP',
    description: null,
    shortDescription: null,
    isActive: true,
    priority: 1,
    benefitType: 'shipping',
    valueType: 'boolean',
    value: true,
    icon: null,
    rules: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: null,
    ...overrides,
  };
}

export function createMembershipPlanBenefit(overrides: Partial<MembershipPlanBenefit> = {}): MembershipPlanBenefit {
  return {
    membershipPlanBenefitId: 'mpb-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    planId: 'plan-1',
    benefitId: 'benefit-1',
    isActive: true,
    priority: 1,
    ...overrides,
  };
}

export function createMembershipSubscription(overrides: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    membershipSubscriptionId: 'sub-1',
    customerId: 'cust-1',
    membershipPlanId: 'plan-1',
    status: 'active',
    membershipNumber: null,
    startDate: new Date('2024-01-01'),
    endDate: null,
    trialEndDate: null,
    nextBillingDate: null,
    lastBillingDate: null,
    cancelledAt: null,
    cancelReason: null,
    isAutoRenew: true,
    priceOverrideCents: null,
    billingCycleOverride: null,
    paymentMethodId: null,
    notes: null,
    createdBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}
