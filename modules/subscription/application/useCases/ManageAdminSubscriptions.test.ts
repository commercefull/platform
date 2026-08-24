jest.mock('../../infrastructure/repositories/subscriptionRepo', () => ({
  getSubscriptionPlan: jest.fn().mockResolvedValue({ subscriptionPlanId: 'p1' }),
  getSubscriptionPlans: jest.fn().mockResolvedValue([{ subscriptionPlanId: 'p1' }]),
  saveSubscriptionPlan: jest.fn().mockResolvedValue({ subscriptionPlanId: 'p2' }),
  deleteSubscriptionPlan: jest.fn().mockResolvedValue(true),
  getCustomerSubscriptions: jest.fn().mockResolvedValue([{ customerSubscriptionId: 'sub1' }]),
  updateSubscriptionStatus: jest.fn().mockResolvedValue(true),
  cancelSubscription: jest.fn().mockResolvedValue(true),
  getSubscriptionOrders: jest.fn().mockResolvedValue([{ subscriptionOrderId: 'o1' }]),
  getCustomerSubscription: jest.fn().mockResolvedValue({ customerSubscriptionId: 'sub1' }),
  pauseSubscription: jest.fn().mockResolvedValue(true),
  getSubscriptionsDueBilling: jest.fn().mockResolvedValue([{ customerSubscriptionId: 'sub1' }]),
  getSubscriptionOrdersPending: jest.fn().mockResolvedValue([]),
  getFailedSubscriptionPayments: jest.fn().mockResolvedValue([]),
  advanceBillingCycle: jest.fn().mockResolvedValue(true),
  createDunningAttempt: jest.fn().mockResolvedValue({ dunningAttemptId: 'd1' }),
  createSubscriptionOrder: jest.fn().mockResolvedValue({ subscriptionOrderId: 'o2' }),
  updateSubscriptionOrderStatus: jest.fn().mockResolvedValue(true),
}));

import { ManageAdminSubscriptionsUseCase } from './ManageAdminSubscriptions';

describe('ManageAdminSubscriptionsUseCase', () => {
  let useCase: ManageAdminSubscriptionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageAdminSubscriptionsUseCase();
  });

  it('should get subscription plan', async () => {
    const result = await useCase.getSubscriptionPlan('p1');
    expect(result).toEqual({ subscriptionPlanId: 'p1' });
  });

  it('should get subscription plans', async () => {
    const result = await useCase.getSubscriptionPlans({ active: true } as never);
    expect(result).toHaveLength(1);
  });

  it('should save subscription plan', async () => {
    const result = await useCase.saveSubscriptionPlan({ name: 'Pro' } as never);
    expect(result).toEqual({ subscriptionPlanId: 'p2' });
  });

  it('should cancel subscription', async () => {
    const result = await useCase.cancelSubscription('sub1', 'user requested');
    expect(result).toBe(true);
  });

  it('should advance billing cycle', async () => {
    const result = await useCase.advanceBillingCycle('sub1');
    expect(result).toBe(true);
  });
});
