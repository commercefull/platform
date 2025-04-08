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

export class CategoryRepo {
  async findOne(id: string): Promise<Category | null> {
    return await queryOne<Category>('SELECT * FROM "public"."category" WHERE "id" = $1', [id]);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return await queryOne<Category>('SELECT * FROM "public"."category" WHERE "slug" = $1', [slug]);
  }

  async findAll(): Promise<Category[] | null> {
    return await query<Category[]>('SELECT * FROM "public"."category" ORDER BY "sortOrder" ASC');
  }

  async findActive(): Promise<Category[] | null> {
    return await query<Category[]>('SELECT * FROM "public"."category" WHERE "active" = true ORDER BY "sortOrder" ASC');
  }

  async findChildren(parentId: string): Promise<Category[] | null> {
    return await query<Category[]>('SELECT * FROM "public"."category" WHERE "parentId" = $1 ORDER BY "sortOrder" ASC', [parentId]);
  }

  async findRootCategories(): Promise<Category[] | null> {
    return await query<Category[]>('SELECT * FROM "public"."category" WHERE "parentId" IS NULL ORDER BY "sortOrder" ASC');
  }

  async create(props: CategoryCreateProps): Promise<Category> {
    const { name, description, slug, parentId, imageUrl, active, sortOrder } = props;

    const data = await queryOne<Category>(
      'INSERT INTO "public"."category" ("name", "description", "slug", "parentId", "imageUrl", "active", "sortOrder") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, slug, parentId, imageUrl, active, sortOrder]
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
        updates.push(`"${key}" = $${paramIndex++}`);
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

    const query = `UPDATE "public"."category" SET ${updates.join(", ")} WHERE "id" = $${paramIndex - 1} RETURNING *`;
    return await queryOne<Category>(query, values);
  }

  async delete(id: string): Promise<Category | null> {
    return await queryOne<Category>('DELETE FROM "public"."category" WHERE "id" = $1 RETURNING *', [id]);
  }
}
