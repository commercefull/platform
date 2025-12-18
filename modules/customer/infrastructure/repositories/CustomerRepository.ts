/**
 * Customer Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { 
  CustomerRepository as ICustomerRepository, 
  CustomerFilters, 
  PaginationOptions,
  PaginatedResult 
} from '../../domain/repositories/CustomerRepository';
import { Customer, CustomerAddress } from '../../domain/entities/Customer';
import type { CustomerStatus } from '../../domain/entities/Customer';

export class CustomerRepo implements ICustomerRepository {

  async findById(customerId: string): Promise<Customer | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM customer WHERE "customerId" = $1 AND "deletedAt" IS NULL',
      [customerId]
    );
    if (!row) return null;
    
    const addresses = await this.getAddresses(customerId);
    const groupIds = await this.getCustomerGroupIds(customerId);
    
    return this.mapToCustomer(row, addresses, groupIds);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM customer WHERE email = $1 AND "deletedAt" IS NULL',
      [email]
    );
    if (!row) return null;
    
    const addresses = await this.getAddresses(row.customerId);
    const groupIds = await this.getCustomerGroupIds(row.customerId);
    
    return this.mapToCustomer(row, addresses, groupIds);
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM customer WHERE phone = $1 AND "deletedAt" IS NULL',
      [phone]
    );
    if (!row) return null;
    
    const addresses = await this.getAddresses(row.customerId);
    const groupIds = await this.getCustomerGroupIds(row.customerId);
    
    return this.mapToCustomer(row, addresses, groupIds);
  }

  async findAll(filters?: CustomerFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM customer ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM customer ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const customers: Customer[] = [];
    for (const row of rows || []) {
      const addresses = await this.getAddresses(row.customerId);
      const groupIds = await this.getCustomerGroupIds(row.customerId);
      customers.push(this.mapToCustomer(row, addresses, groupIds));
    }

    return { data: customers, total, limit, offset, hasMore: offset + customers.length < total, length: total };
  }

  async save(customer: Customer): Promise<Customer> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "customerId" FROM customer WHERE "customerId" = $1',
      [customer.customerId]
    );

    if (existing) {
      await query(
        `UPDATE customer SET
          email = $1, "firstName" = $2, "lastName" = $3, phone = $4,
          "dateOfBirth" = $5, "isActive" = $6, "isVerified" = $7,
          "emailVerified" = $8, "phoneVerified" = $9, "lastLoginAt" = $10,
          timezone = $11, "acceptsMarketing" = $12, tags = $13, note = $14,
          "taxExempt" = $15, "updatedAt" = $16
        WHERE "customerId" = $17`,
        [
          customer.email, customer.firstName, customer.lastName, customer.phone || null,
          customer.dateOfBirth?.toISOString() || null, customer.status === 'active',
          customer.isVerified, customer.emailVerifiedAt !== undefined,
          customer.isVerified, customer.lastLoginAt?.toISOString() || null,
          customer.preferredLanguage || null, false,
          customer.tags.length > 0 ? JSON.stringify(customer.tags) : null,
          customer.notes || null, customer.taxExempt, now, customer.customerId
        ]
      );
    } else {
      await query(
        `INSERT INTO customer (
          "customerId", email, "firstName", "lastName", password, phone,
          "dateOfBirth", "isActive", "isVerified", "emailVerified", "phoneVerified",
          timezone, "acceptsMarketing", tags, note, "taxExempt",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          customer.customerId, customer.email, customer.firstName, customer.lastName,
          '', customer.phone || null, customer.dateOfBirth?.toISOString() || null,
          customer.status === 'active', customer.isVerified,
          customer.emailVerifiedAt !== undefined, customer.isVerified,
          customer.preferredLanguage || null, false,
          customer.tags.length > 0 ? JSON.stringify(customer.tags) : null,
          customer.notes || null, customer.taxExempt, now, now
        ]
      );
    }

    // Sync addresses
    await this.syncAddresses(customer);
    // Sync group memberships
    await this.syncGroupMemberships(customer);

    return customer;
  }

  async delete(customerId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE customer SET "deletedAt" = $1, "isActive" = false, "updatedAt" = $1 WHERE "customerId" = $2',
      [now, customerId]
    );
  }

  async count(filters?: CustomerFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM customer ${whereClause}`,
      params
    );
    return parseInt(result?.count || '0');
  }

  async updateLastLogin(customerId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE customer SET "lastLoginAt" = $1, "failedLoginAttempts" = 0, "updatedAt" = $1 WHERE "customerId" = $2',
      [now, customerId]
    );
  }

  async incrementLoginCount(customerId: string): Promise<void> {
    await query(
      'UPDATE customer SET "failedLoginAttempts" = "failedLoginAttempts" + 1 WHERE "customerId" = $1',
      [customerId]
    );
  }

  async verifyEmail(customerId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE customer SET "emailVerified" = true, "isVerified" = true, "updatedAt" = $1 WHERE "customerId" = $2',
      [now, customerId]
    );
  }

  async verifyPhone(customerId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE customer SET "phoneVerified" = true, "updatedAt" = $1 WHERE "customerId" = $2',
      [now, customerId]
    );
  }

  // Address methods
  async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "customerAddress" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" ASC',
      [customerId]
    );
    return (rows || []).map(row => this.mapToAddress(row));
  }

  async getDefaultShippingAddress(customerId: string): Promise<CustomerAddress | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "addressType" = 'shipping' AND "isDefault" = true`,
      [customerId]
    );
    return row ? this.mapToAddress(row) : null;
  }

  async getDefaultBillingAddress(customerId: string): Promise<CustomerAddress | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "customerAddress" WHERE "customerId" = $1 AND "addressType" = 'billing' AND "isDefault" = true`,
      [customerId]
    );
    return row ? this.mapToAddress(row) : null;
  }

  async saveAddress(address: CustomerAddress): Promise<CustomerAddress> {
    // For public API, get customerId from existing record
    const existing = await queryOne<Record<string, any>>(
      'SELECT "customerId" FROM "customerAddress" WHERE "customerAddressId" = $1',
      [address.addressId]
    );
    
    if (existing) {
      return this.saveAddressForCustomer(existing.customerId, address);
    }
    
    throw new Error('Cannot save new address without customerId. Use addAddress method instead.');
  }

  private async saveAddressForCustomer(customerId: string, address: CustomerAddress): Promise<CustomerAddress> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "customerAddressId" FROM "customerAddress" WHERE "customerAddressId" = $1',
      [address.addressId]
    );

    if (existing) {
      await query(
        `UPDATE "customerAddress" SET
          "firstName" = $1, "lastName" = $2, company = $3, "addressLine1" = $4,
          "addressLine2" = $5, city = $6, state = $7, "postalCode" = $8,
          country = $9, phone = $10, "addressType" = $11,
          "isDefault" = $12, "updatedAt" = $13
        WHERE "customerAddressId" = $14`,
        [
          address.firstName, address.lastName, address.company || null,
          address.addressLine1, address.addressLine2 || null, address.city,
          address.state, address.postalCode, address.country,
          address.phone || null, address.addressType, address.isDefault, now,
          address.addressId
        ]
      );
    } else {
      await query(
        `INSERT INTO "customerAddress" (
          "customerAddressId", "customerId", "firstName", "lastName", company,
          "addressLine1", "addressLine2", city, state, "postalCode",
          country, phone, "addressType", "isDefault",
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          address.addressId, customerId, address.firstName, address.lastName,
          address.company || null, address.addressLine1, address.addressLine2 || null,
          address.city, address.state, address.postalCode, address.country,
          address.phone || null, address.addressType,
          address.isDefault, now, now
        ]
      );
    }

    return address;
  }

  async deleteAddress(addressId: string): Promise<void> {
    await query('DELETE FROM "customerAddress" WHERE "customerAddressId" = $1', [addressId]);
  }

  async addAddress(customerId: string, address: CustomerAddress): Promise<CustomerAddress> {
    return this.saveAddressForCustomer(customerId, address);
  }

  async updateAddress(addressId: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const now = new Date().toISOString();
    const existing = await queryOne<Record<string, any>>(
      'SELECT * FROM "customerAddress" WHERE "customerAddressId" = $1',
      [addressId]
    );
    if (!existing) throw new Error('Address not found');
    
    const merged = { ...this.mapToAddress(existing), ...updates };
    return this.saveAddressForCustomer(existing.customerId, merged);
  }

  async setDefaultAddress(customerId: string, addressId: string, addressType: 'shipping' | 'billing'): Promise<void> {
    const now = new Date().toISOString();
    // Clear existing default
    await query(
      'UPDATE "customerAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "customerId" = $2 AND "addressType" = $3',
      [now, customerId, addressType]
    );
    // Set new default
    await query(
      'UPDATE "customerAddress" SET "isDefault" = true, "updatedAt" = $1 WHERE "customerAddressId" = $2',
      [now, addressId]
    );
  }

  // Query methods
  async findByGroup(groupId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>> {
    return this.findAll({ groupId }, pagination);
  }

  async findByTag(tag: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>> {
    return this.findAll({ tags: [tag] }, pagination);
  }

  async search(queryStr: string, pagination?: PaginationOptions): Promise<PaginatedResult<Customer>> {
    return this.findAll({ search: queryStr }, pagination);
  }

  async getCustomerGroups(customerId: string): Promise<Array<{ groupId: string; name: string }>> {
    const rows = await query<Record<string, any>[]>(
      `SELECT cg."customerGroupId", cg.name FROM "customerGroup" cg
       JOIN "customerGroupMembership" cgm ON cgm."customerGroupId" = cg."customerGroupId"
       WHERE cgm."customerId" = $1`,
      [customerId]
    );
    return (rows || []).map(row => ({ groupId: row.customerGroupId, name: row.name }));
  }

  async getPasswordHash(customerId: string): Promise<string | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT password FROM customer WHERE "customerId" = $1',
      [customerId]
    );
    return row?.password || null;
  }

  async updatePasswordHash(customerId: string, passwordHash: string): Promise<void> {
    await query(
      'UPDATE customer SET password = $1, "updatedAt" = $2 WHERE "customerId" = $3',
      [passwordHash, new Date().toISOString(), customerId]
    );
  }

  async recordFailedLogin(customerId: string): Promise<void> {
    await query(
      'UPDATE customer SET "failedLoginAttempts" = "failedLoginAttempts" + 1 WHERE "customerId" = $1',
      [customerId]
    );
  }

  async updatePassword(customerId: string, passwordHash: string): Promise<void> {
    await this.updatePasswordHash(customerId, passwordHash);
  }

  async recordLogin(customerId: string): Promise<void> {
    await this.updateLastLogin(customerId);
  }

  // Group methods
  async getCustomerGroupIds(customerId: string): Promise<string[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT "customerGroupId" FROM "customerGroupMembership" WHERE "customerId" = $1',
      [customerId]
    );
    return (rows || []).map(row => row.customerGroupId);
  }

  async addToGroup(customerId: string, groupId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "customerGroupMembership" ("customerGroupMembershipId", "customerId", "customerGroupId", "createdAt")
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [generateUUID(), customerId, groupId, now]
    );
  }

  async removeFromGroup(customerId: string, groupId: string): Promise<void> {
    await query(
      'DELETE FROM "customerGroupMembership" WHERE "customerId" = $1 AND "customerGroupId" = $2',
      [customerId, groupId]
    );
  }

  // Private helper methods
  private async syncAddresses(customer: Customer): Promise<void> {
    const existingAddresses = await query<Record<string, any>[]>(
      'SELECT "customerAddressId" FROM "customerAddress" WHERE "customerId" = $1',
      [customer.customerId]
    );
    const existingIds = new Set((existingAddresses || []).map(a => a.customerAddressId));
    const addressesToKeep = new Set<string>();

    for (const address of customer.addresses) {
      await this.saveAddressForCustomer(customer.customerId, address);
      addressesToKeep.add(address.addressId);
    }

    // Remove addresses no longer in customer
    for (const id of existingIds) {
      if (!addressesToKeep.has(id)) {
        await this.deleteAddress(id);
      }
    }
  }

  private async syncGroupMemberships(customer: Customer): Promise<void> {
    const existingGroupIds = await this.getCustomerGroupIds(customer.customerId);
    const newGroupIds = new Set(customer.groupIds);

    // Add new memberships
    for (const groupId of customer.groupIds) {
      if (!existingGroupIds.includes(groupId)) {
        await this.addToGroup(customer.customerId, groupId);
      }
    }

    // Remove old memberships
    for (const groupId of existingGroupIds) {
      if (!newGroupIds.has(groupId)) {
        await this.removeFromGroup(customer.customerId, groupId);
      }
    }
  }

  private buildWhereClause(filters?: CustomerFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      const isActive = filters.status === 'active';
      conditions.push(`"isActive" = $${paramIndex++}`);
      params.push(isActive);
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(`"isVerified" = $${paramIndex++}`);
      params.push(filters.isVerified);
    }
    if (filters?.search) {
      conditions.push(`(email ILIKE $${paramIndex} OR "firstName" ILIKE $${paramIndex} OR "lastName" ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    if (filters?.groupId) {
      conditions.push(`"customerId" IN (SELECT "customerId" FROM "customerGroupMembership" WHERE "customerGroupId" = $${paramIndex++})`);
      params.push(filters.groupId);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private mapToCustomer(row: Record<string, any>, addresses: CustomerAddress[], groupIds: string[]): Customer {
    return Customer.reconstitute({
      customerId: row.customerId,
      email: row.email,
      firstName: row.firstName || '',
      lastName: row.lastName || '',
      phone: row.phone || undefined,
      dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
      status: row.isActive ? 'active' : 'inactive',
      isVerified: Boolean(row.isVerified),
      emailVerifiedAt: row.emailVerified ? new Date(row.updatedAt) : undefined,
      phoneVerifiedAt: row.phoneVerified ? new Date(row.updatedAt) : undefined,
      addresses,
      defaultShippingAddressId: undefined,
      defaultBillingAddressId: undefined,
      preferredCurrency: 'USD',
      preferredLanguage: row.timezone || 'en',
      taxExempt: Boolean(row.taxExempt),
      taxExemptionNumber: row.taxExemptionCertificate || undefined,
      notes: row.note || undefined,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : undefined,
      loginCount: row.failedLoginAttempts || 0,
      groupIds,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }

  private mapToAddress(row: Record<string, any>): CustomerAddress {
    return {
      addressId: row.customerAddressId,
      firstName: row.firstName,
      lastName: row.lastName,
      company: row.company || undefined,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2 || undefined,
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
      countryCode: row.country, // Use country as countryCode since DB doesn't have separate column
      phone: row.phone || undefined,
      addressType: row.addressType,
      isDefault: Boolean(row.isDefault)
    };
  }
}

export default new CustomerRepo();
