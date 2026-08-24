/**
 * Unit Tests for CancelSubscription Use Case
 */

jest.mock('../../infrastructure/repositories/subscriptionRepo', () => ({
  __esModule: true,
  getCustomerSubscription: jest.fn(),
  getSubscriptionProduct: jest.fn(),
  cancelSubscription: jest.fn(),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

import { CancelSubscriptionUseCase, CancelSubscriptionCommand } from './CancelSubscription';
import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';
import type { CustomerSubscription, SubscriptionProduct } from '../../infrastructure/repositories/subscriptionRepo';
import { eventBus } from '../../../../libs/events/eventBus';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;

  beforeEach(() => {
    useCase = new CancelSubscriptionUseCase();
    jest.mocked(subscriptionRepo.getCustomerSubscription).mockClear();
    jest.mocked(subscriptionRepo.getSubscriptionProduct).mockClear();
    jest.mocked(subscriptionRepo.cancelSubscription).mockClear();
    jest.mocked(eventBus.emit).mockClear();
  });

  it('should cancel an active subscription immediately', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription)
      .mockResolvedValueOnce({ customerSubscriptionId: 'sub-1', customerId: 'cust-1', status: 'active' } as never as CustomerSubscription)
      .mockResolvedValueOnce({ customerSubscriptionId: 'sub-1', customerId: 'cust-1', status: 'cancelled' } as never as CustomerSubscription);
    jest.mocked(subscriptionRepo.cancelSubscription).mockResolvedValue(undefined);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({
        customerSubscriptionId: 'sub-1',
        cancelledBy: 'customer',
        cancelImmediately: true,
        reason: 'Not needed',
      }),
    );

    expect(result.success).toBe(true);
    expect(result.subscription?.status).toBe('cancelled');
    expect(subscriptionRepo.cancelSubscription).toHaveBeenCalledWith('sub-1', 'Not needed', 'customer', false);
    expect(eventBus.emit).toHaveBeenCalledWith('subscription.cancelled', expect.objectContaining({
      customerSubscriptionId: 'sub-1',
      reason: 'Not needed',
    }));
  });

  it('should cancel at period end when cancelImmediately is false', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription)
      .mockResolvedValueOnce({ customerSubscriptionId: 'sub-1', customerId: 'cust-1', status: 'active' } as never as CustomerSubscription)
      .mockResolvedValueOnce({ customerSubscriptionId: 'sub-1', customerId: 'cust-1', status: 'active' } as never as CustomerSubscription);
    jest.mocked(subscriptionRepo.cancelSubscription).mockResolvedValue(undefined);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({
        customerSubscriptionId: 'sub-1',
        cancelledBy: 'customer',
        cancelImmediately: false,
      }),
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('end of the current billing period');
    expect(subscriptionRepo.cancelSubscription).toHaveBeenCalledWith('sub-1', undefined, 'customer', true);
  });

  it('should return error when subscription ID is missing', async () => {
    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: '', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('subscription_id_required');
  });

  it('should return error when subscription not found', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription).mockResolvedValue(null);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-x', cancelledBy: 'admin' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('subscription_not_found');
  });

  it('should return error when already cancelled', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription).mockResolvedValue({
      customerSubscriptionId: 'sub-1',
      status: 'cancelled',
    } as never as CustomerSubscription);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('already_cancelled');
  });

  it('should return error when early cancellation is not allowed', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription).mockResolvedValue({
      customerSubscriptionId: 'sub-1',
      status: 'active',
      subscriptionProductId: 'prod-1',
      contractCyclesRemaining: 3,
    } as never as CustomerSubscription);
    jest.mocked(subscriptionRepo.getSubscriptionProduct).mockResolvedValue({
      allowEarlyCancel: false,
    } as never as SubscriptionProduct);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('early_cancel_not_allowed');
  });

  it('should handle errors gracefully', async () => {
    jest.mocked(subscriptionRepo.getCustomerSubscription).mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('DB error');
  });
});
