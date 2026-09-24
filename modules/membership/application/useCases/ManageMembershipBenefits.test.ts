import '../../tests/testUtils';
import { ManageMembershipBenefitsUseCase } from './ManageMembershipBenefits';
import {
  createMembershipBenefitsPorts,
  createMembershipBenefit,
  createMembershipPlanBenefit,
} from '../../tests/testUtils';

describe('ManageMembershipBenefitsUseCase', () => {
  const { benefits, planBenefits } = createMembershipBenefitsPorts();
  const useCase = new ManageMembershipBenefitsUseCase(benefits, planBenefits);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all benefits with the activeOnly flag forwarded', async () => {
    benefits.findAll.mockResolvedValue([createMembershipBenefit()]);

    const result = await useCase.findAll(true);

    expect(result).toHaveLength(1);
    expect(benefits.findAll).toHaveBeenCalledWith(true);
  });

  it('should return benefits for a plan', async () => {
    benefits.findByPlanId.mockResolvedValue([createMembershipBenefit()]);

    const result = await useCase.findByPlanId('plan-1', true);

    expect(result).toHaveLength(1);
    expect(benefits.findByPlanId).toHaveBeenCalledWith('plan-1', true);
  });

  it('should return plan-benefit links', async () => {
    planBenefits.findByPlanId.mockResolvedValue([createMembershipPlanBenefit()]);

    const result = await useCase.findPlanBenefits('plan-1');

    expect(result).toHaveLength(1);
  });
});

