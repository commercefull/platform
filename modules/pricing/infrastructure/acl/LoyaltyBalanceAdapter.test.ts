import { LoyaltyBalanceAdapter } from './LoyaltyBalanceAdapter';
import type { LoyaltyRepo, LoyaltyPoints } from '../../../loyalty/infrastructure/repositories/loyaltyRepo';

const loyaltyPoints = (overrides: Partial<LoyaltyPoints> = {}): LoyaltyPoints => ({
  loyaltyPointsId: 'lp-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  customerId: 'c1',
  tierId: 'tier-1',
  currentPoints: 0,
  lifetimePoints: 0,
  lastActivity: new Date('2024-01-01'),
  expiryDate: null,
  ...overrides,
});

const mockLoyaltyRepo: jest.Mocked<Pick<LoyaltyRepo, 'findCustomerPoints'>> = { findCustomerPoints: jest.fn() };

describe('LoyaltyBalanceAdapter', () => {
  let adapter: LoyaltyBalanceAdapter;

  beforeEach(() => {
    mockLoyaltyRepo.findCustomerPoints.mockClear();
    adapter = new LoyaltyBalanceAdapter(mockLoyaltyRepo);
  });

  it('implements LoyaltyBalancePort', () => {
    expect(typeof adapter.getCustomerPoints).toBe('function');
  });

  it('should return currentPoints from loyalty repo', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue(loyaltyPoints({ currentPoints: 500 }));

    const result = await adapter.getCustomerPoints('c1');

    expect(result).toBe(500);
  });

  it('should return 0 when customer has no loyalty account', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue(null);

    const result = await adapter.getCustomerPoints('nonexistent');

    expect(result).toBe(0);
  });

  it('should return 0 when currentPoints is undefined', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue(loyaltyPoints({ currentPoints: undefined as unknown as number }));

    const result = await adapter.getCustomerPoints('c1');

    expect(result).toBe(0);
  });

  it('should propagate errors from loyalty repo', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockRejectedValue(new Error('DB error'));

    await expect(adapter.getCustomerPoints('c1')).rejects.toThrow('DB error');
  });
});
