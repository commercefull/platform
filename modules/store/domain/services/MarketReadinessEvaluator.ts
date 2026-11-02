/**
 * MarketReadinessEvaluator — Launch Readiness Domain Service
 *
 * Evaluates whether a Market can be launched by checking the 12 readiness
 * dimensions. Pure domain service: takes a `Market` plus a pre-resolved
 * `MarketReadinessFacts` snapshot (gathered by the calling use case via
 * ACL ports) and produces a scorecard + launch gate.
 */

import { Market } from '../entities/Market';

export type ReadinessDimensionKey =
  | 'locale'
  | 'currency'
  | 'catalog'
  | 'pricing'
  | 'tax'
  | 'payments'
  | 'shipping'
  | 'returns'
  | 'legal'
  | 'compliance'
  | 'support'
  | 'fraud';

type ReadinessStatus = 'ready' | 'warning' | 'missing';

export interface ReadinessDimensionResult {
  dimension: ReadinessDimensionKey;
  status: ReadinessStatus;
  /** Machine-readable detail of what is missing/wrong (for deep-linking). */
  issues: string[];
  /** Whether this dimension blocks launch when 'missing'. */
  blocking: boolean;
}

export interface MarketReadinessFacts {
  /** Locales resolved + translated coverage percent for the market's locales. */
  localeCoveragePercent: number;
  /** Currencies configured in the localization module. */
  configuredCurrencyCodes: string[];
  /** Catalog has at least one sellable assortment entry for this market. */
  hasCatalogAssortment: boolean;
  catalogItemCount: number;
  /** At least one price list bound / resolved for the market. */
  hasPriceList: boolean;
  /** Tax registration/zone coverage for the market's countries. */
  hasTaxCoverage: boolean;
  taxJurisdictionsCovered: string[];
  /** At least one enabled payment method + PSP route for market countries/currency. */
  hasPaymentMethod: boolean;
  enabledPaymentMethods: string[];
  /** At least one shipping zone covering market countries. */
  hasShippingCoverage: boolean;
  /** Returns policy/rules configured for the market. */
  hasReturnsPolicy: boolean;
  /** Legal: contracting entity assigned + terms version set. */
  hasContractingEntity: boolean;
  termsVersion?: string;
  /** Compliance policy rules configured for market countries. */
  complianceRulesCovered: number;
  /** Support: locale-aware helpdesk/notification templates exist. */
  hasSupportTemplates: boolean;
  /** Fraud/risk: fraud rules or provider configured for market. */
  hasFraudCoverage: boolean;
}

export interface MarketReadinessReport {
  marketId: string;
  marketCode: string;
  dimensions: ReadinessDimensionResult[];
  /** 0–100 weighted readiness score. */
  readinessScorePercent: number;
  /** Dimensions in 'missing' state that block launch. */
  missing: ReadinessDimensionKey[];
  /** Dimensions in 'warning' state (non-blocking). */
  warnings: ReadinessDimensionKey[];
  /** Whether the market can be launched (no blocking 'missing'). */
  launchable: boolean;
}

/** Dimensions that block launch when missing. */
const BLOCKING: ReadinessDimensionKey[] = ['currency', 'catalog', 'pricing', 'tax', 'payments', 'shipping', 'legal'];

export class MarketReadinessEvaluator {
  evaluate(market: Market, facts: MarketReadinessFacts): MarketReadinessReport {
    const dimensions: ReadinessDimensionResult[] = [
      this.locale(market, facts),
      this.currency(market, facts),
      this.catalog(market, facts),
      this.pricing(market, facts),
      this.tax(market, facts),
      this.payments(market, facts),
      this.shipping(market, facts),
      this.returns(market, facts),
      this.legal(market, facts),
      this.compliance(market, facts),
      this.support(market, facts),
      this.fraud(market, facts),
    ];

    const missing = dimensions.filter(d => d.status === 'missing' && d.blocking).map(d => d.dimension);
    const warnings = dimensions.filter(d => d.status === 'warning').map(d => d.dimension);
    const readyCount = dimensions.filter(d => d.status === 'ready').length;
    const readinessScorePercent = Math.round((readyCount / dimensions.length) * 100);

    return {
      marketId: market.marketId,
      marketCode: market.code,
      dimensions,
      readinessScorePercent,
      missing,
      warnings,
      launchable: missing.length === 0,
    };
  }

  private locale(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (market.supportedLocaleCodes.length === 0) issues.push('no_supported_locales');
    if (facts.localeCoveragePercent < 100) issues.push(`locale_coverage_${facts.localeCoveragePercent}pct`);
    return this.result('locale', issues, facts.localeCoveragePercent >= 80);
  }

  private currency(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (market.supportedCurrencyCodes.length === 0) issues.push('no_supported_currencies');
    for (const code of market.supportedCurrencyCodes) {
      if (!facts.configuredCurrencyCodes.includes(code)) issues.push(`currency_not_configured:${code}`);
    }
    return this.result('currency', issues, issues.length === 0);
  }

  private catalog(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!market.catalogAssortmentId) issues.push('no_catalog_assortment');
    if (!facts.hasCatalogAssortment) issues.push('assortment_empty');
    if (facts.catalogItemCount === 0) issues.push('no_sellable_items');
    return this.result('catalog', issues, issues.length === 0);
  }

  private pricing(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!market.defaultPriceListId && !market.allowDynamicFxConversion) issues.push('no_price_list_or_fx');
    if (!facts.hasPriceList && !market.allowDynamicFxConversion) issues.push('price_list_unresolved');
    return this.result('pricing', issues, issues.length === 0);
  }

  private tax(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasTaxCoverage) issues.push('no_tax_coverage');
    const uncovered = market.countryCodes.filter(c => !facts.taxJurisdictionsCovered.includes(c));
    for (const c of uncovered) issues.push(`tax_not_configured:${c}`);
    return this.result('tax', issues, uncovered.length === 0 && facts.hasTaxCoverage);
  }

  private payments(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasPaymentMethod) issues.push('no_enabled_payment_method');
    if (market.allowedPaymentMethods.length === 0 && !facts.hasPaymentMethod) issues.push('no_allowed_methods');
    return this.result('payments', issues, issues.length === 0);
  }

  private shipping(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasShippingCoverage) issues.push('no_shipping_zone_coverage');
    if (market.allowedFulfillmentMethods.length === 0) issues.push('no_fulfillment_methods');
    return this.result('shipping', issues, issues.length === 0);
  }

  private returns(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (market.supports('supports_returns') && !facts.hasReturnsPolicy) issues.push('returns_enabled_but_no_policy');
    // Non-blocking: a market may launch with returns disabled.
    return this.result('returns', issues, issues.length === 0, false);
  }

  private legal(market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasContractingEntity) issues.push('no_contracting_entity');
    if (!facts.termsVersion) issues.push('no_terms_version');
    return this.result('legal', issues, issues.length === 0);
  }

  private compliance(_market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (facts.complianceRulesCovered === 0) issues.push('no_compliance_rules');
    // Non-blocking: default-allow policy means absence of rules is legal.
    return this.result('compliance', issues, facts.complianceRulesCovered > 0, false);
  }

  private support(_market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasSupportTemplates) issues.push('no_support_templates');
    return this.result('support', issues, facts.hasSupportTemplates, false);
  }

  private fraud(_market: Market, facts: MarketReadinessFacts): ReadinessDimensionResult {
    const issues: string[] = [];
    if (!facts.hasFraudCoverage) issues.push('no_fraud_coverage');
    return this.result('fraud', issues, facts.hasFraudCoverage, false);
  }

  private result(dimension: ReadinessDimensionKey, issues: string[], isReady: boolean, blocking?: boolean): ReadinessDimensionResult {
    const isBlocking = blocking ?? BLOCKING.includes(dimension);
    const status: ReadinessStatus = isReady ? 'ready' : isBlocking ? 'missing' : 'warning';
    return { dimension, status, issues, blocking: isBlocking };
  }
}
