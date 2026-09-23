import '../../tests/testUtils';
import { AssignMembershipUseCase } from './AssignMembership';
import {
  MembershipPlanNotFoundError,
  MembershipAlreadyActiveError,
  MembershipValidationError,
} from '../../domain/errors/MembershipErrors';
import { createAssignMembershipRepository, emitMock } from '../../tests/testUtils';

describe('AssignMembershipUseCase', () => {
  const membershipRepository = createAssignMembershipRepository();
  const useCase = new AssignMembershipUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.findTierById.mockResolvedValue({
      name: 'Gold',
      isActive: true,
      billingPeriod: 'monthly',
      price: 50,
    });
    membershipRepository.findActiveByCustomerId.mockResolvedValue(null);
    membershipRepository.createMembership.mockResolvedValue({
      membershipId: 'm1',
      customerId: 'c1',
      tierId: 't1',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(),
    });
    membershipRepository.incrementTierMembers.mockResolvedValue(undefined);
  });

  it('should create an active membership and emit membership.assigned', async () => {
    const result = await useCase.execute({ customerId: 'c1', tierId: 't1' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('active');
    expect(membershipRepository.createMembership).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'membership.assigned',
      expect.objectContaining({ customerId: 'c1' }),
    );
  });

  it('should throw MembershipPlanNotFoundError when the tier does not exist', async () => {
    membershipRepository.findTierById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', tierId: 'missing' })).rejects.toThrow(MembershipPlanNotFoundError);
    expect(membershipRepository.createMembership).not.toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the tier is inactive', async () => {
    membershipRepository.findTierById.mockResolvedValue({ name: 'Old', isActive: false });

    await expect(useCase.execute({ customerId: 'c1', tierId: 't1' })).rejects.toThrow(MembershipValidationError);
    expect(membershipRepository.createMembership).not.toHaveBeenCalled();
  });

  it('should throw MembershipAlreadyActiveError when the customer already has an active membership', async () => {
    membershipRepository.findActiveByCustomerId.mockResolvedValue({
      membershipId: 'existing',
      customerId: 'c1',
      tierId: 't1',
      status: 'active',
      startDate: new Date(),
    });

    await expect(useCase.execute({ customerId: 'c1', tierId: 't1' })).rejects.toThrow(MembershipAlreadyActiveError);
    expect(membershipRepository.createMembership).not.toHaveBeenCalled();
  });
});
