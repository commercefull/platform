/**
 * Shared test helpers for the loyalty module.
 * Boundary mocks (event bus) + lazily-created typed repository mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { LoyaltyTier, LoyaltyPoints, LoyaltyReward, LoyaltyRedemption } from '../../../libs/db/types';
import type { CheckPointsBalanceUseCase } from '../application/useCases/CheckPointsBalance';
import type { CreateRewardUseCase } from '../application/useCases/CreateReward';
import type { RedeemPointsUseCase } from '../application/useCases/RedeemPoints';
import type { ManageLoyaltyAdminUseCase } from '../application/useCases/ManageLoyaltyAdmin';
import type { ManageStorefrontLoyaltyUseCase } from '../application/useCases/ManageStorefrontLoyalty';

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

export function createLoyaltyAdminRepository(): jest.Mocked<ConstructorParameters<typeof ManageLoyaltyAdminUseCase>[0]> {
  return lazyMock();
}

export function createStorefrontLoyaltyRepositories(): {
  storefrontLoyaltyRepository: jest.Mocked<ConstructorParameters<typeof ManageStorefrontLoyaltyUseCase>[0]>;
  loyaltyPointsRepository: jest.Mocked<ConstructorParameters<typeof ManageStorefrontLoyaltyUseCase>[1]>;
} {
  return { storefrontLoyaltyRepository: lazyMock(), loyaltyPointsRepository: lazyMock() };
}

export function createPointsBalanceRepository(): jest.Mocked<ConstructorParameters<typeof CheckPointsBalanceUseCase>[0]> {
  return lazyMock();
}

export function createRewardRepository(): jest.Mocked<ConstructorParameters<typeof CreateRewardUseCase>[0]> {
  return lazyMock();
}

export function createRedeemPointsRepositories(): {
  loyaltyRepository: jest.Mocked<ConstructorParameters<typeof RedeemPointsUseCase>[0]>;
  rewardRepository: jest.Mocked<ConstructorParameters<typeof RedeemPointsUseCase>[1]>;
} {
  return { loyaltyRepository: lazyMock(), rewardRepository: lazyMock() };
}

// ---------------------------------------------------------------------------
// Domain row factories (libs/db/types shapes with Partial overrides)
// ---------------------------------------------------------------------------

export function createLoyaltyTier(overrides: Partial<LoyaltyTier> = {}): LoyaltyTier {
  return {
    tierId: 'tier-1',
    programId: 'prog-1',
    name: 'Silver',
    description: null,
    level: 1,
    pointsThreshold: 500,
    purchasesThreshold: 5,
    pointsMultiplier: '1.2',
    benefits: [],
    iconUrl: null,
    color: null,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createLoyaltyPoints(overrides: Partial<LoyaltyPoints> = {}): LoyaltyPoints {
  return {
    loyaltyPointsId: 'lp-1',
    customerId: 'cust-1',
    tierId: 'tier-1',
    currentPoints: 500,
    lifetimePoints: 1000,
    lastActivity: new Date('2024-01-01'),
    expiryDate: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createLoyaltyReward(overrides: Partial<LoyaltyReward> = {}): LoyaltyReward {
  return {
    rewardId: 'rwd-1',
    programId: 'prog-1',
    name: '10% Off',
    description: null,
    type: 'discount',
    pointsCost: 100,
    value: '10',
    valueType: 'percentage',
    productId: null,
    categoryId: null,
    minOrderValueCents: null,
    maxUsagePerCustomer: null,
    totalQuantity: null,
    remainingQuantity: null,
    redemptionExpiryDays: null,
    validFrom: null,
    validTo: null,
    isActive: true,
    metadata: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createLoyaltyRedemption(overrides: Partial<LoyaltyRedemption> = {}): LoyaltyRedemption {
  return {
    redemptionId: 'red-1',
    customerId: 'cust-1',
    rewardId: 'rwd-1',
    orderId: null,
    pointsSpent: 100,
    status: 'completed',
    couponCode: null,
    redeemedAt: new Date('2024-01-01'),
    expiresAt: null,
    usedAt: null,
    metadata: null,
    ...overrides,
  };
}
