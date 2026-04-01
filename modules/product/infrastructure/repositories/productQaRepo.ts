import { query, queryOne } from '../../../../libs/db';

export type ProductQaStatus = 'pending' | 'approved' | 'rejected';

export interface ProductQa {
  productQaId: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  customerId?: string | null;
  question: string;
  status: ProductQaStatus;
  askerName?: string | null;
  askerEmail?: string | null;
}

export type ProductQaCreateParams = Omit<ProductQa, 'productQaId' | 'createdAt' | 'updatedAt'>;

export class ProductQaRepo {
  async findByProduct(productId: string, status?: ProductQaStatus): Promise<ProductQa[]> {
    let sql = `SELECT * FROM "productQa" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (status) {
      sql += ` AND "status" = $2`;
      params.push(status);
    }

    sql += ` ORDER BY "createdAt" DESC`;
    return (await query<ProductQa[]>(sql, params)) || [];
  }

  async findById(productQaId: string): Promise<ProductQa | null> {
    return queryOne<ProductQa>(`SELECT * FROM "productQa" WHERE "productQaId" = $1`, [productQaId]);
  }

  async create(params: ProductQaCreateParams): Promise<ProductQa> {
    const now = new Date();
    const result = await queryOne<ProductQa>(
      `INSERT INTO "productQa" ("productId", "customerId", "question", "status", "askerName", "askerEmail", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        params.productId,
        params.customerId || null,
        params.question,
        params.status || 'pending',
        params.askerName || null,
        params.askerEmail || null,
        now,
        now,
      ],
    );
    if (!result) throw new Error('Failed to create productQa');
    return result;
  }

  async updateStatus(productQaId: string, status: ProductQaStatus): Promise<ProductQa | null> {
    return queryOne<ProductQa>(
      `UPDATE "productQa" SET "status" = $1, "updatedAt" = $2 WHERE "productQaId" = $3 RETURNING *`,
      [status, new Date(), productQaId],
    );
  }
}

export default new ProductQaRepo();
