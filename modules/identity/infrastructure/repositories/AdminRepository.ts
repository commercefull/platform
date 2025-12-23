/**
 * Admin Repository
 * Database operations for platform administrators
 */

import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../../libs/db';

export interface AdminUser {
  adminId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'support' | 'operations';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminInput {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  permissions: string[];
  status: string;
}

class AdminRepositoryClass {
  private readonly tableName = 'adminUser';

  async findByEmail(email: string): Promise<AdminUser | null> {
    const sql = `
      SELECT "adminId", "email", "name", "passwordHash", "role", 
             "permissions", "status", "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.tableName}"
      WHERE "email" = $1 AND "deletedAt" IS NULL
    `;
    const result = await queryOne<AdminUser>(sql, [email.toLowerCase()]);
    if (result) {
      result.permissions = result.permissions || [];
    }
    return result;
  }

  async findById(adminId: string): Promise<AdminUser | null> {
    const sql = `
      SELECT "adminId", "email", "name", "passwordHash", "role", 
             "permissions", "status", "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.tableName}"
      WHERE "adminId" = $1 AND "deletedAt" IS NULL
    `;
    const result = await queryOne<AdminUser>(sql, [adminId]);
    if (result) {
      result.permissions = result.permissions || [];
    }
    return result;
  }

  async create(input: CreateAdminInput): Promise<AdminUser> {
    const adminId = uuidv4();
    const now = new Date();

    const sql = `
      INSERT INTO "${this.tableName}" 
        ("adminId", "email", "name", "passwordHash", "role", "permissions", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING "adminId", "email", "name", "role", "permissions", "status", "createdAt", "updatedAt"
    `;

    const result = await queryOne<AdminUser>(sql, [
      adminId,
      input.email.toLowerCase(),
      input.name,
      input.passwordHash,
      input.role,
      JSON.stringify(input.permissions),
      input.status,
      now,
      now,
    ]);

    return result!;
  }

  async updateLastLogin(adminId: string): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "lastLoginAt" = $1, "updatedAt" = $1
      WHERE "adminId" = $2
    `;
    await query(sql, [new Date(), adminId]);
  }

  async update(adminId: string, updates: Partial<AdminUser>): Promise<AdminUser | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`"name" = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.role !== undefined) {
      fields.push(`"role" = $${paramIndex++}`);
      values.push(updates.role);
    }
    if (updates.permissions !== undefined) {
      fields.push(`"permissions" = $${paramIndex++}`);
      values.push(JSON.stringify(updates.permissions));
    }
    if (updates.status !== undefined) {
      fields.push(`"status" = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.passwordHash !== undefined) {
      fields.push(`"passwordHash" = $${paramIndex++}`);
      values.push(updates.passwordHash);
    }

    if (fields.length === 0) {
      return this.findById(adminId);
    }

    fields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(new Date());
    values.push(adminId);

    const sql = `
      UPDATE "${this.tableName}"
      SET ${fields.join(', ')}
      WHERE "adminId" = $${paramIndex}
      RETURNING "adminId", "email", "name", "role", "permissions", "status", "createdAt", "updatedAt"
    `;

    return queryOne<AdminUser>(sql, values);
  }

  async delete(adminId: string): Promise<boolean> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "deletedAt" = $1, "updatedAt" = $1
      WHERE "adminId" = $2 AND "deletedAt" IS NULL
    `;
    const result = await query(sql, [new Date(), adminId]) as any;
    return (result?.rowCount || 0) > 0;
  }

  async listAll(): Promise<AdminUser[]> {
    const sql = `
      SELECT "adminId", "email", "name", "role", "permissions", "status", 
             "lastLoginAt", "createdAt", "updatedAt"
      FROM "${this.tableName}"
      WHERE "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
    `;
    return (await query<AdminUser[]>(sql)) || [];
  }
}

export const AdminRepository = new AdminRepositoryClass();
export default AdminRepository;
