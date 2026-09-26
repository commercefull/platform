import { ManageMembershipTiersUseCase, type ManageMembershipTiersPort } from './ManageMembershipTiers';
import { MembershipPlanNotFoundError, MembershipValidationError } from '../../domain/errors/MembershipErrors';

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

describe('ManageMembershipTiersUseCase', () => {
  let port: jest.Mocked<ManageMembershipTiersPort>;
  let useCase: ManageMembershipTiersUseCase;

  beforeEach(() => {
    port = lazyMock<ManageMembershipTiersPort>();
    useCase = new ManageMembershipTiersUseCase(port);
  });

  describe('create', () => {
    it('should reject when required fields are missing', async () => {
      await expect(useCase.create({ monthlyPriceCents: 100, annualPriceCents: 1000, level: 1 })).rejects.toBeInstanceOf(
        MembershipValidationError,
      );
      expect(port.createTier).not.toHaveBeenCalled();
    });

    it('should create with defaults', async () => {
      port.createTier.mockImplementation(async (input) => {
        expect(input).toEqual({
          name: 'Gold',
          description: '',
          monthlyPriceCents: 100,
          annualPriceCents: 1000,
          level: 1,
          isActive: true,
        });
        return tier;
      });
      const result = await useCase.create({ name: 'Gold', monthlyPriceCents: 100, annualPriceCents: 1000, level: 1 });
      expect(result).toBe(tier);
    });
  });

  describe('update', () => {
    it('should reject when the tier does not exist', async () => {
      port.findTierById.mockResolvedValue(null);
      await expect(useCase.update('tier-x', {})).rejects.toBeInstanceOf(MembershipPlanNotFoundError);
      expect(port.updateTier).not.toHaveBeenCalled();
    });

    it('should update an existing tier', async () => {
      port.findTierById.mockResolvedValue(tier);
      port.updateTier.mockResolvedValue({ ...tier, name: 'Platinum' });
      const result = await useCase.update('tier-1', { name: 'Platinum' });
      expect(port.updateTier).toHaveBeenCalledWith('tier-1', { name: 'Platinum' });
      expect(result.name).toBe('Platinum');
    });
  });

  describe('remove', () => {
    it('should reject when the tier does not exist', async () => {
      port.findTierById.mockResolvedValue(null);
      await expect(useCase.remove('tier-x')).rejects.toBeInstanceOf(MembershipPlanNotFoundError);
    });

    it('should reject when active members still use the tier', async () => {
      port.findTierById.mockResolvedValue(tier);
      port.findAllUserMemberships.mockResolvedValue([{ id: 'um-1', userId: 'u-1', tierId: 'tier-1', isActive: true }]);
      await expect(useCase.remove('tier-1')).rejects.toBeInstanceOf(MembershipValidationError);
      expect(port.deleteTier).not.toHaveBeenCalled();
    });

    it('should delete when no active members use the tier', async () => {
      port.findTierById.mockResolvedValue(tier);
      port.findAllUserMemberships.mockResolvedValue([]);
      await useCase.remove('tier-1');
      expect(port.findAllUserMemberships).toHaveBeenCalledWith(50, 0, { tierId: 'tier-1', isActive: true });
      expect(port.deleteTier).toHaveBeenCalledWith('tier-1');
    });
  });
});
