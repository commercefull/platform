/**
 * Distribution Channel Repository
 * Manages sales channels and channel-product assignments
 */
import { queryOne, query } from '../../../libs/db';

// Types - will be replaced with DB types once regenerated
export interface DistributionChannel {
  distributionChannelId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  code: string;
  type: string;
  description: string | null;
  isActive: boolean;
  settings: Record<string, unknown> | null;
}

export interface DistributionChannelProduct {
  distributionChannelProductId: string;
  createdAt: Date;
  updatedAt: Date;
  distributionChannelId: string;
  productId: string;
  isActive: boolean;
  overrideSku: string | null;
  overridePrice: string | null;
  sortOrder: number;
}

export type DistributionChannelCreateParams = Omit<DistributionChannel, 'distributionChannelId' | 'createdAt' | 'updatedAt'>;
export type DistributionChannelUpdateParams = Partial<Omit<DistributionChannel, 'distributionChannelId' | 'createdAt' | 'updatedAt'>>;
export type DistributionChannelProductCreateParams = Omit<DistributionChannelProduct, 'distributionChannelProductId' | 'createdAt' | 'updatedAt'>;

// Table names
const CHANNEL_TABLE = 'distributionChannel';
const CHANNEL_PRODUCT_TABLE = 'distributionChannelProduct';

/**
 * Find all channels with optional filters and pagination
 */
async function findAll(
  filters: { isActive?: boolean; type?: string } = {},
  pagination: { limit?: number; offset?: number } = {}
): Promise<{ channels: DistributionChannel[]; total: number }> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters.isActive !== undefined) {
    conditions.push(`"isActive" = $${paramIndex++}`);
    values.push(filters.isActive);
  }

  if (filters.type) {
    conditions.push(`"type" = $${paramIndex++}`);
    values.push(filters.type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${CHANNEL_TABLE}" ${whereClause}`,
    values
  );
  const total = countResult ? parseInt(countResult.count, 10) : 0;

  // Build query with pagination
  let sql = `SELECT * FROM "${CHANNEL_TABLE}" ${whereClause} ORDER BY "name"`;
  
  if (pagination.limit !== undefined) {
    sql += ` LIMIT $${paramIndex++}`;
    values.push(pagination.limit);
    
    if (pagination.offset !== undefined) {
      sql += ` OFFSET $${paramIndex++}`;
      values.push(pagination.offset);
    }
  }

  const channels = await query<DistributionChannel[]>(sql, values) || [];
  return { channels, total };
}

/**
 * Find active channels
 */
async function findActive(pagination: { limit?: number; offset?: number } = {}): Promise<{ channels: DistributionChannel[]; total: number }> {
  return findAll({ isActive: true }, pagination);
}

/**
 * Find channel by ID
 */
async function findById(id: string): Promise<DistributionChannel | null> {
  return queryOne<DistributionChannel>(
    `SELECT * FROM "${CHANNEL_TABLE}" WHERE "distributionChannelId" = $1`,
    [id]
  );
}

/**
 * Find channel by code
 */
async function findByCode(code: string): Promise<DistributionChannel | null> {
  return queryOne<DistributionChannel>(
    `SELECT * FROM "${CHANNEL_TABLE}" WHERE "code" = $1`,
    [code]
  );
}

/**
 * Create a new channel
 */
async function create(data: DistributionChannelCreateParams): Promise<DistributionChannel | null> {
  return queryOne<DistributionChannel>(
    `INSERT INTO "${CHANNEL_TABLE}" (
      "name", "code", "type", "description", "isActive", "settings"
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.name,
      data.code,
      data.type,
      data.description || null,
      data.isActive ?? true,
      data.settings ? JSON.stringify(data.settings) : null
    ]
  );
}

/**
 * Update a channel
 */
async function update(id: string, data: DistributionChannelUpdateParams): Promise<DistributionChannel | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`"name" = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.code !== undefined) {
    updates.push(`"code" = $${paramIndex++}`);
    values.push(data.code);
  }
  if (data.type !== undefined) {
    updates.push(`"type" = $${paramIndex++}`);
    values.push(data.type);
  }
  if (data.description !== undefined) {
    updates.push(`"description" = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.isActive !== undefined) {
    updates.push(`"isActive" = $${paramIndex++}`);
    values.push(data.isActive);
  }
  if (data.settings !== undefined) {
    updates.push(`"settings" = $${paramIndex++}`);
    values.push(data.settings ? JSON.stringify(data.settings) : null);
  }

  if (updates.length === 0) {
    return findById(id);
  }

  updates.push(`"updatedAt" = NOW()`);
  values.push(id);

  return queryOne<DistributionChannel>(
    `UPDATE "${CHANNEL_TABLE}" SET ${updates.join(', ')} WHERE "distributionChannelId" = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Delete a channel
 */
async function deleteChannel(id: string): Promise<boolean> {
  const result = await queryOne<{ distributionChannelId: string }>(
    `DELETE FROM "${CHANNEL_TABLE}" WHERE "distributionChannelId" = $1 RETURNING "distributionChannelId"`,
    [id]
  );
  return !!result;
}

/**
 * Find products assigned to a channel
 */
async function findProductsByChannelId(
  channelId: string,
  pagination: { limit?: number; offset?: number } = {}
): Promise<{ products: DistributionChannelProduct[]; total: number }> {
  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${CHANNEL_PRODUCT_TABLE}" WHERE "distributionChannelId" = $1`,
    [channelId]
  );
  const total = countResult ? parseInt(countResult.count, 10) : 0;

  const values: any[] = [channelId];
  let paramIndex = 2;
  let sql = `SELECT * FROM "${CHANNEL_PRODUCT_TABLE}" WHERE "distributionChannelId" = $1 ORDER BY "sortOrder"`;

  if (pagination.limit !== undefined) {
    sql += ` LIMIT $${paramIndex++}`;
    values.push(pagination.limit);
    
    if (pagination.offset !== undefined) {
      sql += ` OFFSET $${paramIndex++}`;
      values.push(pagination.offset);
    }
  }

  const products = await query<DistributionChannelProduct[]>(sql, values) || [];
  return { products, total };
}

/**
 * Add a product to a channel
 */
async function addProductToChannel(data: DistributionChannelProductCreateParams): Promise<DistributionChannelProduct | null> {
  return queryOne<DistributionChannelProduct>(
    `INSERT INTO "${CHANNEL_PRODUCT_TABLE}" (
      "distributionChannelId", "productId", "isActive", "overrideSku", "overridePrice", "sortOrder"
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.distributionChannelId,
      data.productId,
      data.isActive ?? true,
      data.overrideSku || null,
      data.overridePrice || null,
      data.sortOrder ?? 0
    ]
  );
}

/**
 * Remove a product from a channel
 */
async function removeProductFromChannel(channelId: string, productId: string): Promise<boolean> {
  const result = await queryOne<{ distributionChannelProductId: string }>(
    `DELETE FROM "${CHANNEL_PRODUCT_TABLE}" 
     WHERE "distributionChannelId" = $1 AND "productId" = $2 
     RETURNING "distributionChannelProductId"`,
    [channelId, productId]
  );
  return !!result;
}

/**
 * Find channels that contain a specific product
 */
async function findChannelsByProductId(productId: string): Promise<DistributionChannel[]> {
  const result = await query<DistributionChannel[]>(
    `SELECT c.* FROM "${CHANNEL_TABLE}" c
     JOIN "${CHANNEL_PRODUCT_TABLE}" cp ON c."distributionChannelId" = cp."distributionChannelId"
     WHERE cp."productId" = $1`,
    [productId]
  );
  return result || [];
}

/**
 * Update a channel product assignment
 */
async function updateChannelProduct(
  channelId: string,
  productId: string,
  data: Partial<Pick<DistributionChannelProduct, 'isActive' | 'overrideSku' | 'overridePrice' | 'sortOrder'>>
): Promise<DistributionChannelProduct | null> {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.isActive !== undefined) {
    updates.push(`"isActive" = $${paramIndex++}`);
    values.push(data.isActive);
  }
  if (data.overrideSku !== undefined) {
    updates.push(`"overrideSku" = $${paramIndex++}`);
    values.push(data.overrideSku);
  }
  if (data.overridePrice !== undefined) {
    updates.push(`"overridePrice" = $${paramIndex++}`);
    values.push(data.overridePrice);
  }
  if (data.sortOrder !== undefined) {
    updates.push(`"sortOrder" = $${paramIndex++}`);
    values.push(data.sortOrder);
  }

  if (updates.length === 0) {
    return queryOne<DistributionChannelProduct>(
      `SELECT * FROM "${CHANNEL_PRODUCT_TABLE}" WHERE "distributionChannelId" = $1 AND "productId" = $2`,
      [channelId, productId]
    );
  }

  updates.push(`"updatedAt" = NOW()`);
  values.push(channelId, productId);

  return queryOne<DistributionChannelProduct>(
    `UPDATE "${CHANNEL_PRODUCT_TABLE}" SET ${updates.join(', ')} 
     WHERE "distributionChannelId" = $${paramIndex++} AND "productId" = $${paramIndex}
     RETURNING *`,
    values
  );
}

export default {
  findAll,
  findActive,
  findById,
  findByCode,
  create,
  update,
  delete: deleteChannel,
  findProductsByChannelId,
  addProductToChannel,
  removeProductFromChannel,
  findChannelsByProductId,
  updateChannelProduct
};
