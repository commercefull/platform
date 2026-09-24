/**
 * Shared test utilities for coupon unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus, uuid) before the use cases under test are evaluated.
 * Tests use real domain objects — only the ports are mocked.
 */

import { Coupon, CouponProps } from '../domain/entities/Coupon';
import { eventBus } from '../../../libs/events/eventBus';
import type { CouponRepository } from '../domain/repositories/CouponRepository';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

export const COUPON_ID = 'coupon-1';

type CreateCouponInput = Parameters<typeof Coupon.create>[0];

export function createCoupon(overrides: Partial<CreateCouponInput> = {}): Coupon {
  return Coupon.create({
    couponId: COUPON_ID,
    code: 'SAVE10',
    name: 'Save 10%',
    type: 'percentage',
    value: 10,
    usageType: 'unlimited',
    createdBy: 'admin-1',
    ...overrides,
  });
}

export function reconstituteCoupon(overrides: Partial<CouponProps> = {}): Coupon {
  return Coupon.reconstitute({
    couponId: COUPON_ID,
    code: 'SAVE10',
    name: 'Save 10%',
    type: 'percentage',
    value: 10,
    usageType: 'unlimited',
    usageCount: 0,
    conditions: [],
    isActive: true,
    createdBy: 'admin-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

export function createCouponRepository(coupon: Coupon | null = null): jest.Mocked<CouponRepository> {
  const repository: jest.Mocked<CouponRepository> = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    recordUsage: jest.fn(),
    createRedemption: jest.fn(),
    incrementUsageCount: jest.fn(),
    getUsageHistory: jest.fn(),
    getCustomerUsageCount: jest.fn(),
    getActiveCoupons: jest.fn(),
    validateCouponCode: jest.fn(),
  };

  repository.findById.mockResolvedValue(coupon);
  repository.findByCode.mockResolvedValue(coupon);
  repository.findAll.mockResolvedValue({ data: [], total: 0, limit: 50, offset: 0, hasMore: false, length: 0 });
  repository.save.mockImplementation(c => Promise.resolve(c));
  repository.delete.mockResolvedValue(undefined);
  repository.recordUsage.mockResolvedValue({
    usageId: 'usage-1',
    couponId: coupon?.couponId ?? COUPON_ID,
    orderId: 'order-1',
    customerId: 'customer-1',
    discountAmountCents: 0,
    usedAt: new Date(),
  });
  repository.createRedemption.mockResolvedValue(undefined);
  repository.incrementUsageCount.mockResolvedValue(undefined);
  repository.getUsageHistory.mockResolvedValue([]);
  repository.getCustomerUsageCount.mockResolvedValue(0);
  repository.getActiveCoupons.mockResolvedValue(coupon ? [coupon] : []);
  repository.validateCouponCode.mockResolvedValue({ valid: false, error: 'Invalid coupon' });

  return repository;
}
