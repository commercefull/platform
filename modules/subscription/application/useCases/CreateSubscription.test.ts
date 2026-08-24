jest.mock('../../infrastructure/repositories/subscriptionRepo', () => ({
  getSubscriptionPlan: jest.fn().mockResolvedValue({
    subscriptionPlanId: 'p1', subscriptionProductId: 'sp1', price: 50,
    isActive: true, billingInterval: 'month', billingIntervalCount: 1,
    discountAmount: 0, trialDays: 14,
  }),
  getSubscriptionProduct: jest.fn().mockResolvedValue({
    subscriptionProductId: 'sp1', isActive: true, trialDays: 0,
  }),
  createCustomerSubscription: jest.fn().mockResolvedValue({
    customerSubscriptionId: 'sub1', customerId: 'c1', subscriptionPlanId: 'p1',
  }),
}));

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

import { CreateSubscriptionUseCase, CreateSubscriptionCommand } from './CreateSubscription';
import * as subscriptionRepo from '../../infrastructure/repositories/subscriptionRepo';

describe('CreateSubscriptionUseCase', () => {
  let useCase: CreateSubscriptionUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateSubscriptionUseCase();
  });

  it('should create subscription (happy path)', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand({
      customerId: 'c1', subscriptionPlanId: 'p1',
    }));

    expect(result.success).toBe(true);
    expect(result.subscription?.customerSubscriptionId).toBe('sub1');
  });

  it('should return error when customerId missing', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand({
      customerId: '', subscriptionPlanId: 'p1',
    }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('customer_id_required');
  });

  it('should return error when planId missing', async () => {
    const result = await useCase.execute(new CreateSubscriptionCommand({
      customerId: 'c1', subscriptionPlanId: '',
    }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_id_required');
  });

  it('should return error when plan not found', async () => {
    (subscriptionRepo.getSubscriptionPlan as jest.Mock).mockResolvedValueOnce(null);

    const result = await useCase.execute(new CreateSubscriptionCommand({
      customerId: 'c1', subscriptionPlanId: 'nonexistent',
    }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_not_found');
  });

  it('should return error when plan inactive', async () => {
    (subscriptionRepo.getSubscriptionPlan as jest.Mock).mockResolvedValueOnce({
      subscriptionPlanId: 'p1', isActive: false, price: 50, subscriptionProductId: 'sp1',
    });

    const result = await useCase.execute(new CreateSubscriptionCommand({
      customerId: 'c1', subscriptionPlanId: 'p1',
    }));

    expect(result.success).toBe(false);
    expect(result.errors).toContain('plan_inactive');
  });
});
