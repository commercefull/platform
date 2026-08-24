import { UpdateMembershipTierUseCase} from './UpdateMembershipTier';
import { MembershipPlanNotFoundError } from '../../domain/errors/MembershipErrors';

describe('UpdateMembershipTierUseCase', () => {
  let useCase: UpdateMembershipTierUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getTierById: jest.fn().mockResolvedValue({ tierId: 't1', name: 'Gold', price: 50, billingPeriod: 'monthly', isActive: true, updatedAt: new Date() }),
      updateTier: jest.fn().mockResolvedValue({ tierId: 't1', name: 'Gold Pro', price: 60, billingPeriod: 'monthly', isActive: true, updatedAt: new Date() }),
    };
    useCase = new UpdateMembershipTierUseCase(mockRepo as never);
  });

  it('should update tier (happy path)', async () => {
    const result = await useCase.execute({ tierId: 't1', name: 'Gold Pro', price: 60 });

    expect(result.tierId).toBe('t1');
    expect(result.name).toBe('Gold Pro');
    expect(result.price).toBe(60);
  });

  it('should throw MembershipPlanNotFoundError when tier not found', async () => {
    mockRepo.getTierById.mockResolvedValue(null);

    await expect(useCase.execute({ tierId: 'missing' })).rejects.toThrow(MembershipPlanNotFoundError);
  });
});
