import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type Category = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

type CategoryCreateProps = Pick<Category, "name" | "description" | "slug" | "parentId" | "imageUrl" | "active" | "sortOrder">;

type CategoryUpdateProps = Partial<CategoryCreateProps>;

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  title: 'title',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  description: 'description',
  slug: 'slug',
  parent_id: 'parentId',
  image_url: 'imageUrl',
  active: 'active',
  sort_order: 'sortOrder'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class CategoryRepo {
  /**
   * Convert snake_case column name to camelCase property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(): string {
    return Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
  }

  async findOne(id: string): Promise<Category | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Category>(`SELECT ${selectFields} FROM "public"."category" WHERE "id" = $1`, [id]);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const selectFields = this.generateSelectFields();
    return await queryOne<Category>(`SELECT ${selectFields} FROM "public"."category" WHERE "slug" = $1`, [slug]);
  }

  async findAll(): Promise<Category[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Category[]>(`SELECT ${selectFields} FROM "public"."category" ORDER BY "sort_order" ASC`);
  }

  async findActive(): Promise<Category[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Category[]>(`SELECT ${selectFields} FROM "public"."category" WHERE "active" = true ORDER BY "sort_order" ASC`);
  }

  async findChildren(parentId: string): Promise<Category[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Category[]>(`SELECT ${selectFields} FROM "public"."category" WHERE "parent_id" = $1 ORDER BY "sort_order" ASC`, [parentId]);
  }

  async findRootCategories(): Promise<Category[] | null> {
    const selectFields = this.generateSelectFields();
    return await query<Category[]>(`SELECT ${selectFields} FROM "public"."category" WHERE "parent_id" IS NULL ORDER BY "sort_order" ASC`);
  }

  async create(props: CategoryCreateProps): Promise<Category> {
    const { name, description, slug, parentId, imageUrl, active, sortOrder } = props;

    // Convert TS property names to DB column names
    const columnMap = {
      name,
      description,
      slug,
      parent_id: parentId,
      image_url: imageUrl,
      active,
      sort_order: sortOrder
    };

    // Generate columns and placeholders for query
    const columns = Object.keys(columnMap)
      .filter(key => columnMap[key as keyof typeof columnMap] !== undefined)
      .map(key => `"${key}"`);

    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Values for the query
    const values = Object.values(columnMap)
      .filter(value => value !== undefined);

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    const data = await queryOne<Category>(
      `INSERT INTO "public"."category" (${columns.join(', ')}) VALUES (${placeholders}) RETURNING ${returnFields}`,
      values
    );

    if (!data) {
      throw new Error('Category not saved');
    }

    return data;
  }

  async update(id: string, props: CategoryUpdateProps): Promise<Category | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Dynamically build the update statement based on provided properties
    Object.entries(props).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbColumn = this.tsToDb(key);
        updates.push(`"${dbColumn}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    // Add updatedAt and id
    updates.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(id);

    if (updates.length === 1) {
      return await this.findOne(id); // No fields to update except updatedAt
    }

    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    const queryString = `UPDATE "public"."category" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING ${returnFields}`;
    return await queryOne<Category>(queryString, values);
  }

  async delete(id: string): Promise<Category | null> {
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');

    return await queryOne<Category>(`DELETE FROM "public"."category" WHERE "id" = $1 RETURNING ${returnFields}`, [id]);
  }
}
