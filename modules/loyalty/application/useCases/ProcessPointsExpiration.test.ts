import '../../tests/testUtils';
import { ProcessPointsExpirationUseCase } from './ProcessPointsExpiration';
import { createExpirationRepository, emitMock } from '../../tests/testUtils';

describe('ProcessPointsExpirationUseCase', () => {
  const loyaltyRepository = createExpirationRepository();
  const useCase = new ProcessPointsExpirationUseCase(loyaltyRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyRepository.getExpiringPoints.mockResolvedValue([
      { customerId: 'c1', points: 50 },
      { customerId: 'c2', points: 30 },
    ]);
    loyaltyRepository.getCustomerLoyalty.mockResolvedValue({ pointsBalance: 100 });
    loyaltyRepository.updatePointsBalance.mockResolvedValue(undefined);
    loyaltyRepository.markPointsAsExpired.mockResolvedValue(undefined);
    loyaltyRepository.createTransaction.mockResolvedValue(undefined);
  });

  it('should expire points, update balances and emit loyalty.points_expired for each customer', async () => {
    const result = await useCase.execute({});

    expect(result.processedCount).toBe(2);
    expect(result.totalPointsExpired).toBe(80);
    expect(loyaltyRepository.updatePointsBalance).toHaveBeenCalledTimes(2);
    expect(emitMock).toHaveBeenCalledWith(
      'loyalty.points_expired',
      expect.objectContaining({ customerId: 'c1', pointsExpired: 50 }),
    );
  });

  it('should report expirations without persisting changes when dry run is enabled', async () => {
    const result = await useCase.execute({ dryRun: true });

    expect(result.dryRun).toBe(true);
    expect(result.processedCount).toBe(2);
    expect(loyaltyRepository.updatePointsBalance).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should skip customers whose loyalty record is missing', async () => {
    loyaltyRepository.getCustomerLoyalty
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ pointsBalance: 100 });

    const result = await useCase.execute({});

    expect(result.processedCount).toBe(1);
    expect(loyaltyRepository.updatePointsBalance).toHaveBeenCalledTimes(1);
  });
});
