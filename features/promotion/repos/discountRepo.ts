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
        "min_purchase_amount", "max_discount_amount", 
        "start_date", "end_date", "applicable_products", "applicable_categories",
        "combinable", "priority", "status", 
        "created_date", "updated_date", "deleted_flag", 
        "created_by", "updated_by"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), false, $14, $15) 
      RETURNING 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
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

    // Map camelCase property names to snake_case column names
    const fieldMappings: Record<string, string> = {
      minPurchaseAmount: 'min_purchase_amount',
      maxDiscountAmount: 'max_discount_amount',
      startDate: 'start_date',
      endDate: 'end_date',
      applicableProducts: 'applicable_products',
      applicableCategories: 'applicable_categories',
      createdDate: 'created_date',
      updatedDate: 'updated_date',
      deletedDate: 'deleted_date',
      deletedFlag: 'deleted_flag',
      createdBy: 'created_by',
      updatedBy: 'updated_by',
      deletedBy: 'deleted_by'
    };

    // Add each property that exists in props to the update query
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = fieldMappings[key] || key;
        updateFields.push(`"${dbField}" = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    });

    // Always update the updatedDate
    updateFields.push(`"updated_date" = NOW()`);
    
    // Add the discountId as the last parameter
    params.push(discountId);

    const sql = `
      UPDATE "public"."discount"
      SET ${updateFields.join(', ')}
      WHERE "discount_id" = $${paramIndex}
      RETURNING 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
    `;

    const data = await queryOne<Discount>(sql, params);

    if (!data) {
      throw new Error(`Discount with ID ${discountId} not found`);
    }

    return data;
  }

  async getById(discountId: string): Promise<Discount | null> {
    const sql = `
      SELECT 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."discount"
      WHERE "discount_id" = $1 AND "deleted_flag" = false;
    `;

    return await queryOne<Discount>(sql, [discountId]);
  }

  async getActiveDiscounts(): Promise<Discount[] | null> {
    const now = new Date();
    const sql = `
      SELECT 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."discount"
      WHERE "status" = 'active' 
        AND "start_date" <= $1 
        AND "end_date" >= $1 
        AND "deleted_flag" = false
      ORDER BY "priority" DESC, "value" DESC;
    `;

    return await query<Discount[]>(sql, [now]);
  }

  async getDiscountsByProductId(productId: string): Promise<Discount[] | null> {
    const now = new Date();
    const sql = `
      SELECT 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."discount"
      WHERE "status" = 'active' 
        AND "start_date" <= $1 
        AND "end_date" >= $1 
        AND "deleted_flag" = false
        AND (
          $2 = ANY("applicable_products") 
          OR "applicable_products" IS NULL 
          OR array_length("applicable_products", 1) IS NULL
        )
      ORDER BY "priority" DESC, "value" DESC;
    `;

    return await query<Discount[]>(sql, [now, productId]);
  }

  async getDiscountsByCategoryId(categoryId: string): Promise<Discount[] | null> {
    const now = new Date();
    const sql = `
      SELECT 
        discount_id AS "discountId",
        name,
        description,
        type,
        value,
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        applicable_products AS "applicableProducts",
        applicable_categories AS "applicableCategories",
        combinable,
        priority,
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."discount"
      WHERE "status" = 'active' 
        AND "start_date" <= $1 
        AND "end_date" >= $1 
        AND "deleted_flag" = false
        AND (
          $2 = ANY("applicable_categories") 
          OR "applicable_categories" IS NULL 
          OR array_length("applicable_categories", 1) IS NULL
        )
      ORDER BY "priority" DESC, "value" DESC;
    `;

    return await query<Discount[]>(sql, [now, categoryId]);
  }

  async delete(discountId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."discount"
      SET "deleted_flag" = true, "deleted_date" = NOW(), "deleted_by" = $1
      WHERE "discount_id" = $2;
    `;

    await queryOne(sql, [deletedBy, discountId]);
  }
}
