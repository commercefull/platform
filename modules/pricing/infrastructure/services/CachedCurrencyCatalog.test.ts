/**
 * Unit Tests for CachedCurrencyCatalog
 *
 * Verifies the memoization preserved from the former PricingService:
 * currencies are cached by code and the default currency code is resolved
 * once per process.
 */

jest.mock('../repositories/currencyRepo', () => ({
  __esModule: true,
  default: {
    getCurrencyByCode: jest.fn(),
    getDefaultCurrency: jest.fn(),
  },
}));

import currencyRepo from '../repositories/currencyRepo';
import { CachedCurrencyCatalog } from './CachedCurrencyCatalog';
import { createCurrency } from '../../tests/testUtils';

const mockedRepo = currencyRepo as unknown as {
  getCurrencyByCode: jest.Mock;
  getDefaultCurrency: jest.Mock;
};

describe('CachedCurrencyCatalog', () => {
  let catalog: CachedCurrencyCatalog;

  beforeEach(() => {
    jest.clearAllMocks();
    catalog = new CachedCurrencyCatalog();
  });

  it('should fetch and cache currencies by code', async () => {
    const usd = createCurrency({ code: 'USD' });
    mockedRepo.getCurrencyByCode.mockResolvedValue(usd);

    expect(await catalog.getByCode('USD')).toBe(usd);
    expect(await catalog.getByCode('USD')).toBe(usd);
    expect(mockedRepo.getCurrencyByCode).toHaveBeenCalledTimes(1);
  });

  it('should not cache misses', async () => {
    mockedRepo.getCurrencyByCode.mockResolvedValue(null);

    expect(await catalog.getByCode('XXX')).toBeNull();
    await catalog.getByCode('XXX');
    expect(mockedRepo.getCurrencyByCode).toHaveBeenCalledTimes(2);
  });

  it('should resolve the default currency once and serve it from cache', async () => {
    const eur = createCurrency({ code: 'EUR', isDefault: true });
    mockedRepo.getDefaultCurrency.mockResolvedValue(eur);
    mockedRepo.getCurrencyByCode.mockResolvedValue(eur);

    expect(await catalog.getDefault()).toBe(eur);
    expect(await catalog.getDefault()).toBe(eur);
    expect(mockedRepo.getDefaultCurrency).toHaveBeenCalledTimes(1);
    // Second call goes through getByCode which is already cached — no repo hit.
    expect(mockedRepo.getCurrencyByCode).not.toHaveBeenCalled();
  });
});
