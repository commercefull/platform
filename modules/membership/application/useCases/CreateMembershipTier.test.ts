import { CreateMembershipTierUseCase} from './CreateMembershipTier';
import { MembershipValidationError } from '../../domain/errors/MembershipErrors';

describe('CreateMembershipTierUseCase', () => {
  let useCase: CreateMembershipTierUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findTierByLevel: jest.fn().mockResolvedValue(null),
      createTier: jest.fn().mockResolvedValue({
        tierId: 't1', name: 'Gold', level: 1, price: 50, benefits: [{ type: 'discount', value: 10 }], createdAt: new Date(),
      }),
    };
    useCase = new CreateMembershipTierUseCase(mockRepo as never);
  });

  it('should create membership tier (happy path)', async () => {
    const result = await useCase.execute({ name: 'Gold', level: 1, benefits: [{ type: 'discount', value: 10 }] });

    expect(result.tierId).toBe('t1');
    expect(result.benefitCount).toBe(1);
  });

  it('should throw MembershipValidationError when name is empty', async () => {
    await expect(useCase.execute({ name: '', level: 1, benefits: [] })).rejects.toThrow(MembershipValidationError);
  });

  it('should throw MembershipValidationError when level already exists', async () => {
    mockRepo.findTierByLevel.mockResolvedValue({ tierId: 'existing' });

    await expect(useCase.execute({ name: 'Gold', level: 1, benefits: [] })).rejects.toThrow(MembershipValidationError);
  });
});
