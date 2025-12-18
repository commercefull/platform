import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

export type OrderAddressType = 'billing' | 'shipping';

export interface OrderAddress {
  orderAddressId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  customerAddressId?: string;
  addressType: OrderAddressType;
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
  email?: string;
  isDefault: boolean;
  validatedAt?: string;
  additionalInfo?: string;
}

export type OrderAddressCreateParams = Omit<OrderAddress, 'orderAddressId' | 'createdAt' | 'updatedAt'>;
export type OrderAddressUpdateParams = Partial<Omit<OrderAddress, 'orderAddressId' | 'orderId' | 'createdAt' | 'updatedAt'>>;

export class OrderAddressRepo {
  async findById(id: string): Promise<OrderAddress | null> {
    return await queryOne<OrderAddress>(`SELECT * FROM "orderAddress" WHERE "orderAddressId" = $1`, [id]);
  }

  async findByOrderId(orderId: string): Promise<OrderAddress[]> {
    return (await query<OrderAddress[]>(
      `SELECT * FROM "orderAddress" WHERE "orderId" = $1 ORDER BY "addressType" ASC`,
      [orderId]
    )) || [];
  }

  async findByOrderIdAndType(orderId: string, addressType: OrderAddressType): Promise<OrderAddress | null> {
    return await queryOne<OrderAddress>(
      `SELECT * FROM "orderAddress" WHERE "orderId" = $1 AND "addressType" = $2`,
      [orderId, addressType]
    );
  }

  async findShippingAddress(orderId: string): Promise<OrderAddress | null> {
    return this.findByOrderIdAndType(orderId, 'shipping');
  }

  async findBillingAddress(orderId: string): Promise<OrderAddress | null> {
    return this.findByOrderIdAndType(orderId, 'billing');
  }

  async create(params: OrderAddressCreateParams): Promise<OrderAddress> {
    const now = unixTimestamp();

    const result = await queryOne<OrderAddress>(
      `INSERT INTO "orderAddress" (
        "orderId", "customerAddressId", "addressType", "firstName", "lastName", "company",
        "addressLine1", "addressLine2", "city", "state", "postalCode", "country",
        "phoneNumber", "email", "isDefault", "validatedAt", "additionalInfo", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [
        params.orderId, params.customerAddressId || null, params.addressType, params.firstName,
        params.lastName, params.company || null, params.addressLine1, params.addressLine2 || null,
        params.city, params.state, params.postalCode, params.country, params.phoneNumber || null,
        params.email || null, params.isDefault || false, params.validatedAt || null,
        params.additionalInfo || null, now, now
      ]
    );

    if (!result) throw new Error('Failed to create order address');
    return result;
  }

  async update(id: string, params: OrderAddressUpdateParams): Promise<OrderAddress | null> {
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

    return await queryOne<OrderAddress>(
      `UPDATE "orderAddress" SET ${updateFields.join(', ')} WHERE "orderAddressId" = $${paramIndex} RETURNING *`,
      values
    );
  }

  async markAsValidated(id: string): Promise<OrderAddress | null> {
    return this.update(id, { validatedAt: unixTimestamp() });
  }

  async delete(id: string): Promise<boolean> {
    const result = await queryOne<{ orderAddressId: string }>(
      `DELETE FROM "orderAddress" WHERE "orderAddressId" = $1 RETURNING "orderAddressId"`,
      [id]
    );
    return !!result;
  }

  async deleteByOrderId(orderId: string): Promise<number> {
    const results = await query<{ orderAddressId: string }[]>(
      `DELETE FROM "orderAddress" WHERE "orderId" = $1 RETURNING "orderAddressId"`,
      [orderId]
    );
    return results ? results.length : 0;
  }

  async count(orderId?: string): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM "orderAddress"`;
    const params: any[] = [];

    if (orderId) {
      sql += ` WHERE "orderId" = $1`;
      params.push(orderId);
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }
}

export default new OrderAddressRepo();
