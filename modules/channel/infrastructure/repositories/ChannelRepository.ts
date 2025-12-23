/**
 * Channel Repository Implementation
 * PostgreSQL implementation of the channel repository interface
 */

import { query, queryOne } from '../../../../libs/db';
import { Channel } from '../../domain/entities/Channel';
import { ChannelProduct } from '../../domain/entities/ChannelProduct';
import {
  IChannelRepository,
  ChannelFilters,
  ChannelProductFilters,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/ChannelRepository';

export class ChannelRepository implements IChannelRepository {
  // ===== Channel Operations =====

  async save(channel: Channel): Promise<Channel> {
    const props = channel.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "channelId" FROM channel WHERE "channelId" = $1',
      [props.channelId]
    );

    if (existing) {
      // Update
      await query(
        `UPDATE channel SET
          name = $1,
          code = $2,
          type = $3,
          "ownerType" = $4,
          "ownerId" = $5,
          "storeIds" = $6,
          "defaultStoreId" = $7,
          "catalogId" = $8,
          "priceListId" = $9,
          "currencyCode" = $10,
          "localeCode" = $11,
          "warehouseIds" = $12,
          "fulfillmentStrategy" = $13,
          "requiresApproval" = $14,
          "allowCreditPayment" = $15,
          "b2bPricingEnabled" = $16,
          "commissionRate" = $17,
          "merchantVisible" = $18,
          "isActive" = $19,
          "isDefault" = $20,
          settings = $21,
          "updatedAt" = $22
        WHERE "channelId" = $23`,
        [
          props.name,
          props.code,
          props.type,
          props.ownerType,
          props.ownerId || null,
          JSON.stringify(props.storeIds || []),
          props.defaultStoreId || null,
          props.catalogId || null,
          props.priceListId || null,
          props.currencyCode,
          props.localeCode,
          JSON.stringify(props.warehouseIds || []),
          props.fulfillmentStrategy,
          props.requiresApproval || false,
          props.allowCreditPayment || false,
          props.b2bPricingEnabled || false,
          props.commissionRate || null,
          props.merchantVisible ?? true,
          props.isActive,
          props.isDefault,
          props.settings ? JSON.stringify(props.settings) : null,
          now,
          props.channelId,
        ]
      );
    } else {
      // Insert
      await query(
        `INSERT INTO channel (
          "channelId", name, code, type, "ownerType", "ownerId",
          "storeIds", "defaultStoreId", "catalogId", "priceListId",
          "currencyCode", "localeCode", "warehouseIds", "fulfillmentStrategy",
          "requiresApproval", "allowCreditPayment", "b2bPricingEnabled",
          "commissionRate", "merchantVisible", "isActive", "isDefault",
          settings, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
        [
          props.channelId,
          props.name,
          props.code,
          props.type,
          props.ownerType,
          props.ownerId || null,
          JSON.stringify(props.storeIds || []),
          props.defaultStoreId || null,
          props.catalogId || null,
          props.priceListId || null,
          props.currencyCode,
          props.localeCode,
          JSON.stringify(props.warehouseIds || []),
          props.fulfillmentStrategy,
          props.requiresApproval || false,
          props.allowCreditPayment || false,
          props.b2bPricingEnabled || false,
          props.commissionRate || null,
          props.merchantVisible ?? true,
          props.isActive,
          props.isDefault,
          props.settings ? JSON.stringify(props.settings) : null,
          now,
          now,
        ]
      );
    }

    const saved = await this.findById(props.channelId);
    return saved!;
  }

  async findById(channelId: string): Promise<Channel | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM channel WHERE "channelId" = $1',
      [channelId]
    );

    if (!row) return null;
    return this.mapToChannel(row);
  }

  async findByCode(code: string): Promise<Channel | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM channel WHERE code = $1',
      [code]
    );

    if (!row) return null;
    return this.mapToChannel(row);
  }

  async findAll(
    filters?: ChannelFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Channel>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const { whereClause, params } = this.buildChannelWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM channel ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM channel ${whereClause}
       ORDER BY name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const data = (rows || []).map((row) => this.mapToChannel(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByOwner(ownerType: string, ownerId: string): Promise<Channel[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM channel WHERE "ownerType" = $1 AND "ownerId" = $2 ORDER BY name ASC',
      [ownerType, ownerId]
    );

    return (rows || []).map((row) => this.mapToChannel(row));
  }

  async findDefault(): Promise<Channel | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM channel WHERE "isDefault" = true AND "isActive" = true LIMIT 1',
      []
    );

    if (!row) return null;
    return this.mapToChannel(row);
  }

  async delete(channelId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'DELETE FROM channel WHERE "channelId" = $1',
      [channelId]
    );

    return (result as any)?.rowCount > 0;
  }

  // ===== Channel Product Operations =====

  async saveChannelProduct(channelProduct: ChannelProduct): Promise<ChannelProduct> {
    const props = channelProduct.toPersistence();
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "channelProductId" FROM "channelProduct" WHERE "channelProductId" = $1',
      [props.channelProductId]
    );

    if (existing) {
      await query(
        `UPDATE "channelProduct" SET
          "isVisible" = $1,
          "isFeatured" = $2,
          "priceOverride" = $3,
          "salePriceOverride" = $4,
          "inventoryOverride" = $5,
          "sortOrder" = $6,
          "publishedAt" = $7,
          "unpublishedAt" = $8,
          "updatedAt" = $9
        WHERE "channelProductId" = $10`,
        [
          props.isVisible,
          props.isFeatured,
          props.priceOverride || null,
          props.salePriceOverride || null,
          props.inventoryOverride || null,
          props.sortOrder,
          props.publishedAt?.toISOString() || null,
          props.unpublishedAt?.toISOString() || null,
          now,
          props.channelProductId,
        ]
      );
    } else {
      await query(
        `INSERT INTO "channelProduct" (
          "channelProductId", "channelId", "productId", "isVisible",
          "isFeatured", "priceOverride", "salePriceOverride", "inventoryOverride",
          "sortOrder", "publishedAt", "unpublishedAt", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          props.channelProductId,
          props.channelId,
          props.productId,
          props.isVisible,
          props.isFeatured,
          props.priceOverride || null,
          props.salePriceOverride || null,
          props.inventoryOverride || null,
          props.sortOrder,
          props.publishedAt?.toISOString() || null,
          props.unpublishedAt?.toISOString() || null,
          now,
          now,
        ]
      );
    }

    const saved = await this.findChannelProduct(props.channelId, props.productId);
    return saved!;
  }

  async findChannelProduct(
    channelId: string,
    productId: string
  ): Promise<ChannelProduct | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "channelProduct" WHERE "channelId" = $1 AND "productId" = $2',
      [channelId, productId]
    );

    if (!row) return null;
    return this.mapToChannelProduct(row);
  }

  async findChannelProducts(
    channelId: string,
    filters?: ChannelProductFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<ChannelProduct>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = ['"channelId" = $1'];
    const params: any[] = [channelId];

    if (filters?.isVisible !== undefined) {
      conditions.push(`"isVisible" = $${params.length + 1}`);
      params.push(filters.isVisible);
    }

    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${params.length + 1}`);
      params.push(filters.isFeatured);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "channelProduct" ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "channelProduct" ${whereClause}
       ORDER BY "sortOrder" ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const data = (rows || []).map((row) => this.mapToChannelProduct(row));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductChannels(productId: string): Promise<ChannelProduct[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "channelProduct" WHERE "productId" = $1',
      [productId]
    );

    return (rows || []).map((row) => this.mapToChannelProduct(row));
  }

  async removeChannelProduct(channelId: string, productId: string): Promise<boolean> {
    const result = await query<{ rowCount?: number }>(
      'DELETE FROM "channelProduct" WHERE "channelId" = $1 AND "productId" = $2',
      [channelId, productId]
    );

    return (result as any)?.rowCount > 0;
  }

  async bulkAssignProducts(
    channelId: string,
    productIds: string[]
  ): Promise<ChannelProduct[]> {
    const results: ChannelProduct[] = [];

    for (const productId of productIds) {
      const existing = await this.findChannelProduct(channelId, productId);
      if (!existing) {
        const channelProduct = ChannelProduct.create({
          channelId,
          productId,
          isVisible: true,
          isFeatured: false,
          sortOrder: 0,
        });
        const saved = await this.saveChannelProduct(channelProduct);
        results.push(saved);
      } else {
        results.push(existing);
      }
    }

    return results;
  }

  async bulkRemoveProducts(channelId: string, productIds: string[]): Promise<boolean> {
    if (productIds.length === 0) return true;

    const placeholders = productIds.map((_, i) => `$${i + 2}`).join(', ');
    await query(
      `DELETE FROM "channelProduct" WHERE "channelId" = $1 AND "productId" IN (${placeholders})`,
      [channelId, ...productIds]
    );

    return true;
  }

  // ===== Helper Methods =====

  private buildChannelWhereClause(filters?: ChannelFilters): {
    whereClause: string;
    params: any[];
  } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.type) {
      conditions.push(`type = $${params.length + 1}`);
      params.push(filters.type);
    }

    if (filters?.ownerType) {
      conditions.push(`"ownerType" = $${params.length + 1}`);
      params.push(filters.ownerType);
    }

    if (filters?.ownerId) {
      conditions.push(`"ownerId" = $${params.length + 1}`);
      params.push(filters.ownerId);
    }

    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${params.length + 1}`);
      params.push(filters.isActive);
    }

    if (filters?.isDefault !== undefined) {
      conditions.push(`"isDefault" = $${params.length + 1}`);
      params.push(filters.isDefault);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToChannel(row: Record<string, any>): Channel {
    return Channel.fromPersistence({
      channelId: row.channelId,
      name: row.name,
      code: row.code,
      type: row.type,
      ownerType: row.ownerType,
      ownerId: row.ownerId || undefined,
      storeIds: this.parseJsonArray(row.storeIds),
      defaultStoreId: row.defaultStoreId || undefined,
      catalogId: row.catalogId || undefined,
      priceListId: row.priceListId || undefined,
      currencyCode: row.currencyCode,
      localeCode: row.localeCode,
      warehouseIds: this.parseJsonArray(row.warehouseIds),
      fulfillmentStrategy: row.fulfillmentStrategy,
      requiresApproval: Boolean(row.requiresApproval),
      allowCreditPayment: Boolean(row.allowCreditPayment),
      b2bPricingEnabled: Boolean(row.b2bPricingEnabled),
      commissionRate: row.commissionRate ? parseFloat(row.commissionRate) : undefined,
      merchantVisible: row.merchantVisible ?? true,
      isActive: Boolean(row.isActive),
      isDefault: Boolean(row.isDefault),
      settings: row.settings
        ? typeof row.settings === 'string'
          ? JSON.parse(row.settings)
          : row.settings
        : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private mapToChannelProduct(row: Record<string, any>): ChannelProduct {
    return ChannelProduct.fromPersistence({
      channelProductId: row.channelProductId,
      channelId: row.channelId,
      productId: row.productId,
      isVisible: Boolean(row.isVisible),
      isFeatured: Boolean(row.isFeatured),
      priceOverride: row.priceOverride ? parseFloat(row.priceOverride) : undefined,
      salePriceOverride: row.salePriceOverride
        ? parseFloat(row.salePriceOverride)
        : undefined,
      inventoryOverride: row.inventoryOverride
        ? parseInt(row.inventoryOverride, 10)
        : undefined,
      sortOrder: parseInt(row.sortOrder || '0', 10),
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
      unpublishedAt: row.unpublishedAt ? new Date(row.unpublishedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }

  private parseJsonArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return [];
  }
}

export const channelRepository = new ChannelRepository();
export default channelRepository;
