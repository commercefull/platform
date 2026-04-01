import { query, queryOne } from '../../../../libs/db';

export interface ProductPrice {
  productPriceId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  productVariantId?: string | null;
  priceListId?: string | null;
  currencyCode: string;
  amount: number;
  compareAtAmount?: number | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

export type ProductPriceCreateParams = Omit<ProductPrice, 'productPriceId' | 'createdAt' | 'updatedAt'>;
export type ProductPriceUpdateParams = Partial<Omit<ProductPriceCreateParams, 'productId'>>;

export class ProductPriceRepo {
  async findByProduct(productId: string): Promise<ProductPrice[]> {
    return (
      (await query<ProductPrice[]>(
        `SELECT * FROM "productPrice" WHERE "productId" = $1 ORDER BY "currencyCode" ASC, "minQuantity" ASC NULLS FIRST`,
        [productId],
      )) || []
    );
  }

  async findByVariant(productVariantId: string): Promise<ProductPrice[]> {
    return (
      (await query<ProductPrice[]>(
        `SELECT * FROM "productPrice" WHERE "productVariantId" = $1 ORDER BY "currencyCode" ASC, "minQuantity" ASC NULLS FIRST`,
        [productVariantId],
      )) || []
    );
  }

  async create(params: ProductPriceCreateParams): Promise<ProductPrice> {
    const now = new Date();
    const result = await queryOne<ProductPrice>(
      `INSERT INTO "productPrice" ("productId", "productVariantId", "priceListId", "currencyCode", "amount", "compareAtAmount", "minQuantity", "maxQuantity", "startsAt", "endsAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        params.productId,
        params.productVariantId || null,
        params.priceListId || null,
        params.currencyCode,
        params.amount,
        params.compareAtAmount || null,
        params.minQuantity || null,
        params.maxQuantity || null,
        params.startsAt || null,
        params.endsAt || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create productPrice');
    return result;
  }

  async update(productPriceId: string, params: ProductPriceUpdateParams): Promise<ProductPrice | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return queryOne<ProductPrice>(`SELECT * FROM "productPrice" WHERE "productPriceId" = $1`, [productPriceId]);
    }

    fields.push(`"updatedAt" = $${i++}`);
    values.push(new Date(), productPriceId);

    return queryOne<ProductPrice>(
      `UPDATE "productPrice" SET ${fields.join(', ')} WHERE "productPriceId" = $${i} RETURNING *`,
      values,
    );
  }
}

export default new ProductPriceRepo();
