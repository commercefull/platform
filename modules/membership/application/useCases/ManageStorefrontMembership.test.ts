import '../../tests/testUtils';
import { ManageStorefrontMembershipUseCase } from './ManageStorefrontMembership';
import { createStorefrontMembershipPort } from '../../tests/testUtils';

describe('ManageStorefrontMembershipUseCase', () => {
  const storefrontPort = createStorefrontMembershipPort();
  const useCase = new ManageStorefrontMembershipUseCase(storefrontPort);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active plans with benefit counts', async () => {
    storefrontPort.findActivePlansWithBenefitCount.mockResolvedValue([{ planId: 'p1', benefitCount: 3 }]);

    const result = await useCase.findActivePlansWithBenefitCount();

    expect(result).toHaveLength(1);
  });

  it('should return a plan by id', async () => {
    storefrontPort.findPlanById.mockResolvedValue({ planId: 'p1', name: 'Gold' });

    const result = await useCase.findPlanById('p1');

    expect(result).toEqual({ planId: 'p1', name: 'Gold' });
  });

  it('should create a membership for the customer and plan', async () => {
    storefrontPort.createMembership.mockResolvedValue(undefined);

    await useCase.createMembership('c1', 'p1');

    expect(storefrontPort.createMembership).toHaveBeenCalledWith('c1', 'p1');
  });
});
