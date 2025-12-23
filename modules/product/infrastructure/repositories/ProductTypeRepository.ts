import { query, queryOne } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';

export interface ProductType {
  productTypeId: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductTypeCreateInput {
  name: string;
  slug?: string;
}

export interface ProductTypeUpdateInput {
  name?: string;
  slug?: string;
}

export class ProductTypeRepository {
  private readonly tableName = Table.ProductType;

  async findById(id: string): Promise<ProductType | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "productTypeId" = $1`;
    return await queryOne<ProductType>(sql, [id]);
  }

  async findBySlug(slug: string): Promise<ProductType | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "slug" = $1`;
    return await queryOne<ProductType>(sql, [slug]);
  }

  async findAll(): Promise<ProductType[]> {
    const sql = `SELECT * FROM "${this.tableName}" ORDER BY "name" ASC`;
    return (await query<ProductType[]>(sql)) || [];
  }

  async findActive(): Promise<ProductType[]> {
    // Note: productType table doesn't have isActive column, return all
    return this.findAll();
  }

  async create(input: ProductTypeCreateInput): Promise<ProductType> {
    const slug = input.slug || this.generateSlug(input.name);

    const sql = `
      INSERT INTO "${this.tableName}" ("name", "slug")
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await queryOne<ProductType>(sql, [input.name, slug]);

    if (!result) {
      throw new Error('Failed to create product type');
    }

    return result;
  }

  async update(id: string, input: ProductTypeUpdateInput): Promise<ProductType | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIndex = 2;

    if (input.name !== undefined) {
      setStatements.push(`"name" = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      setStatements.push(`"slug" = $${paramIndex++}`);
      values.push(input.slug);
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "productTypeId" = $1
      RETURNING *
    `;

    return await queryOne<ProductType>(sql, values);
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "productTypeId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export default new ProductTypeRepository();
