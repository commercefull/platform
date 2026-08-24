jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { AssignMembershipUseCase} from './AssignMembership';
import { MembershipPlanNotFoundError, MembershipAlreadyActiveError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

describe('AssignMembershipUseCase', () => {
  let useCase: AssignMembershipUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTierById: jest.fn().mockResolvedValue({ name: 'Gold', isActive: true, billingPeriod: 'monthly', price: 50 }),
      findActiveByCustomerId: jest.fn().mockResolvedValue(null),
      createMembership: jest.fn().mockResolvedValue({ membershipId: 'm1', customerId: 'c1', tierId: 't1', status: 'active', startDate: new Date(), endDate: new Date() }),
      incrementTierMembers: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new AssignMembershipUseCase(mockRepo as never);
  });

  it('should assign membership (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', tierId: 't1' });

    expect(result.membershipId).toBe('m1');
    expect(result.status).toBe('active');
  });

  it('should throw MembershipPlanNotFoundError when tier not found', async () => {
    mockRepo.findTierById.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', tierId: 'missing' })).rejects.toThrow(MembershipPlanNotFoundError);
  });

  it('should throw MembershipValidationError when tier is inactive', async () => {
    mockRepo.findTierById.mockResolvedValue({ name: 'Old', isActive: false });

    await expect(useCase.execute({ customerId: 'c1', tierId: 't1' })).rejects.toThrow(MembershipValidationError);
  });

  it('should throw MembershipAlreadyActiveError when customer has active membership', async () => {
    mockRepo.findActiveByCustomerId.mockResolvedValue({ membershipId: 'existing' });

    await expect(useCase.execute({ customerId: 'c1', tierId: 't1' })).rejects.toThrow(MembershipAlreadyActiveError);
  });
});
