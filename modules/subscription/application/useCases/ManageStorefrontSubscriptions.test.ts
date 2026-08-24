jest.mock('../../infrastructure/repositories/subscriptionRepo', () => ({
  findActivePlansWithProduct: jest.fn().mockResolvedValue([{ subscriptionPlanId: 'p1', product: {} }]),
  findByCustomerIdWithPlan: jest.fn().mockResolvedValue([{ customerSubscriptionId: 'sub1' }]),
  findByIdWithPlan: jest.fn().mockResolvedValue({ customerSubscriptionId: 'sub1', plan: {} }),
  findActiveByCustomerId: jest.fn().mockResolvedValue({ customerSubscriptionId: 'sub1' }),
  cancelSubscriptionStorefront: jest.fn().mockResolvedValue(true),
  findBillingHistory: jest.fn().mockResolvedValue([{ subscriptionOrderId: 'o1' }]),
}));

import { ManageStorefrontSubscriptionsUseCase } from './ManageStorefrontSubscriptions';

describe('ManageStorefrontSubscriptionsUseCase', () => {
  let useCase: ManageStorefrontSubscriptionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageStorefrontSubscriptionsUseCase();
  });

  it('should find active plans with product', async () => {
    const result = await useCase.findActivePlansWithProduct();
    expect(result).toHaveLength(1);
  });

  it('should find by customer ID with plan', async () => {
    const result = await useCase.findByCustomerIdWithPlan('c1');
    expect(result).toHaveLength(1);
  });

  it('should find by ID with plan', async () => {
    const result = await useCase.findByIdWithPlan('sub1', 'c1');
    expect((result as Record<string, unknown>)?.customerSubscriptionId).toBe('sub1');
  });

  it('should cancel subscription', async () => {
    const result = await useCase.cancelSubscription('sub1', 'not needed');
    expect(result).toBe(true);
  });

  it('should find billing history', async () => {
    const result = await useCase.findBillingHistory('sub1');
    expect(result).toHaveLength(1);
  });
});
