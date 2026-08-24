/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

describe('LoyaltyBalanceAdapter', () => {
  let adapter: import('./LoyaltyBalanceAdapter').LoyaltyBalanceAdapter;
  let mockLoyaltyRepo: any;

  beforeEach(() => {
    mockLoyaltyRepo = { findCustomerPoints: jest.fn() };
    jest.resetModules();
    jest.doMock('../../../loyalty/infrastructure/repositories/loyaltyRepo', () => ({
      LoyaltyRepo: jest.fn(() => mockLoyaltyRepo),
    }));
    const { LoyaltyBalanceAdapter } = require('./LoyaltyBalanceAdapter');
    adapter = new LoyaltyBalanceAdapter();
  });

  afterEach(() => {
    jest.dontMock('../../../loyalty/infrastructure/repositories/loyaltyRepo');
  });

  it('implements LoyaltyBalancePort', () => {
    expect(typeof adapter.getCustomerPoints).toBe('function');
  });

  it('should return currentPoints from loyalty repo', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue({ currentPoints: 500, customerId: 'c1' });

    const result = await adapter.getCustomerPoints('c1');

    expect(result).toBe(500);
  });

  it('should return 0 when customer has no loyalty account', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue(null);

    const result = await adapter.getCustomerPoints('nonexistent');

    expect(result).toBe(0);
  });

  it('should return 0 when currentPoints is undefined', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockResolvedValue({ customerId: 'c1' });

    const result = await adapter.getCustomerPoints('c1');

    expect(result).toBe(0);
  });

  it('should propagate errors from loyalty repo', async () => {
    mockLoyaltyRepo.findCustomerPoints.mockRejectedValue(new Error('DB error'));

    await expect(adapter.getCustomerPoints('c1')).rejects.toThrow('DB error');
  });
});
