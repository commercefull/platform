/**
 * Market Repository Implementation
 * PostgreSQL persistence for the `Market` aggregate.
 *
 * DB rows (`DbMarket`) stay inside this file; everything returned is the
 * `Market` domain entity.
 */

import { query, queryOne } from '../../../../libs/db';
import type { Market as DbMarket } from '../../../../libs/db/types';
import { MarketRepository, MarketListFilter } from '../../domain/repositories/MarketRepository';
import { Market, MarketStatus, MarketTaxDisplayMode } from '../../domain/entities/Market';
import type { MarketCapabilityMap } from '../../domain/entities/MarketCapabilities';

export class MarketRepo implements MarketRepository {
  async save(market: Market): Promise<void> {
    await query(
      `INSERT INTO market (
        "marketId", "organizationId", "storeId", code, name, status, version,
        "countryCodes", "defaultCurrencyCode", "supportedCurrencyCodes",
        "defaultLocaleCode", "supportedLocaleCodes",
        "catalogAssortmentId", "defaultPriceListId", "contractingEntityId",
        "taxDisplayMode", "allowDynamicFxConversion", capabilities,
        "allowedPaymentMethods", "allowedFulfillmentMethods", "hostnamePatterns",
        metadata, "createdAt", "updatedAt"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      [
        market.marketId,
        market.organizationId,
        market.storeId ?? null,
        market.code,
        market.name,
        market.status,
        market.version,
        market.countryCodes,
        market.defaultCurrencyCode,
        market.supportedCurrencyCodes,
        market.defaultLocaleCode,
        market.supportedLocaleCodes,
        market.catalogAssortmentId ?? null,
        market.defaultPriceListId ?? null,
        market.contractingEntityId ?? null,
        market.taxDisplayMode,
        market.allowDynamicFxConversion,
        JSON.stringify(market.capabilities.toMap()),
        market.allowedPaymentMethods,
        market.allowedFulfillmentMethods,
        market.hostnamePatterns,
        market.metadata ? JSON.stringify(market.metadata) : null,
        market.createdAt,
        market.updatedAt,
      ],
    );
  }

  async update(market: Market): Promise<void> {
    await query(
      `UPDATE market SET
        "storeId" = $1, name = $2, status = $3, version = $4,
        "countryCodes" = $5, "defaultCurrencyCode" = $6, "supportedCurrencyCodes" = $7,
        "defaultLocaleCode" = $8, "supportedLocaleCodes" = $9,
        "catalogAssortmentId" = $10, "defaultPriceListId" = $11, "contractingEntityId" = $12,
        "taxDisplayMode" = $13, "allowDynamicFxConversion" = $14, capabilities = $15,
        "allowedPaymentMethods" = $16, "allowedFulfillmentMethods" = $17, "hostnamePatterns" = $18,
        metadata = $19, "updatedAt" = $20
      WHERE "marketId" = $21`,
      [
        market.storeId ?? null,
        market.name,
        market.status,
        market.version,
        market.countryCodes,
        market.defaultCurrencyCode,
        market.supportedCurrencyCodes,
        market.defaultLocaleCode,
        market.supportedLocaleCodes,
        market.catalogAssortmentId ?? null,
        market.defaultPriceListId ?? null,
        market.contractingEntityId ?? null,
        market.taxDisplayMode,
        market.allowDynamicFxConversion,
        JSON.stringify(market.capabilities.toMap()),
        market.allowedPaymentMethods,
        market.allowedFulfillmentMethods,
        market.hostnamePatterns,
        market.metadata ? JSON.stringify(market.metadata) : null,
        market.updatedAt,
        market.marketId,
      ],
    );
  }

  async findById(marketId: string): Promise<Market | null> {
    const row = await queryOne<DbMarket>('SELECT * FROM market WHERE "marketId" = $1 AND "deletedAt" IS NULL', [marketId]);
    return row ? this.mapToMarket(row) : null;
  }

  async findByCode(organizationId: string, code: string): Promise<Market | null> {
    const row = await queryOne<DbMarket>(
      'SELECT * FROM market WHERE "organizationId" = $1 AND code = $2 AND "deletedAt" IS NULL',
      [organizationId, code.toUpperCase()],
    );
    return row ? this.mapToMarket(row) : null;
  }

  async findByHostname(hostname: string): Promise<Market | null> {
    const row = await queryOne<DbMarket>(
      `SELECT * FROM market
       WHERE status = 'active' AND "deletedAt" IS NULL
         AND $1 ILIKE ANY("hostnamePatterns")
       LIMIT 1`,
      [hostname],
    );
    return row ? this.mapToMarket(row) : null;
  }

  async findByStoreId(storeId: string): Promise<Market[]> {
    const rows = await query<DbMarket[]>(
      'SELECT * FROM market WHERE "storeId" = $1 AND "deletedAt" IS NULL ORDER BY "createdAt" DESC',
      [storeId],
    );
    return (rows || []).map(row => this.mapToMarket(row));
  }

  async list(filter?: MarketListFilter): Promise<Market[]> {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: unknown[] = [];
    let i = 1;

    if (filter?.organizationId) {
      conditions.push(`"organizationId" = $${i++}`);
      params.push(filter.organizationId);
    }
    if (filter?.status) {
      conditions.push(`status = $${i++}`);
      params.push(filter.status);
    }
    if (filter?.storeId) {
      conditions.push(`"storeId" = $${i++}`);
      params.push(filter.storeId);
    }
    if (filter?.countryCode) {
      conditions.push(`$${i} = ANY("countryCodes")`);
      params.push(filter.countryCode.toUpperCase());
    }

    const rows = await query<DbMarket[]>(`SELECT * FROM market WHERE ${conditions.join(' AND ')} ORDER BY "createdAt" DESC`, params);
    return (rows || []).map(row => this.mapToMarket(row));
  }

  async delete(marketId: string): Promise<void> {
    await query('UPDATE market SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE "marketId" = $1', [marketId]);
  }

  private mapToMarket(row: DbMarket): Market {
    return Market.reconstitute({
      marketId: row.marketId,
      organizationId: row.organizationId,
      storeId: row.storeId ?? undefined,
      code: row.code,
      name: row.name,
      status: row.status as MarketStatus,
      version: row.version,
      countryCodes: asStringArray(row.countryCodes),
      defaultCurrencyCode: row.defaultCurrencyCode,
      supportedCurrencyCodes: asStringArray(row.supportedCurrencyCodes),
      defaultLocaleCode: row.defaultLocaleCode,
      supportedLocaleCodes: asStringArray(row.supportedLocaleCodes),
      catalogAssortmentId: row.catalogAssortmentId ?? undefined,
      defaultPriceListId: row.defaultPriceListId ?? undefined,
      contractingEntityId: row.contractingEntityId ?? undefined,
      taxDisplayMode: row.taxDisplayMode as MarketTaxDisplayMode,
      allowDynamicFxConversion: row.allowDynamicFxConversion,
      capabilities: (row.capabilities ?? {}) as MarketCapabilityMap,
      allowedPaymentMethods: asStringArray(row.allowedPaymentMethods),
      allowedFulfillmentMethods: asStringArray(row.allowedFulfillmentMethods),
      hostnamePatterns: asStringArray(row.hostnamePatterns),
      metadata: row.metadata ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }
}

/** pg returns jsonb arrays already parsed; tolerate string-serialized rows too. */
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default new MarketRepo();
