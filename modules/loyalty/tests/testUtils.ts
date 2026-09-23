/**
 * Shared test helpers for the loyalty module.
 * Boundary mocks (event bus) + lazily-created typed repository mocks.
 */

import { eventBus } from '../../../libs/events/eventBus';
import type { LoyaltyTier, LoyaltyPoints, LoyaltyReward, LoyaltyRedemption } from '../../../libs/db/types';
import type { LoyaltyRepository } from '../domain/repositories/LoyaltyRepository';
import type { CalculateTierStatusUseCase } from '../application/useCases/CalculateTierStatus';
import type { CheckPointsBalanceUseCase } from '../application/useCases/CheckPointsBalance';
import type { CreateRewardUseCase } from '../application/useCases/CreateReward';
import type { EarnPointsUseCase } from '../application/useCases/EarnPoints';
import type { GetPointsHistoryUseCase } from '../application/useCases/GetPointsHistory';
import type { ProcessPointsExpirationUseCase } from '../application/useCases/ProcessPointsExpiration';
import type { RedeemPointsUseCase } from '../application/useCases/RedeemPoints';
import type { RedeemRewardUseCase } from '../application/useCases/RedeemReward';

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

export function createLoyaltyRepository(): jest.Mocked<LoyaltyRepository> {
  return lazyMock<LoyaltyRepository>();
}

export function createTierStatusRepository(): jest.Mocked<ConstructorParameters<typeof CalculateTierStatusUseCase>[0]> {
  return lazyMock();
}

export function createPointsBalanceRepository(): jest.Mocked<ConstructorParameters<typeof CheckPointsBalanceUseCase>[0]> {
  return lazyMock();
}

export function createRewardRepository(): jest.Mocked<ConstructorParameters<typeof CreateRewardUseCase>[0]> {
  return lazyMock();
}

export function createEarnPointsRepositories(): {
  loyaltyRepository: jest.Mocked<ConstructorParameters<typeof EarnPointsUseCase>[0]>;
  programRepository: jest.Mocked<ConstructorParameters<typeof EarnPointsUseCase>[1]>;
} {
  return { loyaltyRepository: lazyMock(), programRepository: lazyMock() };
}

export function createPointsHistoryRepository(): jest.Mocked<ConstructorParameters<typeof GetPointsHistoryUseCase>[0]> {
  return lazyMock();
}

export function createExpirationRepository(): jest.Mocked<
  ConstructorParameters<typeof ProcessPointsExpirationUseCase>[0]
> {
  return lazyMock();
}

export function createRedeemPointsRepositories(): {
  loyaltyRepository: jest.Mocked<ConstructorParameters<typeof RedeemPointsUseCase>[0]>;
  rewardRepository: jest.Mocked<ConstructorParameters<typeof RedeemPointsUseCase>[1]>;
} {
  return { loyaltyRepository: lazyMock(), rewardRepository: lazyMock() };
}

export function createRedeemRewardRepository(): jest.Mocked<ConstructorParameters<typeof RedeemRewardUseCase>[0]> {
  return lazyMock();
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
    minOrderValue: null,
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
