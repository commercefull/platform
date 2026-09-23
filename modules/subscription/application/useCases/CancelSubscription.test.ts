/**
 * Unit Tests for CancelSubscription Use Case
 */

import {
  emitMock,
  createCancelSubscriptionRepo,
  createCustomerSubscription,
  createSubscriptionProduct,
} from '../../tests/testUtils';
import { CancelSubscriptionUseCase, CancelSubscriptionCommand } from './CancelSubscription';

describe('CancelSubscriptionUseCase', () => {
  let useCase: CancelSubscriptionUseCase;
  let subscriptionRepo: ReturnType<typeof createCancelSubscriptionRepo>;

  const activeSubscription = createCustomerSubscription({ status: 'active' });

  beforeEach(() => {
    subscriptionRepo = createCancelSubscriptionRepo();
    subscriptionRepo.getCustomerSubscription.mockResolvedValue(activeSubscription);
    subscriptionRepo.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct());
    useCase = new CancelSubscriptionUseCase(subscriptionRepo);
  });

  it('should cancel immediately and emit subscription.cancelled when cancelImmediately is set', async () => {
    const cancelled = createCustomerSubscription({ status: 'cancelled' });
    subscriptionRepo.getCustomerSubscription.mockResolvedValueOnce(activeSubscription).mockResolvedValue(cancelled);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer', cancelImmediately: true }),
    );

    expect(result.success).toBe(true);
    expect(subscriptionRepo.cancelSubscription).toHaveBeenCalledWith('sub-1', undefined, 'customer', false);
    expect(emitMock).toHaveBeenCalledWith(
      'subscription.cancelled',
      expect.objectContaining({ customerSubscriptionId: 'sub-1', cancelImmediately: true }),
    );
    expect(result.message).toBe('Subscription cancelled immediately');
  });

  it('should cancel at period end when cancelImmediately is false', async () => {
    subscriptionRepo.getCustomerSubscription
      .mockResolvedValueOnce(activeSubscription)
      .mockResolvedValue(createCustomerSubscription({ cancelAtPeriodEnd: true }));

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer', reason: 'Too expensive' }),
    );

    expect(result.success).toBe(true);
    expect(subscriptionRepo.cancelSubscription).toHaveBeenCalledWith('sub-1', 'Too expensive', 'customer', true);
    expect(result.message).toBe('Subscription will be cancelled at the end of the current billing period');
  });

  it('should return a failure when the subscription ID is missing', async () => {
    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: '', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('subscription_id_required');
  });

  it('should return a failure when the subscription does not exist', async () => {
    subscriptionRepo.getCustomerSubscription.mockResolvedValue(null);

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'missing', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('subscription_not_found');
  });

  it('should return a failure when the subscription is already cancelled', async () => {
    subscriptionRepo.getCustomerSubscription.mockResolvedValue(createCustomerSubscription({ status: 'cancelled' }));

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('already_cancelled');
    expect(subscriptionRepo.cancelSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure when the product does not allow early cancellation and contract cycles remain', async () => {
    subscriptionRepo.getCustomerSubscription.mockResolvedValue(
      createCustomerSubscription({ subscriptionProductId: 'prod-1', contractCyclesRemaining: 3 }),
    );
    subscriptionRepo.getSubscriptionProduct.mockResolvedValue(createSubscriptionProduct({ allowEarlyCancel: false }));

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'customer' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('early_cancel_not_allowed');
    expect(subscriptionRepo.cancelSubscription).not.toHaveBeenCalled();
  });

  it('should return a failure when the repository throws', async () => {
    subscriptionRepo.cancelSubscription.mockRejectedValue(new Error('DB error'));

    const result = await useCase.execute(
      new CancelSubscriptionCommand({ customerSubscriptionId: 'sub-1', cancelledBy: 'admin' }),
    );

    expect(result.success).toBe(false);
    expect(result.errors).toContain('cancellation_failed');
  });
});
