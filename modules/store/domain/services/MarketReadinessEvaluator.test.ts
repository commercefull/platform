import { Market } from '../entities/Market';
import { MarketReadinessEvaluator, MarketReadinessFacts } from './MarketReadinessEvaluator';

function market(overrides = {}) {
  return Market.create({
    marketId: 'mkt_1',
    organizationId: 'org_1',
    code: 'JP',
    name: 'Japan',
    countryCodes: ['JP'],
    defaultCurrencyCode: 'JPY',
    supportedCurrencyCodes: ['JPY'],
    defaultLocaleCode: 'ja-JP',
    supportedLocaleCodes: ['ja-JP'],
    catalogAssortmentId: 'store_jp',
    defaultPriceListId: 'pl_jp',
    capabilities: { supports_returns: true },
    allowedFulfillmentMethods: ['shipping'],
    ...overrides,
  });
}

function facts(overrides: Partial<MarketReadinessFacts> = {}): MarketReadinessFacts {
  return {
    localeCoveragePercent: 100,
    configuredCurrencyCodes: ['JPY'],
    hasCatalogAssortment: true,
    catalogItemCount: 42,
    hasPriceList: true,
    hasTaxCoverage: true,
    taxJurisdictionsCovered: ['JP'],
    hasPaymentMethod: true,
    enabledPaymentMethods: ['card'],
    hasShippingCoverage: true,
    hasReturnsPolicy: true,
    hasContractingEntity: true,
    termsVersion: '1.0',
    complianceRulesCovered: 1,
    hasSupportTemplates: true,
    hasFraudCoverage: true,
    ...overrides,
  };
}

describe('store/domain/MarketReadinessEvaluator', () => {
  const evaluator = new MarketReadinessEvaluator();

  it('should report launchable when all blocking dimensions are ready', () => {
    const report = evaluator.evaluate(market(), facts());
    expect(report.launchable).toBe(true);
    expect(report.missing).toEqual([]);
    expect(report.readinessScorePercent).toBe(100);
  });

  it('should block launch when currency is not configured', () => {
    const report = evaluator.evaluate(market(), facts({ configuredCurrencyCodes: ['USD'] }));
    expect(report.launchable).toBe(false);
    expect(report.missing).toContain('currency');
  });

  it('should block launch when there is no tax coverage', () => {
    const report = evaluator.evaluate(market(), facts({ hasTaxCoverage: false, taxJurisdictionsCovered: [] }));
    expect(report.launchable).toBe(false);
    expect(report.missing).toContain('tax');
  });

  it('should block launch when payments are not enabled', () => {
    const report = evaluator.evaluate(market(), facts({ hasPaymentMethod: false }));
    expect(report.missing).toContain('payments');
  });

  it('should warn (not block) when returns are enabled but no policy exists', () => {
    const report = evaluator.evaluate(market(), facts({ hasReturnsPolicy: false }));
    expect(report.launchable).toBe(true);
    expect(report.warnings).toContain('returns');
    const returns = report.dimensions.find(d => d.dimension === 'returns');
    expect(returns?.status).toBe('warning');
  });

  it('should warn (not block) when fraud/support/compliance are missing', () => {
    const report = evaluator.evaluate(market(), facts({ hasFraudCoverage: false, hasSupportTemplates: false, complianceRulesCovered: 0 }));
    expect(report.launchable).toBe(true);
    expect(report.warnings).toEqual(expect.arrayContaining(['fraud', 'support', 'compliance']));
  });

  it('should score partial readiness', () => {
    const report = evaluator.evaluate(market(), facts({ hasTaxCoverage: false, hasPaymentMethod: false }));
    expect(report.readinessScorePercent).toBeLessThan(100);
    expect(report.readinessScorePercent).toBeGreaterThan(0);
  });
});
