import { queryOne, query } from "../../../libs/db";

export type CategoryPromotionCreateProps = {
  categoryId: string;
  promotionId: string;
  discountPercentage: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive";
  createdBy: string;
  updatedBy: string;
};

export type CategoryPromotionUpdateProps = Partial<Omit<CategoryPromotionCreateProps, 'categoryId' | 'promotionId'>>;

export interface CategoryPromotion {
  categoryPromotionId: string;
  categoryId: string;
  promotionId: string;
  discountPercentage: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  status: "active" | "inactive";
  createdDate: Date;
  updatedDate: Date;
  deletedDate?: Date;
  deletedFlag: boolean;
  createdBy: string;
  updatedBy: string;
  deletedBy?: string;
}

export class CategoryPromotionRepo {
  async create(props: CategoryPromotionCreateProps): Promise<CategoryPromotion> {
    const {
      categoryId,
      promotionId,
      discountPercentage,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      status,
      createdBy,
      updatedBy
    } = props;

    const sql = `
      INSERT INTO "public"."category_promotion" (
        "category_id", "promotion_id", "discount_percentage", 
        "min_purchase_amount", "max_discount_amount", "start_date", "end_date", 
        "status", "created_date", "updated_date", "deleted_flag", 
        "created_by", "updated_by"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), false, $9, $10) 
      RETURNING 
        category_promotion_id AS "categoryPromotionId",
        category_id AS "categoryId",
        promotion_id AS "promotionId",
        discount_percentage AS "discountPercentage",
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
    `;

    const data = await queryOne<CategoryPromotion>(sql, [
      categoryId,
      promotionId,
      discountPercentage,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      status,
      createdBy,
      updatedBy
    ]);

    if (!data) {
      throw new Error('Category promotion not saved');
    }

    return data;
  }

  async update(props: CategoryPromotionUpdateProps, categoryPromotionId: string): Promise<CategoryPromotion> {
    // Create dynamic query based on provided properties
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Map camelCase property names to snake_case column names
    const fieldMappings: Record<string, string> = {
      discountPercentage: 'discount_percentage',
      minPurchaseAmount: 'min_purchase_amount',
      maxDiscountAmount: 'max_discount_amount',
      startDate: 'start_date',
      endDate: 'end_date',
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
    
    // Add the categoryPromotionId as the last parameter
    params.push(categoryPromotionId);

    const sql = `
      UPDATE "public"."category_promotion"
      SET ${updateFields.join(', ')}
      WHERE "category_promotion_id" = $${paramIndex}
      RETURNING 
        category_promotion_id AS "categoryPromotionId",
        category_id AS "categoryId",
        promotion_id AS "promotionId",
        discount_percentage AS "discountPercentage",
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy";
    `;

    const data = await queryOne<CategoryPromotion>(sql, params);

    if (!data) {
      throw new Error(`Category promotion with ID ${categoryPromotionId} not found`);
    }

    return data;
  }

  async getById(categoryPromotionId: string): Promise<CategoryPromotion | null> {
    const sql = `
      SELECT 
        category_promotion_id AS "categoryPromotionId",
        category_id AS "categoryId",
        promotion_id AS "promotionId",
        discount_percentage AS "discountPercentage",
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."category_promotion"
      WHERE "category_promotion_id" = $1 AND "deleted_flag" = false;
    `;

    return await queryOne<CategoryPromotion>(sql, [categoryPromotionId]);
  }

  async getByCategoryId(categoryId: string): Promise<CategoryPromotion[] | null> {
    const sql = `
      SELECT 
        category_promotion_id AS "categoryPromotionId",
        category_id AS "categoryId",
        promotion_id AS "promotionId",
        discount_percentage AS "discountPercentage",
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."category_promotion"
      WHERE "category_id" = $1 AND "deleted_flag" = false;
    `;

    return await query<CategoryPromotion[]>(sql, [categoryId]);
  }

  async getActivePromotions(): Promise<CategoryPromotion[] | null> {
    const now = new Date();
    const sql = `
      SELECT 
        category_promotion_id AS "categoryPromotionId",
        category_id AS "categoryId",
        promotion_id AS "promotionId",
        discount_percentage AS "discountPercentage",
        min_purchase_amount AS "minPurchaseAmount",
        max_discount_amount AS "maxDiscountAmount",
        start_date AS "startDate",
        end_date AS "endDate",
        status,
        created_date AS "createdDate",
        updated_date AS "updatedDate",
        deleted_date AS "deletedDate",
        deleted_flag AS "deletedFlag",
        created_by AS "createdBy",
        updated_by AS "updatedBy",
        deleted_by AS "deletedBy"
      FROM "public"."category_promotion"
      WHERE "status" = 'active' 
        AND "start_date" <= $1 
        AND "end_date" >= $1 
        AND "deleted_flag" = false;
    `;

    return await query<CategoryPromotion[]>(sql, [now]);
  }

  async delete(categoryPromotionId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."category_promotion"
      SET "deleted_flag" = true, "deleted_date" = NOW(), "deleted_by" = $1
      WHERE "category_promotion_id" = $2;
    `;
    await queryOne(sql, [deletedBy, categoryPromotionId]);
  }
}
