import '../../tests/testUtils';
import { GetPointsHistoryUseCase } from './GetPointsHistory';
import { createPointsHistoryRepository } from '../../tests/testUtils';

describe('GetPointsHistoryUseCase', () => {
  const loyaltyRepository = createPointsHistoryRepository();
  const useCase = new GetPointsHistoryUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.getTransactions.mockResolvedValue([
      { transactionId: 't1', type: 'earned', points: 100, balance: 100, description: 'Purchase', createdAt: new Date() },
      { transactionId: 't2', type: 'redeemed', points: 50, balance: 50, description: 'Reward', createdAt: new Date() },
    ]);
    loyaltyRepository.countTransactions.mockResolvedValue(2);
    loyaltyRepository.getPointsSummary.mockResolvedValue({
      totalEarned: 100,
      totalRedeemed: 50,
      totalExpired: 0,
      currentBalance: 50,
    });
  });

  it('should return the transaction history with totals and summary', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.summary.totalEarned).toBe(100);
    expect(result.summary.currentBalance).toBe(50);
  });

  it('should pass filters and pagination to the repository', async () => {
    await useCase.execute({ customerId: 'c1', type: 'earned', page: 2, limit: 10 });

    expect(loyaltyRepository.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1', type: 'earned' }),
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });
});
