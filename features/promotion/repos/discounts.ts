import { queryOne, query } from "../../../libs/db";

export type DiscountCreateProps = {
  name: string;
  description: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  applicableProducts?: string[]; // Array of product IDs
  applicableCategories?: string[]; // Array of category IDs
  combinable: boolean;
  priority: number;
  status: "active" | "inactive";
  createdBy: string;
  updatedBy: string;
};

export type DiscountUpdateProps = Partial<Omit<DiscountCreateProps, 'name'>>;

export interface Discount {
  discountId: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  applicableProducts?: string[];
  applicableCategories?: string[];
  combinable: boolean;
  priority: number;
  status: "active" | "inactive";
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
  deletedFlag: boolean;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string;
}

export class DiscountRepo {
  async create(props: DiscountCreateProps): Promise<Discount> {
    const {
      name,
      description,
      type,
      value,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
      combinable,
      priority,
      status,
      createdBy,
      updatedBy
    } = props;

    const sql = `
      INSERT INTO "public"."discount" (
        "name", "description", "type", "value", 
        "minPurchaseAmount", "maxDiscountAmount", 
        "startDate", "endDate", "applicableProducts", "applicableCategories",
        "combinable", "priority", "status", 
        "createdDate", "updatedDate", "deletedFlag", 
        "createdBy", "updatedBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), false, $14, $15) 
      RETURNING *;
    `;

    const data = await queryOne<Discount>(sql, [
      name,
      description,
      type,
      value,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      applicableProducts,
      applicableCategories,
      combinable,
      priority,
      status,
      createdBy,
      updatedBy
    ]);

    if (!data) {
      throw new Error('Discount not saved');
    }

    return data;
  }

  async update(props: DiscountUpdateProps, discountId: string): Promise<Discount> {
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
    
    // Add the discountId as the last parameter
    params.push(discountId);

    const sql = `
      UPDATE "public"."discount"
      SET ${updateFields.join(', ')}
      WHERE "discountId" = $${paramIndex}
      RETURNING *;
    `;

    const data = await queryOne<Discount>(sql, params);

    if (!data) {
      throw new Error('Discount not found');
    }

    return data;
  }

  async getById(discountId: string): Promise<Discount | null> {
    const sql = `
      SELECT * FROM "public"."discount"
      WHERE "discountId" = $1 AND "deletedFlag" = false;
    `;

    return await queryOne<Discount>(sql, [discountId]);
  }

  async getActiveDiscounts(): Promise<Discount[] | null> {
    const sql = `
      SELECT * FROM "public"."discount"
      WHERE "status" = 'active' 
      AND "deletedFlag" = false 
      AND "startDate" <= NOW()
      AND "endDate" > NOW()
      ORDER BY "priority" DESC;
    `;

    return await query<Discount[]>(sql, []);
  }

  async getDiscountsByProductId(productId: string): Promise<Discount[] | null> {
    const sql = `
      SELECT * FROM "public"."discount"
      WHERE "status" = 'active' 
      AND "deletedFlag" = false 
      AND "startDate" <= NOW()
      AND "endDate" > NOW()
      AND ("applicableProducts" @> ARRAY[$1]::text[] OR "applicableProducts" IS NULL)
      ORDER BY "priority" DESC;
    `;

    return await query<Discount[]>(sql, [productId]);
  }

  async getDiscountsByCategoryId(categoryId: string): Promise<Discount[] | null> {
    const sql = `
      SELECT * FROM "public"."discount"
      WHERE "status" = 'active' 
      AND "deletedFlag" = false 
      AND "startDate" <= NOW()
      AND "endDate" > NOW()
      AND ("applicableCategories" @> ARRAY[$1]::text[] OR "applicableCategories" IS NULL)
      ORDER BY "priority" DESC;
    `;

    return await query<Discount[]>(sql, [categoryId]);
  }
  
  async delete(discountId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."discount"
      SET "deletedFlag" = true, "deletedDate" = NOW(), "deletedBy" = $1
      WHERE "discountId" = $2;
    `;

    await queryOne(sql, [deletedBy, discountId]);
  }
}
