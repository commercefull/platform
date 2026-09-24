import '../../tests/testUtils';
import { ManageMembershipProgramsUseCase } from './ManageMembershipPrograms';
import { createAdminProgramsPort } from '../../tests/testUtils';

describe('ManageMembershipProgramsUseCase', () => {
  const adminProgramsPort = createAdminProgramsPort();
  const useCase = new ManageMembershipProgramsUseCase(adminProgramsPort);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return membership statistics', async () => {
    adminProgramsPort.getMembershipStats.mockResolvedValue({ totalMembers: 100, activeMembers: 80, expiringThisMonth: 5 });

    const result = await useCase.getMembershipStats();

    expect(result.totalMembers).toBe(100);
    expect(result.activeMembers).toBe(80);
  });

  it('should return membership tiers with member counts', async () => {
    adminProgramsPort.findMembershipTiersWithCounts.mockResolvedValue([{ tierId: 't1', memberCount: 10 }]);

    const result = await useCase.findMembershipTiersWithCounts();

    expect(result).toHaveLength(1);
  });

  it('should return loyalty statistics', async () => {
    adminProgramsPort.getLoyaltyStats.mockResolvedValue({
      totalMembers: 50,
      totalPointsIssued: 10000,
      totalPointsRedeemed: 4000,
    });

    const result = await useCase.getLoyaltyStats();

    expect(result.totalPointsIssued).toBe(10000);
  });
});

