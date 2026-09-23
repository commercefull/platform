/**
 * Unit Tests for ManageAdminSubscriptions Use Case
 */

import {
  createSubscriptionRepository,
  createSubscriptionPlan,
  createCustomerSubscription,
} from '../../tests/testUtils';
import { ManageAdminSubscriptionsUseCase } from './ManageAdminSubscriptions';

describe('ManageAdminSubscriptionsUseCase', () => {
  let useCase: ManageAdminSubscriptionsUseCase;
  let subscriptionRepo: ReturnType<typeof createSubscriptionRepository>;

  beforeEach(() => {
    subscriptionRepo = createSubscriptionRepository();
    useCase = new ManageAdminSubscriptionsUseCase(subscriptionRepo);
  });

  it('should return the subscription plan when it exists', async () => {
    subscriptionRepo.getSubscriptionPlan.mockResolvedValue(createSubscriptionPlan());

    const result = await useCase.getSubscriptionPlan('plan-1');

    expect(result?.name).toBe('Monthly Box');
    expect(subscriptionRepo.getSubscriptionPlan).toHaveBeenCalledWith('plan-1');
  });

  it('should list plans for a product', async () => {
    subscriptionRepo.getSubscriptionPlans.mockResolvedValue([createSubscriptionPlan()]);

    const result = await useCase.getSubscriptionPlans('prod-1', true);

    expect(subscriptionRepo.getSubscriptionPlans).toHaveBeenCalledWith('prod-1', true);
    expect(result).toHaveLength(1);
  });

  it('should save a subscription plan', async () => {
    const plan = createSubscriptionPlan();
    subscriptionRepo.saveSubscriptionPlan.mockResolvedValue(plan);

    const result = await useCase.saveSubscriptionPlan({ subscriptionPlanId: 'plan-1', name: 'Monthly Box' });

    expect(subscriptionRepo.saveSubscriptionPlan).toHaveBeenCalledWith({ subscriptionPlanId: 'plan-1', name: 'Monthly Box' });
    expect(result).toBe(plan);
  });

  it('should cancel a subscription through the admin path', async () => {
    await useCase.cancelSubscription('sub-1', 'fraud', 'admin-1', false);

    expect(subscriptionRepo.cancelSubscription).toHaveBeenCalledWith('sub-1', 'fraud', 'admin-1', false);
  });

  it('should advance the billing cycle', async () => {
    await useCase.advanceBillingCycle('sub-1');

    expect(subscriptionRepo.advanceBillingCycle).toHaveBeenCalledWith('sub-1');
  });

  it('should update the subscription status', async () => {
    await useCase.updateSubscriptionStatus('sub-1', 'active');

    expect(subscriptionRepo.updateSubscriptionStatus).toHaveBeenCalledWith('sub-1', 'active');
  });

  it('should list subscriptions due for billing', async () => {
    subscriptionRepo.getSubscriptionsDueBilling.mockResolvedValue([createCustomerSubscription()]);
    const before = new Date('2030-01-01');

    const result = await useCase.getSubscriptionsDueBilling(before);

    expect(subscriptionRepo.getSubscriptionsDueBilling).toHaveBeenCalledWith(before);
    expect(result).toHaveLength(1);
  });
});
