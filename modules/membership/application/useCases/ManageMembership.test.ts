jest.mock('../../infrastructure/repositories/MembershipPlanRepository', () => ({
  __esModule: true,
  default: {
    plans: {
      findAll: jest.fn().mockResolvedValue([{ planId: 'p1' }]),
      findById: jest.fn().mockResolvedValue({ planId: 'p1' }),
      getStatistics: jest.fn().mockResolvedValue({ total: 5, active: 3, public: 2, byCycle: {} }),
      create: jest.fn().mockResolvedValue({ planId: 'p2' }),
      update: jest.fn().mockResolvedValue(undefined),
      activate: jest.fn().mockResolvedValue(undefined),
      deactivate: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
    benefits: {
      findAll: jest.fn().mockResolvedValue([{ benefitId: 'b1' }]),
      findByPlanId: jest.fn().mockResolvedValue([{ benefitId: 'b1' }]),
      findById: jest.fn().mockResolvedValue({ benefitId: 'b1' }),
    },
    planBenefits: {
      findByPlanId: jest.fn().mockResolvedValue([{ benefitId: 'b1' }]),
    },
  },
}));

jest.mock('../../infrastructure/repositories/MembershipSubscriptionDataRepository', () => ({
  __esModule: true,
  default: {
    subscriptions: {
      findById: jest.fn().mockResolvedValue({ membershipId: 'm1' }),
      changePlan: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      cancel: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

import { ManageMembershipPlansUseCase, ManageMembershipBenefitsUseCase, ManageMembershipSubscriptionsUseCase } from './ManageMembership';

describe('ManageMembershipPlansUseCase', () => {
  let useCase: ManageMembershipPlansUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageMembershipPlansUseCase();
  });

  it('should find all plans', async () => {
    const result = await useCase.findAll(true);
    expect(result).toHaveLength(1);
  });

  it('should get statistics', async () => {
    const result = await useCase.getStatistics() as Record<string, unknown>;
    expect(result.total).toBe(5);
  });

  it('should create plan', async () => {
    const result = await useCase.create({ name: 'Gold' } as never);
    expect(result).toEqual({ planId: 'p2' });
  });

  it('should activate plan', async () => {
    await useCase.activate('p1');
  });
});

describe('ManageMembershipBenefitsUseCase', () => {
  let useCase: ManageMembershipBenefitsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageMembershipBenefitsUseCase();
  });

  it('should find all benefits', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should find by plan ID', async () => {
    const result = await useCase.findByPlanId('p1');
    expect(result).toHaveLength(1);
  });
});

describe('ManageMembershipSubscriptionsUseCase', () => {
  let useCase: ManageMembershipSubscriptionsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManageMembershipSubscriptionsUseCase();
  });

  it('should find by ID', async () => {
    const result = await useCase.findById('m1');
    expect(result).toEqual({ membershipId: 'm1' });
  });

  it('should change plan', async () => {
    await useCase.changePlan('m1', 'p2', 'Upgrade');
  });

  it('should pause membership', async () => {
    await useCase.pause('m1');
  });

  it('should cancel membership', async () => {
    await useCase.cancel('m1');
  });
});
