import { queryOne, query } from '../../../libs/db';
import { generateUUID } from '../../../libs/uuid';
import { Channel, ChannelProduct, ChannelStatus, channelStatusToBoolean, booleanToChannelStatus } from '../domain/channel';
import { ChannelType } from '../domain/channelType';

// Field mapping for database columns to TypeScript properties (camelCase to snake_case)
const channelFields: Record<string, string> = {
  channelId: 'channel_id',
  name: 'name',
  code: 'code',
  type: 'type',
  description: 'description',
  isActive: 'is_active',
  settings: 'settings',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const channelProductFields: Record<string, string> = {
  channelProductId: 'channel_product_id',
  channelId: 'channel_id',
  productId: 'product_id',
  isActive: 'is_active',
  overrideSku: 'override_sku',
  overridePrice: 'override_price',
  sortOrder: 'sort_order',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform database record to TypeScript object
 */
const transformDbToTs = <T>(record: any, fieldMap: Record<string, string>): T => {
  if (!record) return null as any;
  
  const result: Record<string, any> = {};
  
  for (const [tsKey, dbKey] of Object.entries(fieldMap)) {
    if (record[dbKey] !== undefined) {
      // Special handling for isActive field in Channel objects
      if (tsKey === 'isActive' && fieldMap === channelFields) {
        result[tsKey] = booleanToChannelStatus(record[dbKey]);
      } else {
        result[tsKey] = record[dbKey];
      }
    }
  }
  
  return result as T;
};

/**
 * Transform array of database records to TypeScript objects
 */
const transformArrayDbToTs = <T>(records: any[], fieldMap: Record<string, string>): T[] => {
  return records.map(record => transformDbToTs<T>(record, fieldMap));
};

/**
 * Channel Repository
 */
const findAllChannels = async (filters: { 
  status?: ChannelStatus, 
  type?: ChannelType 
} = {}, 
  pagination: { limit?: number, offset?: number } = {}
): Promise<{ channels: Channel[], total: number }> => {
  try {
    const { status, type } = filters;
    const { limit, offset } = pagination;
    
    // Build WHERE clauses
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (status !== undefined) {
      conditions.push(`"isActive" = $${paramIndex}`);
      values.push(channelStatusToBoolean(status));
      paramIndex++;
    }
    
    if (type !== undefined) {
      conditions.push(`"type" = $${paramIndex}`);
      values.push(type);
      paramIndex++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countResult = await queryOne<{count: string}>(
      `SELECT COUNT(*) as count FROM "public"."channels" ${whereClause}`,
      values
    );
    
    const total = countResult && countResult.count ? parseInt(countResult.count, 10) : 0;
    
    // Build the complete query with pagination
    let sqlQuery = `SELECT * FROM "public"."channels" ${whereClause}`;
    
    // Add pagination if specified
    if (limit !== undefined) {
      sqlQuery += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
      
      if (offset !== undefined) {
        sqlQuery += ` OFFSET $${paramIndex}`;
        values.push(offset);
        paramIndex++;
      }
    }
    
    // Execute query and transform results
    const results = await query<any[]>(sqlQuery, values) || [];
    const channels = transformArrayDbToTs<Channel>(results, channelFields);
    
    return { channels, total };
  } catch (error) {
    console.error('Error finding channels:', error);
    throw error;
  }
};

/**
 * Find active channels
 */
const findActiveChannels = async (
  pagination: { limit?: number, offset?: number } = {}
): Promise<{ channels: Channel[], total: number }> => {
  return findAllChannels({ status: ChannelStatus.ACTIVE }, pagination);
};

/**
 * Find channel by ID
 */
const findById = async (id: string): Promise<Channel | null> => {
  try {
    const result = await queryOne<any>('SELECT * FROM "public"."channels" WHERE "channel_id" = $1', [id]);
    
    if (!result) {
      return null;
    }
    
    return transformDbToTs<Channel>(result, channelFields);
  } catch (error) {
    console.error(`Error finding channel by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find channel by code
 */
const findByCode = async (code: string): Promise<Channel | null> => {
  try {
    const result = await queryOne<any>('SELECT * FROM "public"."channels" WHERE "code" = $1', [code]);
    
    if (!result) {
      return null;
    }
    
    return transformDbToTs<Channel>(result, channelFields);
  } catch (error) {
    console.error(`Error finding channel by code ${code}:`, error);
    throw error;
  }
};

/**
 * Create a new channel
 */
const create = async (channelData: Partial<Channel>): Promise<Channel> => {
  try {
    const now = new Date();
    
    // Convert camelCase to snake_case for database insertion
    const dbRecord: Record<string, any> = {};
    
    for (const [tsKey, value] of Object.entries(channelData)) {
      const dbKey = channelFields[tsKey];
      if (dbKey) {
        dbRecord[dbKey] = value;
      }
    }
    
    // Set timestamps
    dbRecord.created_at = now;
    dbRecord.updated_at = now;
    
    // Generate UUID for channel ID if not provided
    if (!dbRecord.channel_id) {
      dbRecord.channel_id = generateUUID();
    }
    
    // Prepare values for query
    const values = [
      dbRecord.channel_id,
      dbRecord.name,
      dbRecord.code,
      dbRecord.type,
      dbRecord.description || null,
      dbRecord.is_active !== undefined ? dbRecord.is_active : true,
      dbRecord.settings ? JSON.stringify(dbRecord.settings) : null,
      now, // created_at
      now  // updated_at
    ];
    
    // Execute the query
    const result = await queryOne<any>(
      `INSERT INTO "public"."channels" (
        "channel_id", "name", "code", "type", "description", "isActive", "settings", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create channel');
    }
    
    const id = result.channel_id;
    
    // Fetch the created record
    const createdChannel = await findById(id);
    
    if (!createdChannel) {
      throw new Error('Failed to create channel');
    }
    
    return createdChannel;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
};

/**
 * Update a channel
 */
const update = async (id: string, channelData: Partial<Channel>): Promise<Channel> => {
  try {
    // First check if the channel exists
    const existingChannel = await findById(id);
    if (!existingChannel) {
      throw new Error(`Channel with ID ${id} not found`); 
    }
    
    // Prepare update parameters
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    // Convert camelCase to snake_case for database update
    for (const [tsKey, value] of Object.entries(channelData)) {
      if (value !== undefined) {
        const dbKey = channelFields[tsKey];
        if (dbKey) {
          updates.push(`"${dbKey}" = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    }
    
    // If no updates, return existing record
    if (updates.length === 0) {
      return existingChannel;
    }
    
    // Add updated timestamp
    const now = new Date();
    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(now);
    paramCount++;
    
    // Add ID as the last parameter
    values.push(id);
    
    // Build SQL query for update
    const sql = `UPDATE "public"."channels" SET ${updates.join(', ')} WHERE "channel_id" = $${paramCount}`;
    
    // Execute the query
    const result = await queryOne<any>(sql, values);
    
    if (!result) {
      throw new Error(`Failed to update channel with ID ${id}`);
    }
    
    return transformDbToTs<Channel>(result, channelFields);
  } catch (error) {
    console.error(`Error updating channel ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a channel
 */
const deleteChannel = async (id: string): Promise<boolean> => {
  try {
    // First check if the channel exists
    const existingChannel = await findById(id);
    if (!existingChannel) {
      return false;
    }
    
    // Delete channel products first to maintain referential integrity
    await query('DELETE FROM "public"."channel_products" WHERE "channel_id" = $1', [id]);
    
    // Delete the channel and return count of deleted records
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."channels" 
        WHERE "channel_id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result && result.count ? parseInt(result.count, 10) > 0 : false;
  } catch (error) {
    console.error(`Error deleting channel ${id}:`, error);
    throw error;
  }
};

/**
 * Find products by channel ID
 */
const findProductsByChannelId = async (
  channelId: string,
  pagination: { limit?: number, offset?: number } = {}
): Promise<{ products: ChannelProduct[], total: number }> => {
  try {
    const { limit, offset } = pagination;
    
    // Get total count for pagination
    const countResult = await queryOne<{count: string}>(
      'SELECT COUNT(*) as count FROM "public"."channel_products" WHERE "channel_id" = $1',
      [channelId]
    );
    
    const total = countResult ? parseInt(countResult.count, 10) : 0;
    
    // Build the query with pagination
    const values: any[] = [channelId];
    let paramIndex = 2;
    let sqlQuery = 'SELECT * FROM "public"."channel_products" WHERE "channel_id" = $1';
    
    if (limit !== undefined) {
      sqlQuery += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
      
      if (offset !== undefined) {
        sqlQuery += ` OFFSET $${paramIndex}`;
        values.push(offset);
        paramIndex++;
      }
    }
    
    // Execute query and transform results
    const results = await query<any[]>(sqlQuery, values) || [];
    const products = transformArrayDbToTs<ChannelProduct>(results, channelProductFields);
    
    return { products, total };
  } catch (error) {
    console.error(`Error finding products for channel ${channelId}:`, error);
    throw error;
  }
};

/**
 * Add product to channel
 */
const addProductToChannel = async (channelProductData: Partial<ChannelProduct>): Promise<ChannelProduct> => {
  try {
    const now = new Date();
    
    // Generate UUID for channel product ID if not provided
    const channelProductId = channelProductData.channelProductId || generateUUID();
    
    // Prepare values for query
    const values = [
      channelProductId,
      channelProductData.channelId,
      channelProductData.productId,
      channelProductData.isActive !== undefined ? channelProductData.isActive : true,
      channelProductData.overrideSku || null,
      channelProductData.overridePrice || null,
      channelProductData.sortOrder || 0,
      now, // created_at
      now  // updated_at
    ];
    
    // Execute the query
    const result = await queryOne<any>(
      `INSERT INTO "public"."channel_products" (
        "channel_product_id", "channel_id", "productId", "isActive", "override_sku", "override_price", "sort_order", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to add product to channel');
    }
    
    return transformDbToTs<ChannelProduct>(result, channelProductFields);
  } catch (error) {
    console.error('Error adding product to channel:', error);
    throw error;
  }
};

/**
 * Remove product from channel
 */
const removeProductFromChannel = async (channelId: string, productId: string): Promise<boolean> => {
  try {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."channel_products" 
        WHERE "channel_id" = $1 AND "productId" = $2 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [channelId, productId]
    );
    
    return result && result.count ? parseInt(result.count, 10) > 0 : false;
  } catch (error) {
    console.error(`Error removing product ${productId} from channel ${channelId}:`, error);
    throw error;
  }
};

/**
 * Find channels by product ID
 */
const findChannelsByProductId = async (productId: string): Promise<Channel[]> => {
  try {
    const sql = `
      SELECT c.* 
      FROM "public"."channels" c
      JOIN "public"."channel_products" cp ON c."channel_id" = cp."channel_id"
      WHERE cp."productId" = $1
    `;
    
    const results = await query<any[]>(sql, [productId]) || [];
    
    return transformArrayDbToTs<Channel>(results, channelFields);
  } catch (error) {
    console.error(`Error finding channels for product ${productId}:`, error);
    throw error;
  }
};

export default {
  findAllChannels,
  findActiveChannels,
  findById,
  findByCode,
  create,
  update,
  delete: deleteChannel,
  findProductsByChannelId,
  addProductToChannel,
  removeProductFromChannel,
  findChannelsByProductId
};
