import '../../tests/testUtils';
import { ManageMembershipPlansUseCase } from './ManageMembershipPlans';
import {
  createMembershipPlansPort,
  createMembershipPlan,
} from '../../tests/testUtils';

describe('ManageMembershipPlansUseCase', () => {
  const plansPort = createMembershipPlansPort();
  const useCase = new ManageMembershipPlansUseCase(plansPort);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all plans with the activeOnly flag forwarded', async () => {
    plansPort.findAll.mockResolvedValue([createMembershipPlan()]);

    const result = await useCase.findAll(true);

    expect(result).toHaveLength(1);
    expect(plansPort.findAll).toHaveBeenCalledWith(true);
  });

  it('should return plan statistics', async () => {
    plansPort.getStatistics.mockResolvedValue({ total: 5, active: 4, public: 3, byCycle: { monthly: 3 } });

    const result = await useCase.getStatistics();

    expect(result.total).toBe(5);
    expect(result.byCycle.monthly).toBe(3);
  });

  it('should delegate plan creation to the repository', async () => {
    plansPort.create.mockResolvedValue(createMembershipPlan({ membershipPlanId: 'plan-2' }));
    const input = createMembershipPlan();
    const { membershipPlanId: _id, createdAt: _c, updatedAt: _u, ...createInput } = input;

    const result = await useCase.create(createInput);

    expect(result.membershipPlanId).toBe('plan-2');
    expect(plansPort.create).toHaveBeenCalledWith(createInput);
  });

  it('should delegate plan activation to the repository', async () => {
    plansPort.activate.mockResolvedValue(createMembershipPlan({ isActive: true }));

    const result = await useCase.activate('plan-1');

    expect(result?.isActive).toBe(true);
    expect(plansPort.activate).toHaveBeenCalledWith('plan-1');
  });
});

