/**
 * Unit Tests for ManageStorefrontSubscriptions Use Case
 */

import { createSubscriptionRepository } from '../../tests/testUtils';
import { ManageStorefrontSubscriptionsUseCase } from './ManageStorefrontSubscriptions';

describe('ManageStorefrontSubscriptionsUseCase', () => {
  let useCase: ManageStorefrontSubscriptionsUseCase;
  let subscriptionRepo: ReturnType<typeof createSubscriptionRepository>;

  beforeEach(() => {
    subscriptionRepo = createSubscriptionRepository();
    useCase = new ManageStorefrontSubscriptionsUseCase(subscriptionRepo);
  });

  it('should return active plans with their products', async () => {
    subscriptionRepo.findActivePlansWithProduct.mockResolvedValue([{ planId: 'plan-1' }]);

    const result = await useCase.findActivePlansWithProduct();

    expect(result).toHaveLength(1);
    expect(subscriptionRepo.findActivePlansWithProduct).toHaveBeenCalled();
  });

  it('should list the customer subscriptions with plans', async () => {
    subscriptionRepo.findByCustomerIdWithPlan.mockResolvedValue([{ id: 'sub-1' }]);

    const result = await useCase.findByCustomerIdWithPlan('cust-1');

    expect(subscriptionRepo.findByCustomerIdWithPlan).toHaveBeenCalledWith('cust-1');
    expect(result).toHaveLength(1);
  });

  it('should return the subscription with its plan when it belongs to the customer', async () => {
    subscriptionRepo.findByIdWithPlan.mockResolvedValue({ id: 'sub-1' });

    const result = await useCase.findByIdWithPlan('sub-1', 'cust-1');

    expect(subscriptionRepo.findByIdWithPlan).toHaveBeenCalledWith('sub-1', 'cust-1');
    expect(result).toEqual({ id: 'sub-1' });
  });

  it('should cancel the subscription through the storefront path', async () => {
    await useCase.cancelSubscription('sub-1', 'too expensive');

    expect(subscriptionRepo.cancelSubscriptionStorefront).toHaveBeenCalledWith('sub-1', 'too expensive');
  });

  it('should return the billing history', async () => {
    subscriptionRepo.findBillingHistory.mockResolvedValue([{ invoiceId: 'inv-1' }]);

    const result = await useCase.findBillingHistory('sub-1');

    expect(subscriptionRepo.findBillingHistory).toHaveBeenCalledWith('sub-1');
    expect(result).toHaveLength(1);
  });
});
