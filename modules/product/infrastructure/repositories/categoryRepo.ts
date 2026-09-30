import { queryOne, query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import type { ProductCategory as DbProductCategory } from '../../../../libs/db/types';
import { FailedToCreateProductError } from '../../domain/errors/ProductErrors';

export type { CategoryRow as Category, CategoryCreateProps, CategoryUpdateProps } from '../../domain/repositories/ProductCatalogPorts';
import type { CategoryRow as Category, CategoryCreateProps, CategoryUpdateProps } from '../../domain/repositories/ProductCatalogPorts';

// Alias for backward compatibility
export type { Category as ProductCategory };

function mapToCategory(row: DbProductCategory): Category {
  return {
    productCategoryId: row.productCategoryId,
    name: row.name,
    slug: row.slug ?? '',
    depth: row.depth,
    position: row.position,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    includeInMenu: row.includeInMenu,
    productCount: row.productCount,
    isGlobal: row.isGlobal,
    description: row.description ?? undefined,
    parentId: row.parentId ?? undefined,
    path: row.path ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    bannerUrl: row.bannerUrl ?? undefined,
    iconUrl: row.iconUrl ?? undefined,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    metaKeywords: row.metaKeywords ?? undefined,
    organizationId: row.organizationId ?? undefined,
    customLayout: row.customLayout ?? undefined,
    displaySettings: (row.displaySettings as Record<string, unknown> | null) ?? undefined,
  };
}

export class CategoryRepo {
  private readonly tableName = Table.ProductCategory;

  async findOne(id: string): Promise<Category | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "productCategoryId" = $1`;
    const row = await queryOne<DbProductCategory>(sql, [id]);
    return row ? mapToCategory(row) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "slug" = $1`;
    const row = await queryOne<DbProductCategory>(sql, [slug]);
    return row ? mapToCategory(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql)) || []).map(mapToCategory);
  }

  async findActive(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "isActive" = true ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql)) || []).map(mapToCategory);
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "parentId" = $1 ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql, [parentId])) || []).map(mapToCategory);
  }

  async findRootCategories(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "parentId" IS NULL ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql)) || []).map(mapToCategory);
  }

  async findFeatured(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "isFeatured" = true AND "isActive" = true ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql)) || []).map(mapToCategory);
  }

  async findForMenu(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "includeInMenu" = true AND "isActive" = true ORDER BY "position" ASC`;
    return ((await query<DbProductCategory[]>(sql)) || []).map(mapToCategory);
  }

  async create(props: CategoryCreateProps): Promise<Category> {
    // Generate slug from name if not provided
    const slug = props.slug || this.generateSlug(props.name);

    // Calculate depth and path based on parent
    let depth = 0;
    let path = '';

    if (props.parentId) {
      const parent = await this.findOne(props.parentId);
      if (parent) {
        depth = parent.depth + 1;
        path = parent.path ? `${parent.path}/${parent.productCategoryId}` : parent.productCategoryId;
      }
    }

    const sql = `
      INSERT INTO "${this.tableName}" (
        "name", "slug", "description", "parentId", "path", "depth", "position",
        "isActive", "isFeatured", "imageUrl", "bannerUrl", "iconUrl",
        "metaTitle", "metaDescription", "metaKeywords",
        "includeInMenu", "organizationId", "isGlobal", "customLayout", "displaySettings"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      )
      RETURNING *
    `;

    const values = [
      props.name,
      slug,
      props.description || null,
      props.parentId || null,
      path || null,
      depth,
      props.position || 0,
      props.isActive !== false,
      props.isFeatured || false,
      props.imageUrl || null,
      props.bannerUrl || null,
      props.iconUrl || null,
      props.metaTitle || null,
      props.metaDescription || null,
      props.metaKeywords || null,
      props.includeInMenu !== false,
      props.organizationId || null,
      props.isGlobal !== false,
      props.customLayout || null,
      props.displaySettings ? JSON.stringify(props.displaySettings) : null,
    ];

    const result = await queryOne<DbProductCategory>(sql, values);

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return mapToCategory(result);
  }

  async update(id: string, props: CategoryUpdateProps): Promise<Category | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: unknown[] = [id];
    let paramIndex = 2;

    const updateableFields: (keyof CategoryUpdateProps)[] = [
      'name',
      'slug',
      'description',
      'parentId',
      'position',
      'isActive',
      'isFeatured',
      'imageUrl',
      'bannerUrl',
      'iconUrl',
      'metaTitle',
      'metaDescription',
      'metaKeywords',
      'includeInMenu',
      'organizationId',
      'isGlobal',
      'customLayout',
      'displaySettings',
    ];

    for (const field of updateableFields) {
      if (props[field] !== undefined) {
        let value = props[field];
        if (field === 'displaySettings' && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        setStatements.push(`"${field}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setStatements.length === 1) {
      return await this.findOne(id);
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "productCategoryId" = $1
      RETURNING *
    `;

    const row = await queryOne<DbProductCategory>(sql, values);
    return row ? mapToCategory(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "productCategoryId" = $1`;
    const result = await query(sql, [id]);
    return result !== null;
  }

  async updateProductCount(id: string): Promise<void> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "productCount" = (
        SELECT COUNT(*) FROM "productCategoryMap" WHERE "productCategoryId" = $1
      ), "updatedAt" = now()
      WHERE "productCategoryId" = $1
    `;
    await query(sql, [id]);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export default new CategoryRepo();
