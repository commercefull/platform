import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type SupplierAddressType = 'headquarters' | 'billing' | 'warehouse' | 'returns' | 'manufacturing';

export interface SupplierAddress {
  supplierAddressId: string;
  createdAt: string;
  updatedAt: string;
  supplierId: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: SupplierAddressType;
  isDefault: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  isActive: boolean;
}

export type SupplierAddressCreateParams = Omit<SupplierAddress, 'supplierAddressId' | 'createdAt' | 'updatedAt'>;
export type SupplierAddressUpdateParams = Partial<Omit<SupplierAddress, 'supplierAddressId' | 'supplierId' | 'createdAt' | 'updatedAt'>>;

export class SupplierAddressRepo {
  async findById(id: string): Promise<SupplierAddress | null> {
    return await queryOne<SupplierAddress>(`SELECT * FROM "supplierAddress" WHERE "supplierAddressId" = $1`, [id]);
  }

  async findBySupplierId(supplierId: string, activeOnly = false): Promise<SupplierAddress[]> {
    let sql = `SELECT * FROM "supplierAddress" WHERE "supplierId" = $1`;
    if (activeOnly) sql += ` AND "isActive" = true`;
    sql += ` ORDER BY "isDefault" DESC, "addressType" ASC`;
    return (await query<SupplierAddress[]>(sql, [supplierId])) || [];
  }

  async findDefaultBySupplierId(supplierId: string): Promise<SupplierAddress | null> {
    return await queryOne<SupplierAddress>(
      `SELECT * FROM "supplierAddress" WHERE "supplierId" = $1 AND "isDefault" = true AND "isActive" = true LIMIT 1`,
      [supplierId]
    );
  }

  async findByType(supplierId: string, addressType: SupplierAddressType): Promise<SupplierAddress[]> {
    return (await query<SupplierAddress[]>(
      `SELECT * FROM "supplierAddress" WHERE "supplierId" = $1 AND "addressType" = $2 AND "isActive" = true ORDER BY "isDefault" DESC`,
      [supplierId, addressType]
    )) || [];
  }

  async create(params: SupplierAddressCreateParams): Promise<SupplierAddress> {
    const now = unixTimestamp();

    if (params.isDefault) {
      await this.unsetDefaults(params.supplierId);
    }

    const result = await queryOne<SupplierAddress>(
      `INSERT INTO "supplierAddress" (
        "supplierId", "name", "addressLine1", "addressLine2", "city", "state", "postalCode",
        "country", "addressType", "isDefault", "contactName", "contactEmail", "contactPhone",
        "notes", "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [
        params.supplierId, params.name, params.addressLine1, params.addressLine2 || null,
        params.city, params.state, params.postalCode, params.country, params.addressType || 'headquarters',
        params.isDefault || false, params.contactName || null, params.contactEmail || null,
        params.contactPhone || null, params.notes || null, params.isActive ?? true, now, now
      ]
    );

    if (!result) throw new Error('Failed to create supplier address');
    return result;
  }

  async update(id: string, params: SupplierAddressUpdateParams): Promise<SupplierAddress | null> {
    const address = await this.findById(id);
    if (!address) return null;

    if (params.isDefault === true) {
      await this.unsetDefaults(address.supplierId, id);
    }

    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) return address;

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp(), id);

    return await queryOne<SupplierAddress>(
      `UPDATE "supplierAddress" SET ${updateFields.join(', ')} WHERE "supplierAddressId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  private async unsetDefaults(supplierId: string, exceptId?: string): Promise<void> {
    let sql = `UPDATE "supplierAddress" SET "isDefault" = false, "updatedAt" = $1 WHERE "supplierId" = $2 AND "isDefault" = true`;
    const params: any[] = [unixTimestamp(), supplierId];
    if (exceptId) {
      sql += ` AND "supplierAddressId" != $3`;
      params.push(exceptId);
    }
    await query(sql, params);
  }

  async activate(id: string): Promise<SupplierAddress | null> {
    return this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<SupplierAddress | null> {
    return this.update(id, { isActive: false });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ supplierAddressId: string }>(
      `DELETE FROM "supplierAddress" WHERE "supplierAddressId" = $1 RETURNING "supplierAddressId"`,
      [id]
    );
    return !!result;
  }

  async count(supplierId?: string, activeOnly = false): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "supplierAddress"`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (supplierId) {
      conditions.push(`"supplierId" = $${params.length + 1}`);
      params.push(supplierId);
    }
    if (activeOnly) {
      conditions.push(`"isActive" = true`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new SupplierAddressRepo();
