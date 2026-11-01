/**
 * MarketReadinessAdapter (ACL)
 *
 * Gathers `MarketReadinessFacts` for the readiness evaluator by reading the
 * other modules' configuration tables. Read-only reporting adapter: it
 * deliberately does not call use cases — readiness is a projection over
 * configuration state, not a business operation. Kept to one outbound port
 * per the module coupling budget.
 */

import { query, queryOne } from '../../../../libs/db';
import type { Market } from '../../domain/entities/Market';
import type { MarketReadinessFacts } from '../../domain/services/MarketReadinessEvaluator';
import type { MarketReadinessFactsPort } from '../../application/ports/MarketReadinessFactsPort';
import { logger } from '../../../../libs/logger';

export class MarketReadinessAdapter implements MarketReadinessFactsPort {
  async gatherFacts(market: Market): Promise<MarketReadinessFacts> {
    const safe = async <T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        logger.warn(`Market readiness fact lookup failed: ${label}`, { error: (error as Error).message, marketId: market.marketId });
        return fallback;
      }
    };

    const [
      localeCoveragePercent,
      configuredCurrencyCodes,
      catalog,
      hasPriceList,
      tax,
      payments,
      hasShippingCoverage,
      hasReturnsPolicy,
      complianceRulesCovered,
      hasSupportTemplates,
      hasFraudCoverage,
    ] = await Promise.all([
      safe('locales', 0, () => this.localeCoverage(market)),
      safe('currencies', [] as string[], () => this.configuredCurrencies()),
      safe('catalog', { hasCatalogAssortment: false, catalogItemCount: 0 }, () => this.catalogCoverage(market)),
      safe('pricing', false, () => this.priceListBound(market)),
      safe('tax', { hasTaxCoverage: false, taxJurisdictionsCovered: [] as string[] }, () => this.taxCoverage()),
      safe('payments', { hasPaymentMethod: false, enabledPaymentMethods: [] as string[] }, () => this.paymentCoverage(market)),
      safe('shipping', false, () => this.shippingCoverage(market)),
      safe('returns', false, () => this.returnsCoverage()),
      safe('compliance', 0, () => this.complianceCoverage(market)),
      safe('support', false, () => this.supportCoverage()),
      safe('fraud', false, () => this.fraudCoverage()),
    ]);

    return {
      localeCoveragePercent,
      configuredCurrencyCodes,
      hasCatalogAssortment: catalog.hasCatalogAssortment,
      catalogItemCount: catalog.catalogItemCount,
      hasPriceList,
      hasTaxCoverage: tax.hasTaxCoverage,
      taxJurisdictionsCovered: tax.taxJurisdictionsCovered,
      hasPaymentMethod: payments.hasPaymentMethod,
      enabledPaymentMethods: payments.enabledPaymentMethods,
      hasShippingCoverage,
      hasReturnsPolicy,
      hasContractingEntity: !!market.contractingEntityId,
      termsVersion: (market.metadata?.termsVersion as string | undefined) ?? undefined,
      complianceRulesCovered,
      hasSupportTemplates,
      hasFraudCoverage,
    };
  }

  /** Share of the market's supported locales that exist as active locales. */
  private async localeCoverage(market: Market): Promise<number> {
    if (market.supportedLocaleCodes.length === 0) return 0;
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM locale WHERE "isActive" = true AND code = ANY($1)`,
      [market.supportedLocaleCodes],
    );
    const active = Number(row?.count ?? 0);
    return Math.round((active / market.supportedLocaleCodes.length) * 100);
  }

  private async configuredCurrencies(): Promise<string[]> {
    const rows = await query<{ code: string }[]>(`SELECT code FROM currency WHERE "isActive" = true`, []);
    return (rows || []).map(r => r.code.toUpperCase());
  }

  private async catalogCoverage(market: Market): Promise<{ hasCatalogAssortment: boolean; catalogItemCount: number }> {
    const assortmentStoreId = market.catalogAssortmentId ?? market.storeId;
    if (!assortmentStoreId) return { hasCatalogAssortment: false, catalogItemCount: 0 };
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "assortmentStoreEntry"
       WHERE "storeId" = $1 AND effect = 'include' AND "isHidden" = false`,
      [assortmentStoreId],
    );
    const count = Number(row?.count ?? 0);
    return { hasCatalogAssortment: count > 0, catalogItemCount: count };
  }

  private async priceListBound(market: Market): Promise<boolean> {
    if (!market.defaultPriceListId) return false;
    const row = await queryOne<{ priceListId: string }>(
      `SELECT "priceListId" FROM "pricingPriceList" WHERE "priceListId" = $1 AND "isActive" = true`,
      [market.defaultPriceListId],
    );
    return !!row;
  }

  private async taxCoverage(): Promise<{ hasTaxCoverage: boolean; taxJurisdictionsCovered: string[] }> {
    const rows = await query<{ countries: unknown }[]>(`SELECT countries FROM "taxZone" WHERE "isActive" = true`, []);
    const covered = new Set<string>();
    for (const row of rows || []) {
      for (const c of jsonArray<string>(row.countries)) covered.add(c.toUpperCase());
    }
    return { hasTaxCoverage: covered.size > 0, taxJurisdictionsCovered: [...covered] };
  }

  private async paymentCoverage(market: Market): Promise<{ hasPaymentMethod: boolean; enabledPaymentMethods: string[] }> {
    const rows = await query<{ supportedPaymentMethods: string; supportedCurrencies: string[] | null }[]>(
      `SELECT "supportedPaymentMethods", "supportedCurrencies" FROM "paymentGateway"
       WHERE "isActive" = true AND "deletedAt" IS NULL AND "organizationId" = $1`,
      [market.organizationId],
    );
    const methods = new Set<string>();
    for (const row of rows || []) {
      const currencies = row.supportedCurrencies ?? [];
      const currencyOk = currencies.length === 0 || currencies.some(c => market.supportedCurrencyCodes.includes(c.toUpperCase()));
      if (currencyOk) methods.add(row.supportedPaymentMethods);
    }
    return { hasPaymentMethod: methods.size > 0, enabledPaymentMethods: [...methods] };
  }

  private async shippingCoverage(market: Market): Promise<boolean> {
    const rows = await query<{ locations: unknown }[]>(
      `SELECT locations FROM "shippingZone" WHERE "isActive" = true AND "locationType" = 'country'`,
      [],
    );
    for (const row of rows || []) {
      const countries = jsonArray<string>(row.locations).map(c => c.toUpperCase());
      if (market.countryCodes.some(c => countries.includes(c))) return true;
    }
    return false;
  }

  private async returnsCoverage(): Promise<boolean> {
    const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "returnRule" WHERE "isActive" = true`, []);
    return Number(row?.count ?? 0) > 0;
  }

  private async complianceCoverage(market: Market): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "compliancePolicyRule"
       WHERE "isActive" = true AND ("organizationId" = $1 OR "organizationId" IS NULL)`,
      [market.organizationId],
    );
    return Number(row?.count ?? 0);
  }

  private async supportCoverage(): Promise<boolean> {
    const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "notificationTemplate" WHERE "isActive" = true`, []);
    return Number(row?.count ?? 0) > 0;
  }

  private async fraudCoverage(): Promise<boolean> {
    const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "fraudRule" WHERE "isActive" = true`, []);
    return Number(row?.count ?? 0) > 0;
  }
}

function jsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default new MarketReadinessAdapter();
