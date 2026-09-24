import '../../tests/testUtils';
import { CancelMembershipUseCase } from './CancelMembership';
import { MembershipNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';
import { createCancelMembershipRepository, emitMock } from '../../tests/testUtils';

describe('CancelMembershipUseCase', () => {
  const membershipRepository = createCancelMembershipRepository();
  const useCase = new CancelMembershipUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.getMembershipById.mockResolvedValue({
      status: 'active',
      customerId: 'c1',
      tierId: 't1',
      billingPeriod: 'monthly',
      currentPeriodEnd: new Date(Date.now() + 15 * 86400000).toISOString(),
      createdAt: new Date(),
    });
    membershipRepository.getTierById.mockResolvedValue({ priceCents: 50 });
    membershipRepository.updateMembership.mockResolvedValue(undefined);
    membershipRepository.createStatusLog.mockResolvedValue(undefined);
    membershipRepository.recordCancellationFeedback.mockResolvedValue(undefined);
  });

  it('should cancel the membership at the end of the period', async () => {
    const result = await useCase.execute({ membershipId: 'm1', reason: 'Too expensive' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('pending_cancellation');
    expect(emitMock).toHaveBeenCalledWith(
      'membership.cancelled',
      expect.objectContaining({ membershipId: 'm1' }),
    );
  });

  it('should cancel immediately and flag refund eligibility when requested', async () => {
    const result = await useCase.execute({ membershipId: 'm1', immediate: true, cancelledBy: 'admin1' });

    expect(result.membershipId).toBe('m1');
    expect(result.refundEligible).toBe(true);
  });

  it('should throw MembershipNotFoundError when the membership does not exist', async () => {
    membershipRepository.getMembershipById.mockResolvedValue(null);

    await expect(useCase.execute({ membershipId: 'missing' })).rejects.toThrow(MembershipNotFoundError);
    expect(membershipRepository.updateMembership).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the membership is already cancelled', async () => {
    membershipRepository.getMembershipById.mockResolvedValue({
      status: 'cancelled',
      customerId: 'c1',
      tierId: 't1',
      createdAt: new Date(),
    });

    await expect(useCase.execute({ membershipId: 'm1' })).rejects.toThrow(MembershipValidationError);
    expect(emitMock).not.toHaveBeenCalled();
  });
});
