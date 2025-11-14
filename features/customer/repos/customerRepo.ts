import { query, queryOne } from '../../../libs/db';

// Field mapping dictionaries
const customerFields = {
  id: 'id',
  email: 'email',
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  dateOfBirth: 'date_of_birth',
  isActive: 'is_active',
  isVerified: 'is_verified',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  lastLoginAt: 'last_login_at',
  notes: 'note',
  metadata: 'metadata'
};

const customerAddressFields = {
  id: 'id',
  customerId: 'customer_id',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  addressType: 'address_type',
  isDefault: 'is_default',
  phone: 'phone',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const customerGroupFields = {
  id: 'id',
  name: 'name',
  description: 'description',
  discountPercentage: 'discount_percent',
  isActive: 'is_active',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const customerGroupMembershipFields = {
  id: 'id',
  customerId: 'customer_id',
  groupId: 'group_id',
  createdAt: 'added_at',
  updatedAt: 'updated_at'
};

const customerWishlistFields = {
  id: 'id',
  customerId: 'customer_id',
  name: 'name',
  isPublic: 'is_public',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const customerWishlistItemFields = {
  id: 'id',
  wishlistId: 'wishlist_id',
  productId: 'product_id',
  variantId: 'variant_id',
  addedAt: 'added_at',
  note: 'note'
};

// Transformation functions
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    result[tsKey] = dbRecord[dbKey];
  });
  
  return result as T;
}

function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords) return [];
  
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

// Helper for building dynamic WHERE clauses
function buildWhereClause(conditions: Record<string, any>, fieldMap: Record<string, string>): {
  whereClause: string;
  values: any[];
} {
  const clauses: string[] = [];
  const values: any[] = [];
  
  Object.entries(conditions).forEach(([tsKey, value], index) => {
    const dbKey = fieldMap[tsKey as keyof typeof fieldMap];
    
    if (dbKey && value !== undefined) {
      clauses.push(`"${dbKey}" = $${index + 1}`);
      values.push(value);
    }
  });
  
  return {
    whereClause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values
  };
}

// Helper for building SET clause for updates
function buildSetClause(updates: Record<string, any>, fieldMap: Record<string, string>): {
  setClause: string;
  values: any[];
} {
  const clauses: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([tsKey, value], index) => {
    const dbKey = fieldMap[tsKey as keyof typeof fieldMap];
    
    if (dbKey && value !== undefined) {
      clauses.push(`"${dbKey}" = $${index + 1}`);
      values.push(value);
    }
  });
  
  return {
    setClause: clauses.join(', '),
    values
  };
}

// Data models for customer feature
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'billing' | 'shipping';
  isDefault: boolean;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerGroupMembership {
  id: string;
  customerId: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWishlist {
  id: string;
  customerId: string;
  name: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string;
  addedAt: Date;
  note?: string;
}

export class CustomerRepo {
  // Customer methods
  async findAllCustomers(limit: number = 100, offset: number = 0): Promise<Array<Customer>> {
    const customers = await query<any[]>(
      'SELECT * FROM "public"."customer" ORDER BY "lastName", "firstName" LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return transformArrayDbToTs<Customer>(customers || [], customerFields);
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    const customer = await queryOne<Customer>('SELECT * FROM "public"."customer" WHERE "id" = $1', [id]);
    return transformDbToTs(customer, customerFields) || null;
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const customer = await queryOne<Customer>('SELECT * FROM "public"."customer" WHERE "email" = $1', [email]);
    return transformDbToTs(customer, customerFields) || null;
  }

  async searchCustomers(searchTerm: string, limit: number = 100): Promise<Array<Customer>> {
    const customers = await query<any[]>(
      `SELECT * FROM "public"."customer" 
       WHERE "email" ILIKE $1 OR "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR "phone" ILIKE $1
       ORDER BY "lastName", "firstName" LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return transformArrayDbToTs<Customer>(customers || [], customerFields);
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date();
    const result = await queryOne<Customer>(
      `INSERT INTO "public"."customer" 
      ("email", "firstName", "lastName", "phone", "date_of_birth", "isActive", 
       "isVerified", "createdAt", "updatedAt", "lastLoginAt", "note", "metadata") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [customer.email, customer.firstName, customer.lastName, customer.phone,
       customer.dateOfBirth, customer.isActive, customer.isVerified, now, now,
       customer.lastLoginAt, customer.notes, customer.metadata]
    );
    
    if (!result) {
      throw new Error('Failed to create customer');
    }
    
    return transformDbToTs(result, customerFields);
  }

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(customer).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = customerFields[key as keyof typeof customerFields];
        if (dbField) {
          updates.push(`"${dbField}" = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    });

    if (updates.length === 0) {
      const existingCustomer = await this.findCustomerById(id);
      if (!existingCustomer) {
        throw new Error(`Customer with ID ${id} not found`);
      }
      return existingCustomer;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "public"."customer" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer with ID ${id}`);
    }
    
    return transformDbToTs(result, customerFields);
  }

  async updateCustomerLoginTimestamp(id: string): Promise<Customer> {
    const now = new Date();
    const result = await queryOne<Customer>(
      `UPDATE "public"."customer" SET "lastLoginAt" = $1, "updatedAt" = $1 WHERE "id" = $2 RETURNING *`,
      [now, id]
    );
    
    if (!result) {
      throw new Error(`Failed to update login timestamp for customer with ID ${id}`);
    }
    
    return transformDbToTs(result, customerFields);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Address methods
  async findCustomerAddresses(customerId: string): Promise<Array<CustomerAddress>> {
    const addresses = await query<any[]>(
      'SELECT * FROM "public"."customer_address" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC',
      [customerId]
    );
    return transformArrayDbToTs<CustomerAddress>(addresses || [], customerAddressFields);
  }

  async findCustomerAddressById(id: string): Promise<CustomerAddress | null> {
    const address = await queryOne<CustomerAddress>('SELECT * FROM "public"."customer_address" WHERE "id" = $1', [id]);
    return transformDbToTs(address, customerAddressFields) || null;
  }

  async findDefaultCustomerAddress(customerId: string, addressType: CustomerAddress['addressType']): Promise<CustomerAddress | null> {
    const address = await queryOne<CustomerAddress>(
      'SELECT * FROM "public"."customer_address" WHERE "customerId" = $1 AND "address_type" = $2 AND "isDefault" = true LIMIT 1',
      [customerId, addressType]
    );
    return transformDbToTs(address, customerAddressFields) || null;
  }

  async createCustomerAddress(address: Omit<CustomerAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerAddress> {
    const now = new Date();
    
    // If this is being set as default, clear any existing defaults of the same type
    if (address.isDefault) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "address_type" = $2 AND "isDefault" = true',
        [address.customerId, address.addressType]
      );
    }
    
    const result = await queryOne<CustomerAddress>(
      `INSERT INTO "public"."customer_address" 
      ("customerId", "addressLine1", "addressLine2", "city", "state", "postalCode", 
       "country", "address_type", "isDefault", "phone", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [address.customerId, address.addressLine1, address.addressLine2, address.city,
       address.state, address.postalCode, address.country, address.addressType,
       address.isDefault, address.phone, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer address');
    }
    
    return transformDbToTs(result, customerAddressFields);
  }

  async updateCustomerAddress(id: string, address: Partial<Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerAddress> {
    const existingAddress = await this.findCustomerAddressById(id);
    if (!existingAddress) {
      throw new Error(`Customer address with ID ${id} not found`);
    }
    
    // If this is being set as default, clear any existing defaults of the same type
    if (address.isDefault && address.addressType) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "address_type" = $2 AND "isDefault" = true',
        [existingAddress.customerId, address.addressType]
      );
    } else if (address.isDefault && !address.addressType) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "address_type" = $2 AND "isDefault" = true',
        [existingAddress.customerId, existingAddress.addressType]
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(address).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = customerAddressFields[key as keyof typeof customerAddressFields];
        if (dbField) {
          updates.push(`"${dbField}" = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    });

    if (updates.length === 0) {
      return existingAddress;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "public"."customer_address" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer address with ID ${id}`);
    }
    
    return transformDbToTs(result, customerAddressFields);
  }

  async deleteCustomerAddress(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_address" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Group methods
  async findAllCustomerGroups(): Promise<Array<CustomerGroup>> {
    const groups = await query<any[]>('SELECT * FROM "public"."customer_group" ORDER BY "name" ASC');
    return transformArrayDbToTs<CustomerGroup>(groups || [], customerGroupFields);
  }

  async findCustomerGroupById(id: string): Promise<CustomerGroup | null> {
    const group = await queryOne<CustomerGroup>('SELECT * FROM "public"."customer_group" WHERE "id" = $1', [id]);
    return transformDbToTs(group, customerGroupFields) || null;
  }

  async findActiveCustomerGroups(): Promise<Array<CustomerGroup>> {
    const groups = await query<any[]>(
      'SELECT * FROM "public"."customer_group" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return transformArrayDbToTs<CustomerGroup>(groups || [], customerGroupFields);
  }

  async createCustomerGroup(group: Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerGroup> {
    const now = new Date();
    const result = await queryOne<CustomerGroup>(
      `INSERT INTO "public"."customer_group" 
      ("name", "description", "discount_percent", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [group.name, group.description, group.discountPercentage, group.isActive, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer group');
    }
    
    return transformDbToTs(result, customerGroupFields);
  }

  async updateCustomerGroup(id: string, group: Partial<Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerGroup> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(group).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = customerGroupFields[key as keyof typeof customerGroupFields];
        if (dbField) {
          updates.push(`"${dbField}" = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    });

    if (updates.length === 0) {
      const existingGroup = await this.findCustomerGroupById(id);
      if (!existingGroup) {
        throw new Error(`Customer group with ID ${id} not found`);
      }
      return existingGroup;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "public"."customer_group" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer group with ID ${id}`);
    }
    
    return transformDbToTs(result, customerGroupFields);
  }

  async deleteCustomerGroup(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_group" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Group Membership methods
  async findCustomerGroupMemberships(customerId: string): Promise<Array<CustomerGroupMembership>> {
    const memberships = await query<any[]>(
      'SELECT * FROM "public"."customer_group_membership" WHERE "customerId" = $1',
      [customerId]
    );
    return transformArrayDbToTs<CustomerGroupMembership>(memberships || [], customerGroupMembershipFields);
  }

  async findCustomersInGroup(groupId: string): Promise<Array<Customer>> {
    const customers = await query<any[]>(
      `SELECT c.* FROM "public"."customer" c
       JOIN "public"."customer_group_membership" m ON c."id" = m."customerId"
       WHERE m."group_id" = $1
       ORDER BY c."lastName", c."firstName"`,
      [groupId]
    );
    return transformArrayDbToTs<Customer>(customers || [], customerFields);
  }

  async addCustomerToGroup(customerId: string, groupId: string): Promise<CustomerGroupMembership> {
    // Check if membership already exists
    const existingMembership = await queryOne<CustomerGroupMembership>(
      'SELECT * FROM "public"."customer_group_membership" WHERE "customerId" = $1 AND "group_id" = $2',
      [customerId, groupId]
    );
    
    if (existingMembership) {
      return transformDbToTs(existingMembership, customerGroupMembershipFields);
    }
    
    const now = new Date();
    const result = await queryOne<CustomerGroupMembership>(
      `INSERT INTO "public"."customer_group_membership" 
      ("customerId", "group_id", "added_at", "updatedAt") 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`,
      [customerId, groupId, now, now]
    );
    
    if (!result) {
      throw new Error(`Failed to add customer ${customerId} to group ${groupId}`);
    }
    
    return transformDbToTs(result, customerGroupMembershipFields);
  }

  async removeCustomerFromGroup(customerId: string, groupId: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_group_membership" 
        WHERE "customerId" = $1 AND "group_id" = $2
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [customerId, groupId]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist methods
  async findCustomerWishlists(customerId: string): Promise<Array<CustomerWishlist>> {
    const wishlists = await query<any[]>(
      'SELECT * FROM "public"."customer_wishlist" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId]
    );
    return transformArrayDbToTs<CustomerWishlist>(wishlists || [], customerWishlistFields);
  }

  async findCustomerWishlistById(id: string): Promise<CustomerWishlist | null> {
    const wishlist = await queryOne<CustomerWishlist>('SELECT * FROM "public"."customer_wishlist" WHERE "id" = $1', [id]);
    return transformDbToTs(wishlist, customerWishlistFields) || null;
  }

  async createCustomerWishlist(wishlist: Omit<CustomerWishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerWishlist> {
    const now = new Date();
    const result = await queryOne<CustomerWishlist>(
      `INSERT INTO "public"."customer_wishlist" 
      ("customerId", "name", "is_public", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [wishlist.customerId, wishlist.name, wishlist.isPublic, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer wishlist');
    }
    
    return transformDbToTs(result, customerWishlistFields);
  }

  async updateCustomerWishlist(id: string, wishlist: Partial<Omit<CustomerWishlist, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerWishlist> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(wishlist).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = customerWishlistFields[key as keyof typeof customerWishlistFields];
        if (dbField) {
          updates.push(`"${dbField}" = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }
    });

    if (updates.length === 0) {
      const existingWishlist = await this.findCustomerWishlistById(id);
      if (!existingWishlist) {
        throw new Error(`Customer wishlist with ID ${id} not found`);
      }
      return existingWishlist;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<any>(
      `UPDATE "public"."customer_wishlist" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer wishlist with ID ${id}`);
    }
    
    return transformDbToTs(result, customerWishlistFields);
  }

  async deleteCustomerWishlist(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_wishlist" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist Item methods
  async findWishlistItems(wishlistId: string): Promise<Array<CustomerWishlistItem>> {
    const items = await query<any[]>(
      'SELECT * FROM "public"."customer_wishlist_item" WHERE "wishlist_id" = $1 ORDER BY "added_at" DESC',
      [wishlistId]
    );
    return transformArrayDbToTs<CustomerWishlistItem>(items || [], customerWishlistItemFields);
  }

  async findWishlistItemById(id: string): Promise<CustomerWishlistItem | null> {
    const item = await queryOne<CustomerWishlistItem>('SELECT * FROM "public"."customer_wishlist_item" WHERE "id" = $1', [id]);
    return transformDbToTs(item, customerWishlistItemFields) || null;
  }

  async addItemToWishlist(item: Omit<CustomerWishlistItem, 'id'>): Promise<CustomerWishlistItem> {
    // Check if item already exists in wishlist
    const existingItem = await queryOne<CustomerWishlistItem>(
      'SELECT * FROM "public"."customer_wishlist_item" WHERE "wishlist_id" = $1 AND "productId" = $2 AND "variant_id" IS NOT DISTINCT FROM $3',
      [item.wishlistId, item.productId, item.variantId]
    );
    
    if (existingItem) {
      // Update the note and addedAt if needed
      if (item.note !== existingItem.note) {
        return await queryOne<CustomerWishlistItem>(
          'UPDATE "public"."customer_wishlist_item" SET "note" = $1, "added_at" = $2 WHERE "id" = $3 RETURNING *',
          [item.note, new Date(), existingItem.id]
        ) || existingItem;
      }
      return existingItem;
    }
    
    const result = await queryOne<CustomerWishlistItem>(
      `INSERT INTO "public"."customer_wishlist_item" 
      ("wishlist_id", "productId", "variant_id", "added_at", "note") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [item.wishlistId, item.productId, item.variantId, item.addedAt || new Date(), item.note]
    );
    
    if (!result) {
      throw new Error('Failed to add item to wishlist');
    }
    
    return transformDbToTs(result, customerWishlistItemFields);
  }

  async removeItemFromWishlist(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_wishlist_item" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  async updateWishlistItemNote(id: string, note: string): Promise<CustomerWishlistItem> {
    const result = await queryOne<CustomerWishlistItem>(
      'UPDATE "public"."customer_wishlist_item" SET "note" = $1 WHERE "id" = $2 RETURNING *',
      [note, id]
    );
    
    if (!result) {
      throw new Error(`Failed to update wishlist item note for ID ${id}`);
    }
    
    return transformDbToTs(result, customerWishlistItemFields);
  }

  // Advanced customer queries
  async getCustomerStats(customerId: string): Promise<{
    orderCount: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate: Date | null;
  }> {
    const stats = await queryOne<{
      orderCount: string;
      totalSpent: string;
      averageOrderValue: string;
      lastOrderDate: Date | null;
    }>(
      `SELECT 
        COUNT(*) as "orderCount",
        SUM(total) as "totalSpent",
        AVG(total) as "averageOrderValue",
        MAX("createdAt") as "lastOrderDate"
       FROM "public"."order"
       WHERE "customerId" = $1`,
      [customerId]
    );
    
    if (!stats) {
      return {
        orderCount: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null
      };
    }
    
    return {
      orderCount: parseInt(stats.orderCount) || 0,
      totalSpent: parseFloat(stats.totalSpent) || 0,
      averageOrderValue: parseFloat(stats.averageOrderValue) || 0,
      lastOrderDate: stats.lastOrderDate
    };
  }

  async getNewCustomersCount(days: number = 30): Promise<number> {
    const result = await queryOne<{count: string}>(
      `SELECT COUNT(*) as count FROM "public"."customer"
       WHERE "createdAt" >= NOW() - INTERVAL '${days} days'`
    );
    
    return result ? parseInt(result.count) : 0;
  }

  async getTopCustomers(limit: number = 10): Promise<Array<Customer & { totalSpent: number; orderCount: number }>> {
    const customers = await query<any[]>(
      `SELECT 
        c.*,
        SUM(o.total) as "totalSpent",
        COUNT(o.id) as "orderCount"
       FROM "public"."customer" c
       JOIN "public"."order" o ON c."id" = o."customerId"
       GROUP BY c."id"
       ORDER BY "totalSpent" DESC
       LIMIT $1`,
      [limit]
    );
    return transformArrayDbToTs<Customer & { totalSpent: number; orderCount: number }>(customers || [], customerFields);
  }
}
