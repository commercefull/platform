import { GetPointsHistoryUseCase} from './GetPointsHistory';

describe('GetPointsHistoryUseCase', () => {
  let useCase: GetPointsHistoryUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      getTransactions: jest.fn().mockResolvedValue([
        { transactionId: 't1', type: 'earned', points: 100, balance: 100, description: 'Purchase', createdAt: new Date() },
        { transactionId: 't2', type: 'redeemed', points: 50, balance: 50, description: 'Reward', createdAt: new Date() },
      ]),
      countTransactions: jest.fn().mockResolvedValue(2),
      getPointsSummary: jest.fn().mockResolvedValue({ totalEarned: 100, totalRedeemed: 50, totalExpired: 0, currentBalance: 50 }),
    };
    useCase = new GetPointsHistoryUseCase(mockRepo as never);
  });

  it('should get points history (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.summary.totalEarned).toBe(100);
    expect(result.summary.currentBalance).toBe(50);
  });

  it('should pass filters to repository', async () => {
    await useCase.execute({ customerId: 'c1', type: 'earned', page: 2, limit: 10 });

    expect(mockRepo.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1', type: 'earned' }),
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });
});
