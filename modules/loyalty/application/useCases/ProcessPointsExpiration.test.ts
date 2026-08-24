jest.mock('../../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

import { ProcessPointsExpirationUseCase} from './ProcessPointsExpiration';

describe('ProcessPointsExpirationUseCase', () => {
  let useCase: ProcessPointsExpirationUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getExpiringPoints: jest.fn().mockResolvedValue([
        { customerId: 'c1', points: 50 },
        { customerId: 'c2', points: 30 },
      ]),
      getCustomerLoyalty: jest.fn().mockResolvedValue({ pointsBalance: 100 }),
      updatePointsBalance: jest.fn().mockResolvedValue(undefined),
      markPointsAsExpired: jest.fn().mockResolvedValue(undefined),
      createTransaction: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProcessPointsExpirationUseCase(mockRepo as never);
  });

  it('should process expiring points (happy path)', async () => {
    const result = await useCase.execute({});

    expect(result.processedCount).toBe(2);
    expect(result.totalPointsExpired).toBe(80);
    expect(mockRepo.updatePointsBalance).toHaveBeenCalledTimes(2);
  });

  it('should not update balances in dry run mode', async () => {
    const result = await useCase.execute({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.processedCount).toBe(2);
    expect(mockRepo.updatePointsBalance).not.toHaveBeenCalled();
  });

  it('should skip customers not found', async () => {
    mockRepo.getCustomerLoyalty.mockResolvedValueOnce(null).mockResolvedValueOnce({ pointsBalance: 100 });

    const result = await useCase.execute({});

    expect(result.processedCount).toBe(1);
  });
});
