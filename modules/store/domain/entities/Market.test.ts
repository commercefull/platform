import { Market } from './Market';
import { MarketValidationError } from '../errors/StoreErrors';

const base = {
  marketId: 'mkt_1',
  organizationId: 'org_1',
  code: 'eu',
  name: 'European Union',
};

describe('store/domain/Market', () => {
  it('should create a market with defaults when minimal props are given', () => {
    const m = Market.create(base);
    expect(m.code).toBe('EU');
    expect(m.status).toBe('draft');
    expect(m.version).toBe(1);
    expect(m.defaultCurrencyCode).toBe('USD');
    expect(m.supportedCurrencyCodes).toEqual(['USD']);
    expect(m.supportedLocaleCodes).toEqual(['en-US']);
    expect(m.countryCodes).toEqual(['EU']);
  });

  it('should throw when code or name is blank', () => {
    expect(() => Market.create({ ...base, code: ' ' })).toThrow(MarketValidationError);
    expect(() => Market.create({ ...base, name: '' })).toThrow(MarketValidationError);
  });

  it('should throw when default currency is not in supported list', () => {
    expect(() =>
      Market.create({ ...base, defaultCurrencyCode: 'EUR', supportedCurrencyCodes: ['GBP'] }),
    ).toThrow(MarketValidationError);
  });

  it('should throw when default locale is not in supported list', () => {
    expect(() =>
      Market.create({ ...base, defaultLocaleCode: 'fr-FR', supportedLocaleCodes: ['de-DE'] }),
    ).toThrow(MarketValidationError);
  });

  it('should report country/currency/locale support case-insensitively where appropriate', () => {
    const m = Market.create({
      ...base,
      countryCodes: ['de', 'fr'],
      defaultCurrencyCode: 'EUR',
      supportedCurrencyCodes: ['EUR', 'GBP'],
      defaultLocaleCode: 'de-DE',
      supportedLocaleCodes: ['de-DE', 'fr-FR'],
    });
    expect(m.supportsCountry('DE')).toBe(true);
    expect(m.supportsCountry('de')).toBe(true);
    expect(m.supportsCountry('GB')).toBe(false);
    expect(m.supportsCurrency('eur')).toBe(true);
    expect(m.supportsLocale('de-DE')).toBe(true);
    expect(m.supportsLocale('en-GB')).toBe(false);
  });

  it('should resolve capabilities via the MarketCapabilities object', () => {
    const m = Market.create({ ...base, capabilities: { supports_pickup: true } });
    expect(m.supports('supports_pickup')).toBe(true);
    expect(m.supports('supports_cod')).toBe(false);
  });

  it('should activate and mark ready, bumping version', () => {
    const m = Market.create(base);
    m.markReady();
    expect(m.status).toBe('ready');
    expect(m.version).toBe(1);
    m.activate();
    expect(m.status).toBe('active');
    expect(m.isActive).toBe(true);
    expect(m.version).toBe(2);
  });

  it('should disable and keep version stable', () => {
    const m = Market.create(base);
    m.disable();
    expect(m.status).toBe('disabled');
    expect(m.isActive).toBe(false);
  });

  it('should update configuration and re-validate currency consistency', () => {
    const m = Market.create({ ...base, supportedCurrencyCodes: ['EUR', 'GBP'], defaultCurrencyCode: 'EUR' });
    expect(() => m.updateConfiguration({ supportedCurrencyCodes: ['GBP'] })).toThrow(MarketValidationError);
  });

  it('should merge capability updates', () => {
    const m = Market.create({ ...base, capabilities: { supports_pickup: true } });
    m.updateConfiguration({ capabilities: { supports_cod: true } });
    expect(m.supports('supports_pickup')).toBe(true);
    expect(m.supports('supports_cod')).toBe(true);
  });

  it('should serialize capabilities via toJSON', () => {
    const m = Market.create({ ...base, capabilities: { supports_pickup: true } });
    const json = m.toJSON();
    expect((json.capabilities as Record<string, boolean>).supports_pickup).toBe(true);
  });
});
