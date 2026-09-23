import '../../tests/testUtils';
import { RenewMembershipUseCase } from './RenewMembership';
import {
  MembershipNotFoundError,
  MembershipPlanNotFoundError,
  MembershipValidationError,
} from '../../domain/errors/MembershipErrors';
import { createRenewMembershipRepository, emitMock } from '../../tests/testUtils';

describe('RenewMembershipUseCase', () => {
  const membershipRepository = createRenewMembershipRepository();
  const useCase = new RenewMembershipUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.getMembershipById.mockResolvedValue({
      membershipId: 'm1',
      status: 'active',
      customerId: 'c1',
      tierId: 't1',
      billingPeriod: 'monthly',
      currentPeriodEnd: new Date().toISOString(),
    });
    membershipRepository.getTierById.mockResolvedValue({ price: 50, billingPeriod: 'monthly' });
    membershipRepository.updateMembership.mockResolvedValue(undefined);
    membershipRepository.createStatusLog.mockResolvedValue(undefined);
  });

  it('should renew the membership, charge the tier price and emit membership.renewed', async () => {
    const result = await useCase.execute({ membershipId: 'm1' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('active');
    expect(result.amount).toBe(50);
    expect(emitMock).toHaveBeenCalledWith(
      'membership.renewed',
      expect.objectContaining({ membershipId: 'm1' }),
    );
  });

  it('should reactivate a membership pending cancellation', async () => {
    membershipRepository.getMembershipById.mockResolvedValue({
      membershipId: 'm1',
      status: 'pending_cancellation',
      customerId: 'c1',
      tierId: 't1',
      billingPeriod: 'monthly',
    });

    const result = await useCase.execute({ membershipId: 'm1' });

    expect(result.status).toBe('pending_cancellation');
  });

  it('should throw MembershipNotFoundError when the membership does not exist', async () => {
    membershipRepository.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing' })).rejects.toThrow(MembershipNotFoundError);
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the membership is cancelled', async () => {
    membershipRepository.getMembershipById.mockResolvedValue({
      membershipId: 'm1',
      status: 'cancelled',
      customerId: 'c1',
      tierId: 't1',
    });

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipValidationError);
    expect(membershipRepository.updateMembership).not.toHaveBeenCalled();
  });

  it('should throw MembershipPlanNotFoundError when the tier does not exist', async () => {
    membershipRepository.getTierById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipPlanNotFoundError);
  });
});
