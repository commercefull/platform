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
      INSERT INTO "public"."categoryPromotion" (
        "categoryId", "promotionId", "discountPercentage", 
        "minPurchaseAmount", "maxDiscountAmount", "startDate", "endDate", 
        "status", "createdDate", "updatedDate", "deletedFlag", 
        "createdBy", "updatedBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), false, $9, $10) 
      RETURNING *;
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
    
    // Add the categoryPromotionId as the last parameter
    params.push(categoryPromotionId);

    const sql = `
      UPDATE "public"."categoryPromotion"
      SET ${updateFields.join(', ')}
      WHERE "categoryPromotionId" = $${paramIndex}
      RETURNING *;
    `;

    const data = await queryOne<CategoryPromotion>(sql, params);

    if (!data) {
      throw new Error('Category promotion not found');
    }

    return data;
  }

  async getById(categoryPromotionId: string): Promise<CategoryPromotion | null> {
    const sql = `
      SELECT * FROM "public"."categoryPromotion"
      WHERE "categoryPromotionId" = $1 AND "deletedFlag" = false;
    `;

    return await queryOne<CategoryPromotion>(sql, [categoryPromotionId]);
  }

  async getByCategoryId(categoryId: string): Promise<CategoryPromotion[] | null> {
    const sql = `
      SELECT * FROM "public"."categoryPromotion"
      WHERE "categoryId" = $1 AND "deletedFlag" = false 
      AND "status" = 'active' AND "endDate" > NOW();
    `;

    return await query<CategoryPromotion[]>(sql, [categoryId]);
  }

  async getActivePromotions(): Promise<CategoryPromotion[] | null> {
    const sql = `
      SELECT * FROM "public"."categoryPromotion"
      WHERE "status" = 'active' 
      AND "deletedFlag" = false 
      AND "startDate" <= NOW()
      AND "endDate" > NOW();
    `;

    return await query<CategoryPromotion[]>(sql, []);
  }
  
  async delete(categoryPromotionId: string, deletedBy: string): Promise<void> {
    const sql = `
      UPDATE "public"."categoryPromotion"
      SET "deletedFlag" = true, "deletedDate" = NOW(), "deletedBy" = $1
      WHERE "categoryPromotionId" = $2;
    `;

    await queryOne(sql, [deletedBy, categoryPromotionId]);
  }
}
