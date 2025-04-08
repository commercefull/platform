  import { query, queryOne } from "../../../libs/db";

export type CouponCreateProps = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiryDate: Date;
  usageLimit: number;
  usageCount: number;
  status: "active" | "inactive";
  description: string;
  createdBy: string;
  updatedBy: string;
};

export type CouponUpdateProps = Partial<CouponCreateProps>;

export interface Coupon {
  couponId: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expiryDate: Date;
  usageLimit: number;
  usageCount: number;
  status: "active" | "inactive";
  description: string;
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
  deletedFlag: boolean;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string;
}

export class CouponRepo {
  async create(props: CouponCreateProps): Promise<Coupon> {
    const {
      code,
      type,
      value,
      expiryDate,
      usageLimit,
      usageCount,
      status,
      description,
      createdBy,
      updatedBy
    } = props;

    const sql = `
      INSERT INTO "public"."coupon" (
        "code", "type", "value", "expiryDate", "usageLimit", "usageCount", 
        "status", "description", "createdDate", "updatedDate", "deletedFlag", 
        "createdBy", "updatedBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), false, $9, $10) 
      RETURNING *;
    `;

    const data = await queryOne<Coupon>(sql, [
      code,
      type,
      value,
      expiryDate,
      usageLimit,
      usageCount,
      status,
      description,
      createdBy,
      updatedBy
    ]);

    if (!data) {
      throw new Error('Coupon not saved');
    }

    return data;
  }

  async update(props: CouponUpdateProps, couponId: string): Promise<Coupon> {
    // Create dynamic query based on provided properties
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Add each property that exists in props to the update query
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedDate
    updateFields.push(`"updatedDate" = NOW()`);
    
    // Add the couponId as the last parameter
    params.push(couponId);

    const sql = `
      UPDATE "public"."coupon"
      SET ${updateFields.join(', ')}
      WHERE "couponId" = $${paramIndex}
      RETURNING *;
    `;

    const data = await queryOne<Coupon>(sql, params);

    if (!data) {
      throw new Error('Coupon not found');
    }

    return data;
  }

  async getById(couponId: string): Promise<Coupon | null> {
    const sql = `
      SELECT * FROM "public"."coupon"
      WHERE "couponId" = $1 AND "deletedFlag" = false;
    `;

    return await queryOne<Coupon>(sql, [couponId]);
  }

  async getByCode(code: string): Promise<Coupon | null> {
    const sql = `
      SELECT * FROM "public"."coupon"
      WHERE "code" = $1 AND "deletedFlag" = false;
    `;

    return await queryOne<Coupon>(sql, [code]);
  }

  async delete(couponId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."coupon"
      SET "deletedFlag" = true, "deletedDate" = NOW(), "deletedBy" = $1
      WHERE "couponId" = $2;
    `;

    await queryOne(sql, [deletedBy, couponId]);
  }

  async findActiveCoupons(): Promise<Coupon[] | null> {
    const sql = `
      SELECT * FROM "public"."coupon"
      WHERE "status" = 'active' 
      AND "deletedFlag" = false 
      AND "expiryDate" > NOW()
      AND "usageCount" < "usageLimit";
    `;

    return await query<Coupon[]>(sql, []);
  }
}
