import { query, queryOne } from '../../../libs/db';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

// Import types from generated DB types - single source of truth
import {
  Customer as DbCustomer,
  CustomerAddress as DbCustomerAddress,
  CustomerGroup as DbCustomerGroup,
  CustomerGroupMembership as DbCustomerGroupMembership,
  CustomerWishlist as DbCustomerWishlist,
  CustomerWishlistItem as DbCustomerWishlistItem,
} from '../../../libs/db/types';

// Re-export DB types for use in this feature
export type Customer = DbCustomer;
export type CustomerAddress = DbCustomerAddress;
export type CustomerGroup = DbCustomerGroup;
export type CustomerGroupMembership = DbCustomerGroupMembership;
export type CustomerWishlist = DbCustomerWishlist;
export type CustomerWishlistItem = DbCustomerWishlistItem;

// Custom types not in DB schema (for application logic)
export interface CustomerAuthCredentials {
  email: string;
  password: string;
}

export interface CustomerAuthResult {
  customerId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}

export interface CustomerCreateParams {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
  isVerified?: boolean;
  lastLoginAt?: Date;
  note?: string;
}

export class CustomerRepo {
  // Customer methods
  async findAllCustomers(limit: number = 100, offset: number = 0): Promise<Customer[]> {
    const customers = await query<Customer[]>('SELECT * FROM "customer" ORDER BY "lastName", "firstName" LIMIT $1 OFFSET $2', [
      limit,
      offset,
    ]);
    return customers || [];
  }

  async findCustomerById(customerId: string): Promise<Customer | null> {
    return await queryOne<Customer>('SELECT * FROM "customer" WHERE "customerId" = $1', [customerId]);
  }

  async findCustomerByEmail(email: string): Promise<Customer | null> {
    return await queryOne<Customer>('SELECT * FROM "customer" WHERE "email" = $1', [email]);
  }

  async authenticateCustomer(credentials: CustomerAuthCredentials): Promise<CustomerAuthResult | null> {
    const { email, password } = credentials;

    const customer = await queryOne<{ customerId: string; email: string; password: string; firstName?: string; lastName?: string }>(
      'SELECT "customerId", "email", "password", "firstName", "lastName" FROM "customer" WHERE "email" = $1',
      [email],
    );

    if (!customer) {
      return null;
    }

    const isPasswordValid = await bcryptjs.compare(password, customer.password);
    if (!isPasswordValid) {
      return null;
    }

    return {
      customerId: customer.customerId,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcryptjs.hash(password, 10);
  }

  async searchCustomers(searchTerm: string, limit: number = 100): Promise<Customer[]> {
    const customers = await query<Customer[]>(
      `SELECT * FROM "customer" 
       WHERE "email" ILIKE $1 OR "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR "phone" ILIKE $1
       ORDER BY "lastName", "firstName" LIMIT $2`,
      [`%${searchTerm}%`, limit],
    );
    return customers || [];
  }

  async createCustomerWithPassword(params: CustomerCreateParams): Promise<Customer> {
    const now = new Date();
    const hashedPassword = await this.hashPassword(params.password);

    const result = await queryOne<Customer>(
      `INSERT INTO "customer"
       ("email", "firstName", "lastName", "password", "phone", "dateOfBirth", "isActive", "isVerified", "createdAt", "updatedAt", "lastLoginAt", "note")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)
       RETURNING *`,
      [
        params.email,
        params.firstName,
        params.lastName,
        hashedPassword,
        params.phone ?? null,
        params.dateOfBirth ?? null,
        params.isActive ?? true,
        params.isVerified ?? false,
        now,
        params.lastLoginAt ?? null,
        params.note ?? null,
      ],
    );

    if (!result) {
      throw new Error('Failed to create customer');
    }
    return result;
  }

  async updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
    const fields = ['email', 'firstName', 'lastName', 'phone', 'dateOfBirth', 'isActive', 'isVerified', 'lastLoginAt', 'note'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (updates[field as keyof Customer] !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field as keyof Customer]);
      }
    }

    if (setClauses.length === 0) {
      const existing = await this.findCustomerById(customerId);
      if (!existing) throw new Error(`Customer ${customerId} not found`);
      return existing;
    }

    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(customerId);

    const result = await queryOne<Customer>(
      `UPDATE "customer" SET ${setClauses.join(', ')} WHERE "customerId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) throw new Error(`Failed to update customer ${customerId}`);
    return result;
  }

  async updateCustomerLoginTimestamp(customerId: string): Promise<Customer> {
    const now = new Date();
    const result = await queryOne<Customer>(
      'UPDATE "customer" SET "lastLoginAt" = $1, "updatedAt" = $1 WHERE "customerId" = $2 RETURNING *',
      [now, customerId],
    );
    if (!result) throw new Error(`Failed to update login timestamp for ${customerId}`);
    return result;
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customer" WHERE "customerId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [customerId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  async createPasswordResetToken(customerId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcryptjs.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const now = new Date();

    await queryOne(
      `INSERT INTO "customerPasswordReset" ("customerId", "token", "expiresAt", "isUsed", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, false, $4, $4) RETURNING "customerPasswordResetId"`,
      [customerId, hashedToken, expiresAt, now],
    );
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<string | null> {
    const resetRecord = await queryOne<{ customerPasswordResetId: string; customerId: string; token: string }>(
      `SELECT "customerPasswordResetId", "customerId", "token" FROM "customerPasswordReset"
       WHERE "isUsed" = false AND "expiresAt" > $1 ORDER BY "createdAt" DESC LIMIT 1`,
      [new Date()],
    );

    if (!resetRecord) return null;

    const isValid = await bcryptjs.compare(token, resetRecord.token);
    if (!isValid) return null;

    await queryOne('UPDATE "customerPasswordReset" SET "isUsed" = true, "updatedAt" = $1 WHERE "customerPasswordResetId" = $2', [
      new Date(),
      resetRecord.customerPasswordResetId,
    ]);
    return resetRecord.customerId;
  }

  async changePassword(customerId: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(newPassword);
    const result = await queryOne<{ customerId: string }>(
      'UPDATE "customer" SET "password" = $1, "updatedAt" = $2 WHERE "customerId" = $3 RETURNING "customerId"',
      [hashedPassword, new Date(), customerId],
    );
    return !!result;
  }

  // Customer Address methods
  async findCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    const addresses = await query<CustomerAddress[]>(
      'SELECT * FROM "customerAddress" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC',
      [customerId],
    );
    return addresses || [];
  }

  async findCustomerAddressById(addressId: string): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>('SELECT * FROM "customerAddress" WHERE "customerAddressId" = $1', [addressId]);
  }

  async findDefaultCustomerAddress(customerId: string, addressType: CustomerAddress['addressType']): Promise<CustomerAddress | null> {
    return await queryOne<CustomerAddress>(
      'SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true LIMIT 1',
      [customerId, addressType],
    );
  }

  async createCustomerAddress(address: Omit<CustomerAddress, 'customerAddressId' | 'createdAt' | 'updatedAt'>): Promise<CustomerAddress> {
    const now = new Date();

    if (address.isDefault) {
      await query(
        'UPDATE "customerAddress" SET "isDefault" = false WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true',
        [address.customerId, address.addressType],
      );
    }

    const result = await queryOne<CustomerAddress>(
      `INSERT INTO "customerAddress" 
      ("customerId", "addressLine1", "addressLine2", "city", "state", "postalCode", "country", "addressType", "isDefault", "phone", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        address.customerId,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.postalCode,
        address.country,
        address.addressType,
        address.isDefault,
        address.phone,
        now,
        now,
      ],
    );

    if (!result) throw new Error('Failed to create customer address');
    return result;
  }

  async updateCustomerAddress(addressId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const existing = await this.findCustomerAddressById(addressId);
    if (!existing) throw new Error(`Address ${addressId} not found`);

    if (updates.isDefault) {
      await query(
        'UPDATE "customerAddress" SET "isDefault" = false WHERE "customerId" = $1 AND "addressType" = $2 AND "isDefault" = true',
        [existing.customerId, updates.addressType || existing.addressType],
      );
    }

    const fields = ['addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'addressType', 'isDefault', 'phone'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (updates[field as keyof CustomerAddress] !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field as keyof CustomerAddress]);
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(addressId);

    const result = await queryOne<CustomerAddress>(
      `UPDATE "customerAddress" SET ${setClauses.join(', ')} WHERE "customerAddressId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) throw new Error(`Failed to update address ${addressId}`);
    return result;
  }

  async deleteCustomerAddress(addressId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerAddress" WHERE "customerAddressId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [addressId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Group methods
  async findAllCustomerGroups(): Promise<CustomerGroup[]> {
    const groups = await query<CustomerGroup[]>('SELECT * FROM "customerGroup" ORDER BY "name" ASC');
    return groups || [];
  }

  async findCustomerGroupById(groupId: string): Promise<CustomerGroup | null> {
    return await queryOne<CustomerGroup>('SELECT * FROM "customerGroup" WHERE "customerGroupId" = $1', [groupId]);
  }

  async findActiveCustomerGroups(): Promise<CustomerGroup[]> {
    const groups = await query<CustomerGroup[]>('SELECT * FROM "customerGroup" WHERE "isActive" = true ORDER BY "name" ASC');
    return groups || [];
  }

  async createCustomerGroup(group: Omit<CustomerGroup, 'customerGroupId' | 'createdAt' | 'updatedAt'>): Promise<CustomerGroup> {
    const now = new Date();
    const code = group.name.toLowerCase().replace(/\s+/g, '-');
    const result = await queryOne<CustomerGroup>(
      `INSERT INTO "customerGroup" ("name", "description", "discountPercent", "isActive", "code", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [group.name, group.description, group.discountPercent, group.isActive, code, now, now],
    );
    if (!result) throw new Error('Failed to create customer group');
    return result;
  }

  async updateCustomerGroup(groupId: string, updates: Partial<CustomerGroup>): Promise<CustomerGroup> {
    const existing = await this.findCustomerGroupById(groupId);
    if (!existing) throw new Error(`Group ${groupId} not found`);

    const fields = ['name', 'description', 'discountPercent', 'isActive'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (updates[field as keyof CustomerGroup] !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field as keyof CustomerGroup]);
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(groupId);

    const result = await queryOne<CustomerGroup>(
      `UPDATE "customerGroup" SET ${setClauses.join(', ')} WHERE "customerGroupId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) throw new Error(`Failed to update group ${groupId}`);
    return result;
  }

  async deleteCustomerGroup(groupId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerGroup" WHERE "customerGroupId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [groupId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Group Membership methods
  async findCustomerGroupMemberships(customerId: string): Promise<CustomerGroupMembership[]> {
    const memberships = await query<CustomerGroupMembership[]>('SELECT * FROM "customerGroupMembership" WHERE "customerId" = $1', [
      customerId,
    ]);
    return memberships || [];
  }

  async findCustomersInGroup(groupId: string): Promise<Customer[]> {
    const customers = await query<Customer[]>(
      `SELECT c.* FROM "customer" c
       JOIN "customerGroupMembership" m ON c."customerId" = m."customerId"
       WHERE m."customerGroupId" = $1
       ORDER BY c."lastName", c."firstName"`,
      [groupId],
    );
    return customers || [];
  }

  async addCustomerToGroup(customerId: string, groupId: string): Promise<CustomerGroupMembership> {
    const existing = await queryOne<CustomerGroupMembership>(
      'SELECT * FROM "customerGroupMembership" WHERE "customerId" = $1 AND "customerGroupId" = $2',
      [customerId, groupId],
    );
    if (existing) return existing;

    const result = await queryOne<CustomerGroupMembership>(
      `INSERT INTO "customerGroupMembership" ("customerId", "customerGroupId", "createdAt") VALUES ($1, $2, $3) RETURNING *`,
      [customerId, groupId, new Date()],
    );
    if (!result) throw new Error(`Failed to add customer ${customerId} to group ${groupId}`);
    return result;
  }

  async removeCustomerFromGroup(customerId: string, groupId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerGroupMembership" WHERE "customerId" = $1 AND "customerGroupId" = $2 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [customerId, groupId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist methods
  async findCustomerWishlists(customerId: string): Promise<CustomerWishlist[]> {
    const wishlists = await query<CustomerWishlist[]>(
      'SELECT * FROM "customerWishlist" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId],
    );
    return wishlists || [];
  }

  async findCustomerWishlistById(wishlistId: string): Promise<CustomerWishlist | null> {
    return await queryOne<CustomerWishlist>('SELECT * FROM "customerWishlist" WHERE "customerWishlistId" = $1', [wishlistId]);
  }

  async createCustomerWishlist(
    wishlist: Omit<CustomerWishlist, 'customerWishlistId' | 'createdAt' | 'updatedAt'>,
  ): Promise<CustomerWishlist> {
    const now = new Date();
    const result = await queryOne<CustomerWishlist>(
      `INSERT INTO "customerWishlist" ("customerId", "wishlistName", "isPublic", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [wishlist.customerId, wishlist.wishlistName, wishlist.isPublic, now, now],
    );
    if (!result) throw new Error('Failed to create wishlist');
    return result;
  }

  async updateCustomerWishlist(wishlistId: string, updates: Partial<CustomerWishlist>): Promise<CustomerWishlist> {
    const existing = await this.findCustomerWishlistById(wishlistId);
    if (!existing) throw new Error(`Wishlist ${wishlistId} not found`);

    const fields = ['wishlistName', 'isPublic'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of fields) {
      if (updates[field as keyof CustomerWishlist] !== undefined) {
        setClauses.push(`"${field}" = $${paramIndex++}`);
        values.push(updates[field as keyof CustomerWishlist]);
      }
    }

    if (setClauses.length === 0) return existing;

    setClauses.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(wishlistId);

    const result = await queryOne<CustomerWishlist>(
      `UPDATE "customerWishlist" SET ${setClauses.join(', ')} WHERE "customerWishlistId" = $${paramIndex} RETURNING *`,
      values,
    );

    if (!result) throw new Error(`Failed to update wishlist ${wishlistId}`);
    return result;
  }

  async deleteCustomerWishlist(wishlistId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerWishlist" WHERE "customerWishlistId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [wishlistId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Wishlist Item methods
  async findWishlistItems(wishlistId: string): Promise<CustomerWishlistItem[]> {
    const items = await query<CustomerWishlistItem[]>(
      'SELECT * FROM "customerWishlistItem" WHERE "customerWishlistId" = $1 ORDER BY "createdAt" DESC',
      [wishlistId],
    );
    return items || [];
  }

  async findWishlistItemById(itemId: string): Promise<CustomerWishlistItem | null> {
    return await queryOne<CustomerWishlistItem>('SELECT * FROM "customerWishlistItem" WHERE "customerWishlistItemId" = $1', [itemId]);
  }

  async addItemToWishlist(item: Omit<CustomerWishlistItem, 'customerWishlistItemId'>): Promise<CustomerWishlistItem> {
    const existing = await queryOne<CustomerWishlistItem>(
      'SELECT * FROM "customerWishlistItem" WHERE "customerWishlistId" = $1 AND "productId" = $2 AND "productVariantId" IS NOT DISTINCT FROM $3',
      [item.customerWishlistId, item.productId, item.productVariantId],
    );

    if (existing) {
      if (item.note !== existing.note) {
        const updated = await queryOne<CustomerWishlistItem>(
          'UPDATE "customerWishlistItem" SET "note" = $1, "updatedAt" = $2 WHERE "customerWishlistItemId" = $3 RETURNING *',
          [item.note, new Date(), existing.customerWishlistItemId],
        );
        return updated || existing;
      }
      return existing;
    }

    const result = await queryOne<CustomerWishlistItem>(
      `INSERT INTO "customerWishlistItem" ("customerWishlistId", "productId", "productVariantId", "note", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [item.customerWishlistId, item.productId, item.productVariantId, item.note, new Date(), new Date()],
    );
    if (!result) throw new Error('Failed to add item to wishlist');
    return result;
  }

  async removeItemFromWishlist(itemId: string): Promise<boolean> {
    const result = await queryOne<{ count: string }>(
      `WITH deleted AS (DELETE FROM "customerWishlistItem" WHERE "customerWishlistItemId" = $1 RETURNING *) SELECT COUNT(*) as count FROM deleted`,
      [itemId],
    );
    return result ? parseInt(result.count) > 0 : false;
  }

  async updateWishlistItemNote(itemId: string, note: string): Promise<CustomerWishlistItem> {
    const result = await queryOne<CustomerWishlistItem>(
      'UPDATE "customerWishlistItem" SET "note" = $1 WHERE "customerWishlistItemId" = $2 RETURNING *',
      [note, itemId],
    );
    if (!result) throw new Error(`Failed to update wishlist item ${itemId}`);
    return result;
  }

  // Advanced customer queries
  async getCustomerStats(
    customerId: string,
  ): Promise<{ orderCount: number; totalSpent: number; averageOrderValue: number; lastOrderDate: Date | null }> {
    const stats = await queryOne<{ orderCount: string; totalSpent: string; averageOrderValue: string; lastOrderDate: Date | null }>(
      `SELECT COUNT(*) as "orderCount", COALESCE(SUM("grandTotal"), 0) as "totalSpent", COALESCE(AVG("grandTotal"), 0) as "averageOrderValue", MAX("createdAt") as "lastOrderDate"
       FROM "order" WHERE "customerId" = $1`,
      [customerId],
    );

    return {
      orderCount: parseInt(stats?.orderCount || '0'),
      totalSpent: parseFloat(stats?.totalSpent || '0'),
      averageOrderValue: parseFloat(stats?.averageOrderValue || '0'),
      lastOrderDate: stats?.lastOrderDate || null,
    };
  }

  async getNewCustomersCount(days: number = 30): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "customer" WHERE "createdAt" >= NOW() - INTERVAL '${days} days'`,
    );
    return parseInt(result?.count || '0');
  }

  async getTopCustomers(limit: number = 10): Promise<(Customer & { totalSpent: number; orderCount: number })[]> {
    const customers = await query<(Customer & { totalSpent: number; orderCount: number })[]>(
      `SELECT c.*, COALESCE(SUM(o."grandTotal"), 0) as "totalSpent", COUNT(o."orderId") as "orderCount"
       FROM "customer" c LEFT JOIN "order" o ON c."customerId" = o."customerId"
       GROUP BY c."customerId" ORDER BY "totalSpent" DESC LIMIT $1`,
      [limit],
    );
    return customers || [];
  }
}
