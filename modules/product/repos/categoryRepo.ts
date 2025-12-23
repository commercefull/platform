import { queryOne, query } from '../../../libs/db';
import { Table } from '../../../libs/db/types';

export interface Category {
  productCategoryId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  path?: string;
  depth: number;
  position: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  includeInMenu: boolean;
  productCount: number;
  merchantId?: string;
  isGlobal: boolean;
  customLayout?: string;
  displaySettings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Alias for backward compatibility
export type { Category as ProductCategory };

export interface CategoryCreateProps {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  position?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  includeInMenu?: boolean;
  merchantId?: string;
  isGlobal?: boolean;
  customLayout?: string;
  displaySettings?: Record<string, any>;
}

export type CategoryUpdateProps = Partial<CategoryCreateProps>;

export class CategoryRepo {
  private readonly tableName = Table.ProductCategory;

  async findOne(id: string): Promise<Category | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "productCategoryId" = $1`;
    return await queryOne<Category>(sql, [id]);
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "slug" = $1`;
    return await queryOne<Category>(sql, [slug]);
  }

  async findAll(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" ORDER BY "position" ASC`;
    return (await query<Category[]>(sql)) || [];
  }

  async findActive(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "isActive" = true ORDER BY "position" ASC`;
    return (await query<Category[]>(sql)) || [];
  }

  async findChildren(parentId: string): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "parentId" = $1 ORDER BY "position" ASC`;
    return (await query<Category[]>(sql, [parentId])) || [];
  }

  async findRootCategories(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "parentId" IS NULL ORDER BY "position" ASC`;
    return (await query<Category[]>(sql)) || [];
  }

  async findFeatured(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "isFeatured" = true AND "isActive" = true ORDER BY "position" ASC`;
    return (await query<Category[]>(sql)) || [];
  }

  async findForMenu(): Promise<Category[]> {
    const sql = `SELECT * FROM "${this.tableName}" WHERE "includeInMenu" = true AND "isActive" = true ORDER BY "position" ASC`;
    return (await query<Category[]>(sql)) || [];
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
        "includeInMenu", "merchantId", "isGlobal", "customLayout", "displaySettings"
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
      props.merchantId || null,
      props.isGlobal !== false,
      props.customLayout || null,
      props.displaySettings ? JSON.stringify(props.displaySettings) : null,
    ];

    const result = await queryOne<Category>(sql, values);

    if (!result) {
      throw new Error('Failed to create category');
    }

    return result;
  }

  async update(id: string, props: CategoryUpdateProps): Promise<Category | null> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
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
      'merchantId',
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

    return await queryOne<Category>(sql, values);
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
