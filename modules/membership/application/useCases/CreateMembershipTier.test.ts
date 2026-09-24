import '../../tests/testUtils';
import { CreateMembershipTierUseCase } from './CreateMembershipTier';
import { MembershipValidationError } from '../../domain/errors/MembershipErrors';
import { createMembershipTierRepository } from '../../tests/testUtils';

describe('CreateMembershipTierUseCase', () => {
  const membershipRepository = createMembershipTierRepository();
  const useCase = new CreateMembershipTierUseCase(membershipRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    membershipRepository.findTierByLevel.mockResolvedValue(null);
    membershipRepository.createTier.mockResolvedValue({
      tierId: 't1',
      name: 'Gold',
      level: 1,
      priceCents: 50,
      benefits: [{ type: 'discount', value: 10 }],
      createdAt: new Date(),
    });
  });

  it('should create the tier and return its benefit count', async () => {
    const result = await useCase.execute({ name: 'Gold', level: 1, benefits: [{ type: 'discount', value: 10 }] });

    expect(result.tierId).toBe('t1');
    expect(result.benefitCount).toBe(1);
    expect(membershipRepository.createTier).toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the name is empty', async () => {
    await expect(useCase.execute({ name: '', level: 1, benefits: [] })).rejects.toThrow(MembershipValidationError);
    expect(membershipRepository.createTier).not.toHaveBeenCalled();
  });

  it('should throw MembershipValidationError when the level already exists', async () => {
    membershipRepository.findTierByLevel.mockResolvedValue({
      tierId: 'existing',
      name: 'Silver',
      level: 1,
      benefits: [],
      createdAt: new Date(),
    });

    await expect(useCase.execute({ name: 'Gold', level: 1, benefits: [] })).rejects.toThrow(MembershipValidationError);
    expect(membershipRepository.createTier).not.toHaveBeenCalled();
  });
});
