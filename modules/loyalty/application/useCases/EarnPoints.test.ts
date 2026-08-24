jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { EarnPointsUseCase} from './EarnPoints';
import { LoyaltyProgramNotFoundError } from '../../domain/errors/LoyaltyErrors';
import { eventBus } from '../../../../libs/events/eventBus';

beforeEach(() => { jest.mocked(eventBus.emit).mockClear(); });

describe('EarnPointsUseCase', () => {
  let useCase: EarnPointsUseCase;
  let mockRepo: Record<string, jest.Mock>;
  let mockProgramRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findMemberByCustomerId: jest.fn().mockResolvedValue({ memberId: 'm1', tierId: 't1', availablePoints: 100, lifetimePoints: 200, tier: { multiplier: 1.5 } }),
      createMember: jest.fn().mockResolvedValue({ memberId: 'm1', tierId: 't1', availablePoints: 0, lifetimePoints: 0 }),
      createTransaction: jest.fn().mockResolvedValue(undefined),
      updateMemberPoints: jest.fn().mockResolvedValue(undefined),
    };
    mockProgramRepo = {
      findActive: jest.fn().mockResolvedValue({ programId: 'p1', defaultTierId: 't1', baseEarnRate: 1 }),
    };
    useCase = new EarnPointsUseCase(mockRepo as never, mockProgramRepo as never);
  });

  it('should earn points for purchase (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1', actionType: 'purchase', amount: 100 });

    expect(result.pointsEarned).toBe(150);
    expect(result.newBalance).toBe(250);
    expect(mockRepo.updateMemberPoints).toHaveBeenCalled();
    expect(eventBus.emit).toHaveBeenCalled();
  });

  it('should earn fixed points for non-purchase action', async () => {
    const result = await useCase.execute({ customerId: 'c1', actionType: 'review', points: 50 });

    expect(result.pointsEarned).toBe(75);
  });

  it('should create member if not exists', async () => {
    mockRepo.findMemberByCustomerId.mockResolvedValue(null);

    const result = await useCase.execute({ customerId: 'c2', actionType: 'signup', points: 100 });

    expect(mockRepo.createMember).toHaveBeenCalled();
    expect(result.pointsEarned).toBe(100);
  });

  it('should throw LoyaltyProgramNotFoundError when no active program', async () => {
    mockProgramRepo.findActive.mockResolvedValue(null);

    await expect(useCase.execute({ customerId: 'c1', actionType: 'bonus', points: 10 })).rejects.toThrow(LoyaltyProgramNotFoundError);
  });
});
