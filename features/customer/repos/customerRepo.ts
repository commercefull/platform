import { query, queryOne } from '../../../libs/db';

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
    const customers = await query<Array<Customer>>(
      'SELECT * FROM "public"."customer" ORDER BY "lastName", "firstName" LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return customers || [];
  }

  async findCustomerById(id: string): Promise<Customer | null> {
    const customer = await queryOne<Customer>('SELECT * FROM "public"."customer" WHERE "id" = $1', [id]);
    return customer || null;
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    const customer = await queryOne<Customer>('SELECT * FROM "public"."customer" WHERE "email" = $1', [email]);
    return customer || null;
  }

  async searchCustomers(searchTerm: string, limit: number = 100): Promise<Array<Customer>> {
    const customers = await query<Array<Customer>>(
      `SELECT * FROM "public"."customer" 
       WHERE "email" ILIKE $1 OR "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR "phone" ILIKE $1
       ORDER BY "lastName", "firstName" LIMIT $2`,
      [`%${searchTerm}%`, limit]
    );
    return customers || [];
  }

  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date();
    const result = await queryOne<Customer>(
      `INSERT INTO "public"."customer" 
      ("email", "firstName", "lastName", "phone", "dateOfBirth", "isActive", 
       "isVerified", "createdAt", "updatedAt", "lastLoginAt", "notes", "metadata") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [customer.email, customer.firstName, customer.lastName, customer.phone,
       customer.dateOfBirth, customer.isActive, customer.isVerified, now, now,
       customer.lastLoginAt, customer.notes, customer.metadata]
    );
    
    if (!result) {
      throw new Error('Failed to create customer');
    }
    
    return result;
  }

  async updateCustomer(id: string, customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(customer).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
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

    const result = await queryOne<Customer>(
      `UPDATE "public"."customer" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer with ID ${id}`);
    }
    
    return result;
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
    
    return result;
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
    const addresses = await query<Array<CustomerAddress>>(
      'SELECT * FROM "public"."customer_address" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC',
      [customerId]
    );
    return addresses || [];
  }

  async findCustomerAddressById(id: string): Promise<CustomerAddress | null> {
    const address = await queryOne<CustomerAddress>('SELECT * FROM "public"."customer_address" WHERE "id" = $1', [id]);
    return address || null;
  }

  async findDefaultCustomerAddress(customerId: string, addressType: CustomerAddress['addressType']): Promise<CustomerAddress | null> {
    const address = await queryOne<CustomerAddress>(
      'SELECT * FROM "public"."customer_address" WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true LIMIT 1',
      [customerId, addressType]
    );
    return address || null;
  }

  async createCustomerAddress(address: Omit<CustomerAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerAddress> {
    const now = new Date();
    
    // If this is being set as default, clear any existing defaults of the same type
    if (address.isDefault) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true',
        [address.customerId, address.addressType]
      );
    }
    
    const result = await queryOne<CustomerAddress>(
      `INSERT INTO "public"."customer_address" 
      ("customerId", "addressLine1", "addressLine2", "city", "state", "postalCode", 
       "country", "addressType", "isDefault", "phone", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [address.customerId, address.addressLine1, address.addressLine2, address.city,
       address.state, address.postalCode, address.country, address.addressType,
       address.isDefault, address.phone, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer address');
    }
    
    return result;
  }

  async updateCustomerAddress(id: string, address: Partial<Omit<CustomerAddress, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerAddress> {
    const existingAddress = await this.findCustomerAddressById(id);
    
    if (!existingAddress) {
      throw new Error(`Customer address with ID ${id} not found`);
    }
    
    // If this is being set as default, clear any existing defaults of the same type
    if (address.isDefault && address.addressType) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true',
        [existingAddress.customerId, address.addressType]
      );
    } else if (address.isDefault && !address.addressType) {
      await query(
        'UPDATE "public"."customer_address" SET "isDefault" = false WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true',
        [existingAddress.customerId, existingAddress.addressType]
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(address).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return existingAddress;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<CustomerAddress>(
      `UPDATE "public"."customer_address" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer address with ID ${id}`);
    }
    
    return result;
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
    const groups = await query<Array<CustomerGroup>>('SELECT * FROM "public"."customer_group" ORDER BY "name" ASC');
    return groups || [];
  }

  async findCustomerGroupById(id: string): Promise<CustomerGroup | null> {
    const group = await queryOne<CustomerGroup>('SELECT * FROM "public"."customer_group" WHERE "id" = $1', [id]);
    return group || null;
  }

  async findActiveCustomerGroups(): Promise<Array<CustomerGroup>> {
    const groups = await query<Array<CustomerGroup>>(
      'SELECT * FROM "public"."customer_group" WHERE "isActive" = true ORDER BY "name" ASC'
    );
    return groups || [];
  }

  async createCustomerGroup(group: Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerGroup> {
    const now = new Date();
    const result = await queryOne<CustomerGroup>(
      `INSERT INTO "public"."customer_group" 
      ("name", "description", "discountPercentage", "isActive", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`,
      [group.name, group.description, group.discountPercentage, group.isActive, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer group');
    }
    
    return result;
  }

  async updateCustomerGroup(id: string, group: Partial<Omit<CustomerGroup, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomerGroup> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(group).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
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

    const result = await queryOne<CustomerGroup>(
      `UPDATE "public"."customer_group" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer group with ID ${id}`);
    }
    
    return result;
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
    const memberships = await query<Array<CustomerGroupMembership>>(
      'SELECT * FROM "public"."customer_group_membership" WHERE "customerId" = $1',
      [customerId]
    );
    return memberships || [];
  }

  async findCustomersInGroup(groupId: string): Promise<Array<Customer>> {
    const customers = await query<Array<Customer>>(
      `SELECT c.* FROM "public"."customer" c
       JOIN "public"."customer_group_membership" m ON c."id" = m."customerId"
       WHERE m."groupId" = $1
       ORDER BY c."lastName", c."firstName"`,
      [groupId]
    );
    return customers || [];
  }

  async addCustomerToGroup(customerId: string, groupId: string): Promise<CustomerGroupMembership> {
    // Check if membership already exists
    const existingMembership = await queryOne<CustomerGroupMembership>(
      'SELECT * FROM "public"."customer_group_membership" WHERE "customerId" = $1 AND "groupId" = $2',
      [customerId, groupId]
    );
    
    if (existingMembership) {
      return existingMembership;
    }
    
    const now = new Date();
    const result = await queryOne<CustomerGroupMembership>(
      `INSERT INTO "public"."customer_group_membership" 
      ("customerId", "groupId", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4) 
      RETURNING *`,
      [customerId, groupId, now, now]
    );
    
    if (!result) {
      throw new Error(`Failed to add customer ${customerId} to group ${groupId}`);
    }
    
    return result;
  }

  async removeCustomerFromGroup(customerId: string, groupId: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_group_membership" 
        WHERE "customerId" = $1 AND "groupId" = $2
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [customerId, groupId]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist methods
  async findCustomerWishlists(customerId: string): Promise<Array<CustomerWishlist>> {
    const wishlists = await query<Array<CustomerWishlist>>(
      'SELECT * FROM "public"."customer_wishlist" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId]
    );
    return wishlists || [];
  }

  async findCustomerWishlistById(id: string): Promise<CustomerWishlist | null> {
    const wishlist = await queryOne<CustomerWishlist>('SELECT * FROM "public"."customer_wishlist" WHERE "id" = $1', [id]);
    return wishlist || null;
  }

  async createCustomerWishlist(wishlist: Omit<CustomerWishlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerWishlist> {
    const now = new Date();
    const result = await queryOne<CustomerWishlist>(
      `INSERT INTO "public"."customer_wishlist" 
      ("customerId", "name", "isPublic", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [wishlist.customerId, wishlist.name, wishlist.isPublic, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer wishlist');
    }
    
    return result;
  }

  async updateCustomerWishlist(id: string, wishlist: Partial<Omit<CustomerWishlist, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerWishlist> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(wishlist).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
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

    const result = await queryOne<CustomerWishlist>(
      `UPDATE "public"."customer_wishlist" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer wishlist with ID ${id}`);
    }
    
    return result;
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
    const items = await query<Array<CustomerWishlistItem>>(
      'SELECT * FROM "public"."customer_wishlist_item" WHERE "wishlistId" = $1 ORDER BY "addedAt" DESC',
      [wishlistId]
    );
    return items || [];
  }

  async findWishlistItemById(id: string): Promise<CustomerWishlistItem | null> {
    const item = await queryOne<CustomerWishlistItem>('SELECT * FROM "public"."customer_wishlist_item" WHERE "id" = $1', [id]);
    return item || null;
  }

  async addItemToWishlist(item: Omit<CustomerWishlistItem, 'id'>): Promise<CustomerWishlistItem> {
    // Check if item already exists in wishlist
    const existingItem = await queryOne<CustomerWishlistItem>(
      'SELECT * FROM "public"."customer_wishlist_item" WHERE "wishlistId" = $1 AND "productId" = $2 AND "variantId" IS NOT DISTINCT FROM $3',
      [item.wishlistId, item.productId, item.variantId]
    );
    
    if (existingItem) {
      // Update the note and addedAt if needed
      if (item.note !== existingItem.note) {
        return await queryOne<CustomerWishlistItem>(
          'UPDATE "public"."customer_wishlist_item" SET "note" = $1, "addedAt" = $2 WHERE "id" = $3 RETURNING *',
          [item.note, new Date(), existingItem.id]
        ) || existingItem;
      }
      return existingItem;
    }
    
    const result = await queryOne<CustomerWishlistItem>(
      `INSERT INTO "public"."customer_wishlist_item" 
      ("wishlistId", "productId", "variantId", "addedAt", "note") 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [item.wishlistId, item.productId, item.variantId, item.addedAt || new Date(), item.note]
    );
    
    if (!result) {
      throw new Error('Failed to add item to wishlist');
    }
    
    return result;
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
    
    return result;
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
    const customers = await query<Array<Customer & { totalSpent: number; orderCount: number }>>(
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
    
    return customers || [];
  }
}
