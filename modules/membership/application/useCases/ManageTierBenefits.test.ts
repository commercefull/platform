import { ManageTierBenefitsUseCase, type ManageTierBenefitsPort } from './ManageTierBenefits';
import { MembershipBenefitNotFoundError, MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

const tier = { id: 'tier-1', name: 'Gold' };
const benefit = { id: 'ben-1', tierIds: ['tier-1'] };

describe('ManageTierBenefitsUseCase', () => {
  let port: jest.Mocked<ManageTierBenefitsPort>;
  let useCase: ManageTierBenefitsUseCase;

  beforeEach(() => {
    port = lazyMock<ManageTierBenefitsPort>();
    useCase = new ManageTierBenefitsUseCase(port);
  });

  describe('create', () => {
    it('should reject when required fields are missing', async () => {
      await expect(useCase.create({ name: 'B' })).rejects.toBeInstanceOf(MembershipValidationError);
      expect(port.createBenefit).not.toHaveBeenCalled();
    });

    it('should reject when the tier does not exist', async () => {
      port.findTierById.mockResolvedValue(null);
      await expect(
        useCase.create({ name: 'B', tierIds: ['tier-x'], benefitType: 'discount' }),
      ).rejects.toBeInstanceOf(MembershipPlanNotFoundError);
    });

    it('should create the benefit linked to the first tier', async () => {
      port.findTierById.mockResolvedValue(tier);
      port.createBenefit.mockImplementation(async (input) => {
        expect(input.tierIds).toEqual(['tier-1']);
        return benefit;
      });

      const result = await useCase.create({ name: 'B', tierIds: ['tier-1'], benefitType: 'discount', isActive: true });
      expect(result).toBe(benefit);
    });
  });

  describe('update', () => {
    it('should reject when the benefit does not exist', async () => {
      port.findBenefitById.mockResolvedValue(null);
      await expect(useCase.update('ben-x', {})).rejects.toBeInstanceOf(MembershipBenefitNotFoundError);
    });

    it('should validate the new tier when it changes', async () => {
      port.findBenefitById.mockResolvedValue(benefit);
      port.findTierById.mockResolvedValue(null);
      await expect(useCase.update('ben-1', { tierIds: ['tier-x'] })).rejects.toBeInstanceOf(
        MembershipPlanNotFoundError,
      );
      expect(port.updateBenefit).not.toHaveBeenCalled();
    });

    it('should skip the tier check when the tier is unchanged', async () => {
      port.findBenefitById.mockResolvedValue(benefit);
      port.updateBenefit.mockResolvedValue(benefit);
      await useCase.update('ben-1', { tierIds: ['tier-1'], name: 'B2' });
      expect(port.findTierById).not.toHaveBeenCalled();
      expect(port.updateBenefit).toHaveBeenCalledWith('ben-1', expect.objectContaining({ name: 'B2' }));
    });
  });

  describe('remove', () => {
    it('should reject when the benefit does not exist', async () => {
      port.findBenefitById.mockResolvedValue(null);
      await expect(useCase.remove('ben-x')).rejects.toBeInstanceOf(MembershipBenefitNotFoundError);
    });

    it('should delete an existing benefit', async () => {
      port.findBenefitById.mockResolvedValue(benefit);
      await useCase.remove('ben-1');
      expect(port.deleteBenefit).toHaveBeenCalledWith('ben-1');
    });
  });
});
