import { queryOne, query } from '../../../../libs/db';
import { Table, PromotionCategory } from '../../../../libs/db/types';
import { FailedToCreatePromotionError, PromotionNotFoundError } from '../../domain/errors/PromotionErrors';

// Use PromotionCategory type directly from libs/db/types.ts
export type { PromotionCategory };

type CreateProps = Pick<PromotionCategory, 'productCategoryId' | 'promotionId' | 'displayOrder'> &
  Partial<
    Pick<
      PromotionCategory,
      'bannerText' | 'bannerColor' | 'bannerBackgroundColor' | 'bannerImageUrl' | 'isDisplayedOnCategoryPage' | 'isDisplayedOnProductPage'
    >
  >;
type UpdateProps = Partial<Omit<CreateProps, 'productCategoryId' | 'promotionId'>>;

export class PromotionCategoryRepo {
  async create(props: CreateProps): Promise<PromotionCategory> {
    const now = new Date();
    const row = await queryOne<PromotionCategory>(
      `INSERT INTO "${Table.PromotionCategory}" 
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
        now,
      ],
    );

    if (!row) {
      throw new FailedToCreatePromotionError('Category promotion not saved');
    }
    return row;
  }

  async update(id: string, props: UpdateProps): Promise<PromotionCategory> {
    const now = new Date();
    const updates: string[] = ['"updatedAt" = $1'];
    const values: unknown[] = [now];
    let paramIndex = 2;

    for (const [key, value] of Object.entries(props)) {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    values.push(id);
    const row = await queryOne<PromotionCategory>(
      `UPDATE "${Table.PromotionCategory}" 
       SET ${updates.join(', ')} 
       WHERE "categoryPromotionId" = $${paramIndex} 
       RETURNING *`,
      values,
    );

    if (!row) {
      throw new PromotionNotFoundError(id);
    }
    return row;
  }

  async getById(id: string): Promise<PromotionCategory | null> {
    return queryOne<PromotionCategory>(`SELECT * FROM "${Table.PromotionCategory}" WHERE "categoryPromotionId" = $1`, [id]);
  }

  async getByCategoryId(categoryId: string): Promise<PromotionCategory[]> {
    return (
      (await query<PromotionCategory[]>(`SELECT * FROM "${Table.PromotionCategory}" WHERE "productCategoryId" = $1`, [categoryId])) || []
    );
  }

  async getByPromotionId(promotionId: string): Promise<PromotionCategory[]> {
    return (await query<PromotionCategory[]>(`SELECT * FROM "${Table.PromotionCategory}" WHERE "promotionId" = $1`, [promotionId])) || [];
  }

  async getActivePromotions(): Promise<PromotionCategory[]> {
    return (
      (await query<PromotionCategory[]>(
        `SELECT cp.* FROM "${Table.PromotionCategory}" cp
       INNER JOIN "${Table.Promotion}" p ON cp."promotionId" = p."promotionId"
       WHERE p."isActive" = true AND p."deletedAt" IS NULL
       ORDER BY cp."displayOrder" ASC`,
        [],
      )) || []
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM "${Table.PromotionCategory}" WHERE "categoryPromotionId" = $1`, [id]);
    return result !== null;
  }
}
