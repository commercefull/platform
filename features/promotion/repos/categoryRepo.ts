import { queryOne, query } from "../../../libs/db";
import { Table, CategoryPromotion } from "../../../libs/db/types";

// Use CategoryPromotion type directly from libs/db/types.ts
export type { CategoryPromotion };

type CreateProps = Pick<CategoryPromotion, "productCategoryId" | "promotionId" | "displayOrder"> &
  Partial<Pick<CategoryPromotion, "bannerText" | "bannerColor" | "bannerBackgroundColor" | "bannerImageUrl" | "isDisplayedOnCategoryPage" | "isDisplayedOnProductPage">>;
type UpdateProps = Partial<Omit<CreateProps, "productCategoryId" | "promotionId">>;

export class CategoryPromotionRepo {
  async create(props: CreateProps): Promise<CategoryPromotion> {
    const now = new Date();
    const row = await queryOne<CategoryPromotion>(
      `INSERT INTO "${Table.CategoryPromotion}" 
       ("productCategoryId", "promotionId", "displayOrder", "bannerText", "bannerColor", "bannerBackgroundColor", "bannerImageUrl", "isDisplayedOnCategoryPage", "isDisplayedOnProductPage", "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [
        props.productCategoryId,
        props.promotionId,
        props.displayOrder,
        props.bannerText || null,
        props.bannerColor || null,
        props.bannerBackgroundColor || null,
        props.bannerImageUrl || null,
        props.isDisplayedOnCategoryPage ?? true,
        props.isDisplayedOnProductPage ?? true,
        now,
        now
      ]
    );

    if (!row) {
      throw new Error('Category promotion not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<CategoryPromotion> {
    const now = new Date();
    const updates: string[] = ['"updatedAt" = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);
    const row = await queryOne<CategoryPromotion>(
      `UPDATE "${Table.CategoryPromotion}" 
       SET ${updates.join(', ')} 
       WHERE "categoryPromotionId" = $${paramIndex} 
       RETURNING *`,
      values
    );

    if (!row) {
      throw new Error('Category promotion not found');
    }
    return row;
  }

  async getById(id: string): Promise<CategoryPromotion | null> {
    return queryOne<CategoryPromotion>(
      `SELECT * FROM "${Table.CategoryPromotion}" WHERE "categoryPromotionId" = $1`,
      [id]
    );
  }

  async getByCategoryId(categoryId: string): Promise<CategoryPromotion[]> {
    return await query<CategoryPromotion[]>(
      `SELECT * FROM "${Table.CategoryPromotion}" WHERE "productCategoryId" = $1`,
      [categoryId]
    ) || [];
  }

  async getByPromotionId(promotionId: string): Promise<CategoryPromotion[]> {
    return await query<CategoryPromotion[]>(
      `SELECT * FROM "${Table.CategoryPromotion}" WHERE "promotionId" = $1`,
      [promotionId]
    ) || [];
  }

  async getActivePromotions(): Promise<CategoryPromotion[]> {
    return await query<CategoryPromotion[]>(
      `SELECT cp.* FROM "${Table.CategoryPromotion}" cp
       INNER JOIN "${Table.Promotion}" p ON cp."promotionId" = p."promotionId"
       WHERE p."isActive" = true AND p."deletedAt" IS NULL
       ORDER BY cp."displayOrder" ASC`,
      []
    ) || [];
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM "${Table.CategoryPromotion}" WHERE "categoryPromotionId" = $1`,
      [id]
    );
    return result !== null;
  }
}
