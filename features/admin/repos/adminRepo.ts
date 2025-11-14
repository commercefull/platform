import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import * as bcrypt from 'bcryptjs';

export interface Admin {
  adminId: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export type AdminCreateParams = Omit<Admin, 'adminId' | 'createdAt' | 'updatedAt' | 'lastLoginAt'>;
export type AdminUpdateParams = Partial<Omit<Admin, 'adminId' | 'email' | 'password' | 'createdAt' | 'updatedAt'>>;
export type AdminSafeData = Omit<Admin, 'password'>;

export class AdminRepo {
  async findById(id: string): Promise<AdminSafeData | null> {
    const result = await queryOne<Admin>(`SELECT * FROM "admin" WHERE "adminId" = $1`, [id]);
    return result ? this.sanitize(result) : null;
  }

  async findByEmail(email: string): Promise<Admin | null> {
    return await queryOne<Admin>(`SELECT * FROM "admin" WHERE "email" = $1`, [email.toLowerCase()]);
  }

  async findAll(activeOnly = false): Promise<AdminSafeData[]> {
    let sql = `SELECT * FROM "admin"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    sql += ` ORDER BY "firstName", "lastName"`;
    const results = (await query<Admin[]>(sql)) || [];
    return results.map(a => this.sanitize(a));
  }

  async findByRole(role: string): Promise<AdminSafeData[]> {
    const results = (await query<Admin[]>(`SELECT * FROM "admin" WHERE "role" = $1 AND "isActive" = true ORDER BY "firstName"`, [role])) || [];
    return results.map(a => this.sanitize(a));
  }

  async create(params: AdminCreateParams): Promise<AdminSafeData> {
    const now = unixTimestamp();
    const existing = await this.findByEmail(params.email);
    if (existing) throw new Error(`Admin with email '${params.email}' already exists`);

    const hashedPassword = await bcrypt.hash(params.password, 10);

    const result = await queryOne<Admin>(
      `INSERT INTO "admin" (
        "email", "firstName", "lastName", "password", "role", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [params.email.toLowerCase(), params.firstName, params.lastName, hashedPassword, params.role || 'admin', params.isActive ?? true, now, now]
    );

    if (!result) throw new Error('Failed to create admin');
    return this.sanitize(result);
  }

  async update(id: string, params: AdminUpdateParams): Promise<AdminSafeData | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return this.findById(id);

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    const result = await queryOne<Admin>(
      `UPDATE "admin" SET ${updateFields.join(', ')} WHERE "adminId" = $${paramIndex} RETURNING *`,
      values
    );

    return result ? this.sanitize(result) : null;
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await queryOne<{ adminId: string }>(
      `UPDATE "admin" SET "password" = $1, "updatedAt" = $2 WHERE "adminId" = $3 RETURNING "adminId"`,
      [hashedPassword, unixTimestamp(), id]
    );
    return !!result;
  }

  async verifyPassword(email: string, password: string): Promise<AdminSafeData | null> {
    const admin = await this.findByEmail(email);
    if (!admin || !admin.isActive) return null;

    const isValid = await bcrypt.compare(password, admin.password);
    return isValid ? this.sanitize(admin) : null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await query(`UPDATE "admin" SET "lastLoginAt" = $1 WHERE "adminId" = $2`, [unixTimestamp(), id]);
  }

  async activate(id: string): Promise<AdminSafeData | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<AdminSafeData | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ adminId: string }>(
      `DELETE FROM "admin" WHERE "adminId" = $1 RETURNING "adminId"`,
      [id]
    );
    return !!result;
  }

  async count(activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "admin"`;
    if (activeOnly) sql += ` WHERE "isActive" = true`;
    const result = await queryOne<{ count: string }>(sql);
    return result ? parseInt(result.count, 10) : 0;
  }

  async search(searchTerm: string): Promise<AdminSafeData[]> {
    const results = (await query<Admin[]>(
      `SELECT * FROM "admin" WHERE ("firstName" ILIKE $1 OR "lastName" ILIKE $1 OR "email" ILIKE $1) AND "isActive" = true`,
      [`%${searchTerm}%`]
    )) || [];
    return results.map(a => this.sanitize(a));
  }

  async getStatistics(): Promise<{ total: number; active: number; byRole: Record<string, number> }> {
    const total = await this.count();
    const active = await this.count(true);

    const roleResults = await query<{ role: string; count: string }[]>(
      `SELECT "role", COUNT(*) as count FROM "admin" WHERE "isActive" = true GROUP BY "role"`
    );
    const byRole: Record<string, number> = {};
    roleResults?.forEach(row => { byRole[row.role] = parseInt(row.count, 10); });

    return { total, active, byRole };
  }

  private sanitize(admin: Admin): AdminSafeData {
    const { password, ...safe } = admin;
    return safe;
  }
}

export default new AdminRepo();
