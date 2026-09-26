import { ManageUserMembershipsUseCase, type ManageUserMembershipsPort } from './ManageUserMemberships';
import { MembershipPlanNotFoundError, MembershipValidationError, UserMembershipNotFoundError } from '../../domain/errors/MembershipErrors';

const lazyMock = <T extends object>(): jest.Mocked<T> => {
  const fns = new Map<PropertyKey, jest.Mock>();
  return new Proxy({} as object, {
    get: (_t, prop) => {
      if (!fns.has(prop)) fns.set(prop, jest.fn());
      return fns.get(prop);
    },
  }) as jest.Mocked<T>;
};

const membership = { id: 'um-1', userId: 'u-1', tierId: 'tier-1', isActive: true };
const tier = { id: 'tier-1', name: 'Gold' };

describe('ManageUserMembershipsUseCase', () => {
  let port: jest.Mocked<ManageUserMembershipsPort>;
  let useCase: ManageUserMembershipsUseCase;

  beforeEach(() => {
    port = lazyMock<ManageUserMembershipsPort>();
    useCase = new ManageUserMembershipsUseCase(port);
  });

  describe('create', () => {
    it('should reject when userId or tierId is missing', async () => {
      await expect(useCase.create({ tierId: 'tier-1' })).rejects.toBeInstanceOf(MembershipValidationError);
      await expect(useCase.create({ userId: 'u-1' })).rejects.toBeInstanceOf(MembershipValidationError);
      expect(port.createUserMembership).not.toHaveBeenCalled();
    });

    it('should reject when the user already has an active membership', async () => {
      port.findMembershipByUserId.mockResolvedValue(membership);
      await expect(useCase.create({ userId: 'u-1', tierId: 'tier-1' })).rejects.toBeInstanceOf(
        MembershipValidationError,
      );
      expect(port.createUserMembership).not.toHaveBeenCalled();
    });

    it('should reject when the tier does not exist', async () => {
      port.findMembershipByUserId.mockResolvedValue(null);
      port.findTierById.mockResolvedValue(null);
      await expect(useCase.create({ userId: 'u-1', tierId: 'tier-x' })).rejects.toBeInstanceOf(
        MembershipPlanNotFoundError,
      );
    });

    it('should create with defaults when valid', async () => {
      port.findMembershipByUserId.mockResolvedValue(null);
      port.findTierById.mockResolvedValue(tier);
      port.createUserMembership.mockResolvedValue(membership);

      const result = await useCase.create({ userId: 'u-1', tierId: 'tier-1' });

      expect(port.createUserMembership).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u-1', tierId: 'tier-1', isActive: true, autoRenew: false, membershipType: 'monthly' }),
      );
      expect(result).toBe(membership);
    });

    it('should allow creation when the existing membership is inactive', async () => {
      port.findMembershipByUserId.mockResolvedValue({ ...membership, isActive: false });
      port.findTierById.mockResolvedValue(tier);
      port.createUserMembership.mockResolvedValue(membership);

      await useCase.create({ userId: 'u-1', tierId: 'tier-1' });
      expect(port.createUserMembership).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should reject when the membership does not exist', async () => {
      port.findUserMembershipById.mockResolvedValue(null);
      await expect(useCase.update('um-x', {})).rejects.toBeInstanceOf(UserMembershipNotFoundError);
    });

    it('should validate the new tier when tierId changes', async () => {
      port.findUserMembershipById.mockResolvedValue(membership);
      port.findTierById.mockResolvedValue(null);
      await expect(useCase.update('um-1', { tierId: 'tier-x' })).rejects.toBeInstanceOf(MembershipPlanNotFoundError);
      expect(port.updateUserMembership).not.toHaveBeenCalled();
    });

    it('should skip the tier check when tierId is unchanged', async () => {
      port.findUserMembershipById.mockResolvedValue(membership);
      port.updateUserMembership.mockResolvedValue(membership);
      await useCase.update('um-1', { tierId: 'tier-1' });
      expect(port.findTierById).not.toHaveBeenCalled();
      expect(port.updateUserMembership).toHaveBeenCalledWith('um-1', { tierId: 'tier-1' });
    });
  });

  describe('cancel', () => {
    it('should reject when the membership does not exist', async () => {
      port.findUserMembershipById.mockResolvedValue(null);
      await expect(useCase.cancel('um-x')).rejects.toBeInstanceOf(UserMembershipNotFoundError);
    });

    it('should cancel an existing membership', async () => {
      port.findUserMembershipById.mockResolvedValue(membership);
      port.cancelUserMembership.mockResolvedValue({ ...membership, isActive: false });
      const result = await useCase.cancel('um-1');
      expect(port.cancelUserMembership).toHaveBeenCalledWith('um-1');
      expect(result.isActive).toBe(false);
    });
  });
});
