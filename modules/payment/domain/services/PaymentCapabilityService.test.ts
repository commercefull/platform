import { PaymentCapabilityService, PaymentMethodCapabilities } from './PaymentCapabilityService';

describe('PaymentCapabilityService', () => {
  const service = new PaymentCapabilityService();

  const baseCapabilities: PaymentMethodCapabilities = {
    isActive: true,
    minAmountCents: 100,
    maxAmountCents: 500000,
    supportedCurrencies: ['EUR', 'USD'],
    supportedCountries: ['DE', 'FR', 'US'],
  };

  it('should allow a transaction within all capability bounds when all facts match', () => {
    const result = service.checkEligibility(baseCapabilities, {
      currency: 'eur',
      amountCents: 25000,
      country: 'de',
    });
    expect(result.eligible).toBe(true);
    expect(result.reasonCode).toBe('ELIGIBLE');
  });

  it('should allow unrestricted configs when no capability lists are declared', () => {
    const result = service.checkEligibility({ isActive: true }, { currency: 'JPY', amountCents: 999, country: 'JP' });
    expect(result.eligible).toBe(true);
  });

  it('should reject an inactive method regardless of other facts', () => {
    const result = service.checkEligibility({ ...baseCapabilities, isActive: false }, { currency: 'EUR' });
    expect(result).toEqual({ eligible: false, reasonCode: 'INACTIVE' });
  });

  it('should reject an unsupported currency (case-insensitive)', () => {
    const result = service.checkEligibility(baseCapabilities, { currency: 'jpy' });
    expect(result).toEqual({ eligible: false, reasonCode: 'CURRENCY_NOT_SUPPORTED' });
  });

  it('should reject an amount below the minimum', () => {
    const result = service.checkEligibility(baseCapabilities, { currency: 'EUR', amountCents: 50 });
    expect(result).toEqual({ eligible: false, reasonCode: 'AMOUNT_BELOW_MINIMUM' });
  });

  it('should reject an amount above the maximum', () => {
    const result = service.checkEligibility(baseCapabilities, { currency: 'EUR', amountCents: 600000 });
    expect(result).toEqual({ eligible: false, reasonCode: 'AMOUNT_ABOVE_MAXIMUM' });
  });

  it('should reject an unsupported country (case-insensitive)', () => {
    const result = service.checkEligibility(baseCapabilities, { country: 'jp' });
    expect(result).toEqual({ eligible: false, reasonCode: 'COUNTRY_NOT_SUPPORTED' });
  });

  it('should skip checks for facts that are not supplied', () => {
    const result = service.checkEligibility(baseCapabilities, {});
    expect(result.eligible).toBe(true);
  });
});
