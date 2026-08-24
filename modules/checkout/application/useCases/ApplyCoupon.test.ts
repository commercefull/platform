/**
 * Unit Tests for ApplyCoupon Use Case
 */

import { ApplyCouponUseCase, ApplyCouponCommand } from './ApplyCoupon';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { Money } from '../../../../libs/money';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

import type { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import type { DiscountQuotePort, DiscountQuoteResult } from '../../application/ports/DiscountQuotePort';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createMockCheckoutRepo(session: CheckoutSession | null = null): jest.Mocked<CheckoutRepository> {
  return {
    findById: jest.fn().mockResolvedValue(session),
    findByBasketId: jest.fn().mockResolvedValue(null),
    findActiveByCustomerId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(session),
    delete: jest.fn().mockResolvedValue(undefined),
    findExpiredSessions: jest.fn().mockResolvedValue([]),
    markAsAbandoned: jest.fn().mockResolvedValue(undefined),
    getAvailableShippingMethods: jest.fn().mockResolvedValue([]),
    getAvailablePaymentMethods: jest.fn().mockResolvedValue([]),
    validateShippingAddress: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
    calculateTax: jest.fn().mockResolvedValue(0),
    findByPaymentIntentId: jest.fn().mockResolvedValue(null),
  } as never as jest.Mocked<CheckoutRepository>;
}

function createMockDiscountPort(result: DiscountQuoteResult): jest.Mocked<DiscountQuotePort> {
  return {
    validateDiscount: jest.fn().mockResolvedValue(result),
  } as never as jest.Mocked<DiscountQuotePort>;
}

describe('ApplyCouponUseCase', () => {
  it('should apply a valid coupon to a checkout session', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    session.updateAmounts(Money.create(100, 'USD'), Money.zero('USD'));
    const repo = createMockCheckoutRepo(session);
    const discountPort = createMockDiscountPort({
      valid: true,
      discount: { code: 'SAVE10', discountAmount: 10 },
    });
    const useCase = new ApplyCouponUseCase(repo, discountPort);

    const result = await useCase.execute(new ApplyCouponCommand('cs-1', 'SAVE10'));

    expect(result.checkoutId).toBe('cs-1');
    expect(result.couponCode).toBe('SAVE10');
    expect(result.discountAmount).toBe(10);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw NotFoundError when checkout session does not exist', async () => {
    const repo = createMockCheckoutRepo(null);
    const discountPort = createMockDiscountPort({ valid: true });
    const useCase = new ApplyCouponUseCase(repo, discountPort);

    await expect(
      useCase.execute(new ApplyCouponCommand('nonexistent', 'SAVE10')),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when discount port is not available', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    const repo = createMockCheckoutRepo(session);
    const useCase = new ApplyCouponUseCase(repo);

    await expect(
      useCase.execute(new ApplyCouponCommand('cs-1', 'SAVE10')),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when coupon is invalid', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    const repo = createMockCheckoutRepo(session);
    const discountPort = createMockDiscountPort({
      valid: false,
      error: 'Coupon expired',
    });
    const useCase = new ApplyCouponUseCase(repo, discountPort);

    await expect(
      useCase.execute(new ApplyCouponCommand('cs-1', 'EXPIRED')),
    ).rejects.toThrow(BadRequestError);
  });
});
