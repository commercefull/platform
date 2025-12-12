/**
 * FAQ Repository
 * Handles CRUD operations for FAQ categories and articles
 */

import { query, queryOne } from '../../../libs/db';

// ============================================================================
// Types
// ============================================================================

export interface FaqCategory {
  faqCategoryId: string;
  parentCategoryId?: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  imageUrl?: string;
  sortOrder: number;
  articleCount: number;
  isActive: boolean;
  isFeatured: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqArticle {
  faqArticleId: string;
  faqCategoryId?: string;
  title: string;
  slug?: string;
  content: string;
  contentHtml?: string;
  excerpt?: string;
  keywords?: string[];
  relatedArticleIds?: string[];
  views: number;
  uniqueViews: number;
  helpfulYes: number;
  helpfulNo: number;
  helpfulScore: number;
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt?: Date;
  authorId?: string;
  authorName?: string;
  lastEditedBy?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// FAQ Categories
// ============================================================================

export async function getCategory(faqCategoryId: string): Promise<FaqCategory | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "faqCategory" WHERE "faqCategoryId" = $1',
    [faqCategoryId]
  );
  return row ? mapToCategory(row) : null;
}

export async function getCategoryBySlug(slug: string): Promise<FaqCategory | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "faqCategory" WHERE "slug" = $1',
    [slug]
  );
  return row ? mapToCategory(row) : null;
}

export async function getCategories(activeOnly: boolean = true): Promise<FaqCategory[]> {
  let whereClause = '1=1';
  if (activeOnly) {
    whereClause = '"isActive" = true';
  }

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqCategory" WHERE ${whereClause} ORDER BY "sortOrder" ASC, "name" ASC`
  );
  return (rows || []).map(mapToCategory);
}

export async function getFeaturedCategories(): Promise<FaqCategory[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqCategory" WHERE "isActive" = true AND "isFeatured" = true 
     ORDER BY "sortOrder" ASC`
  );
  return (rows || []).map(mapToCategory);
}

export async function saveCategory(category: Partial<FaqCategory> & { name: string }): Promise<FaqCategory> {
  const now = new Date().toISOString();
  const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (category.faqCategoryId) {
    await query(
      `UPDATE "faqCategory" SET
        "parentCategoryId" = $1, "name" = $2, "slug" = $3, "description" = $4,
        "icon" = $5, "color" = $6, "imageUrl" = $7, "sortOrder" = $8,
        "isActive" = $9, "isFeatured" = $10, "metadata" = $11, "updatedAt" = $12
      WHERE "faqCategoryId" = $13`,
      [
        category.parentCategoryId, category.name, slug, category.description,
        category.icon, category.color, category.imageUrl, category.sortOrder || 0,
        category.isActive !== false, category.isFeatured || false,
        category.metadata ? JSON.stringify(category.metadata) : null,
        now, category.faqCategoryId
      ]
    );
    return (await getCategory(category.faqCategoryId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "faqCategory" (
        "parentCategoryId", "name", "slug", "description", "icon", "color",
        "imageUrl", "sortOrder", "isActive", "isFeatured", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        category.parentCategoryId, category.name, slug, category.description,
        category.icon, category.color, category.imageUrl, category.sortOrder || 0,
        true, category.isFeatured || false,
        category.metadata ? JSON.stringify(category.metadata) : null, now, now
      ]
    );
    return mapToCategory(result!);
  }
}

export async function deleteCategory(faqCategoryId: string): Promise<void> {
  // Move articles to uncategorized
  await query(
    'UPDATE "faqArticle" SET "faqCategoryId" = NULL WHERE "faqCategoryId" = $1',
    [faqCategoryId]
  );
  await query('DELETE FROM "faqCategory" WHERE "faqCategoryId" = $1', [faqCategoryId]);
}

// ============================================================================
// FAQ Articles
// ============================================================================

export async function getArticle(faqArticleId: string): Promise<FaqArticle | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "faqArticle" WHERE "faqArticleId" = $1',
    [faqArticleId]
  );
  return row ? mapToArticle(row) : null;
}

export async function getArticleBySlug(slug: string): Promise<FaqArticle | null> {
  const row = await queryOne<Record<string, any>>(
    'SELECT * FROM "faqArticle" WHERE "slug" = $1',
    [slug]
  );
  return row ? mapToArticle(row) : null;
}

export async function getArticles(
  filters?: { faqCategoryId?: string; isPublished?: boolean; isFeatured?: boolean },
  pagination?: { limit?: number; offset?: number }
): Promise<{ data: FaqArticle[]; total: number }> {
  let whereClause = '1=1';
  const params: any[] = [];
  let paramIndex = 1;

  if (filters?.faqCategoryId) {
    whereClause += ` AND "faqCategoryId" = $${paramIndex++}`;
    params.push(filters.faqCategoryId);
  }
  if (filters?.isPublished !== undefined) {
    whereClause += ` AND "isPublished" = $${paramIndex++}`;
    params.push(filters.isPublished);
  }
  if (filters?.isFeatured !== undefined) {
    whereClause += ` AND "isFeatured" = $${paramIndex++}`;
    params.push(filters.isFeatured);
  }

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "faqArticle" WHERE ${whereClause}`,
    params
  );

  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;

  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqArticle" WHERE ${whereClause} 
     ORDER BY "isPinned" DESC, "sortOrder" ASC, "views" DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...params, limit, offset]
  );

  return {
    data: (rows || []).map(mapToArticle),
    total: parseInt(countResult?.count || '0')
  };
}

export async function searchArticles(searchQuery: string, limit: number = 10): Promise<FaqArticle[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqArticle" 
     WHERE "isPublished" = true 
     AND ("title" ILIKE $1 OR "content" ILIKE $1 OR $2 = ANY("keywords"))
     ORDER BY "views" DESC
     LIMIT $3`,
    [`%${searchQuery}%`, searchQuery.toLowerCase(), limit]
  );
  return (rows || []).map(mapToArticle);
}

export async function getPopularArticles(limit: number = 10): Promise<FaqArticle[]> {
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqArticle" WHERE "isPublished" = true 
     ORDER BY "views" DESC LIMIT $1`,
    [limit]
  );
  return (rows || []).map(mapToArticle);
}

export async function getRelatedArticles(faqArticleId: string, limit: number = 5): Promise<FaqArticle[]> {
  const article = await getArticle(faqArticleId);
  if (!article) return [];

  // Get explicitly related articles first
  if (article.relatedArticleIds?.length) {
    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "faqArticle" 
       WHERE "faqArticleId" = ANY($1) AND "isPublished" = true
       LIMIT $2`,
      [article.relatedArticleIds, limit]
    );
    if (rows && rows.length >= limit) {
      return rows.map(mapToArticle);
    }
  }

  // Fall back to same category
  const rows = await query<Record<string, any>[]>(
    `SELECT * FROM "faqArticle" 
     WHERE "faqCategoryId" = $1 AND "faqArticleId" != $2 AND "isPublished" = true
     ORDER BY "views" DESC LIMIT $3`,
    [article.faqCategoryId, faqArticleId, limit]
  );
  return (rows || []).map(mapToArticle);
}

export async function saveArticle(article: Partial<FaqArticle> & { title: string; content: string }): Promise<FaqArticle> {
  const now = new Date().toISOString();
  const slug = article.slug || article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  if (article.faqArticleId) {
    await query(
      `UPDATE "faqArticle" SET
        "faqCategoryId" = $1, "title" = $2, "slug" = $3, "content" = $4,
        "contentHtml" = $5, "excerpt" = $6, "keywords" = $7, "relatedArticleIds" = $8,
        "sortOrder" = $9, "isPublished" = $10, "isFeatured" = $11, "isPinned" = $12,
        "publishedAt" = $13, "lastEditedBy" = $14, "metadata" = $15, "updatedAt" = $16
      WHERE "faqArticleId" = $17`,
      [
        article.faqCategoryId, article.title, slug, article.content, article.contentHtml,
        article.excerpt, article.keywords, article.relatedArticleIds,
        article.sortOrder || 0, article.isPublished || false,
        article.isFeatured || false, article.isPinned || false,
        article.isPublished && !article.publishedAt ? now : article.publishedAt?.toISOString(),
        article.lastEditedBy,
        article.metadata ? JSON.stringify(article.metadata) : null,
        now, article.faqArticleId
      ]
    );

    // Update category article count
    if (article.faqCategoryId) {
      await updateCategoryArticleCount(article.faqCategoryId);
    }

    return (await getArticle(article.faqArticleId))!;
  } else {
    const result = await queryOne<Record<string, any>>(
      `INSERT INTO "faqArticle" (
        "faqCategoryId", "title", "slug", "content", "contentHtml", "excerpt",
        "keywords", "relatedArticleIds", "sortOrder", "isPublished", "isFeatured",
        "isPinned", "publishedAt", "authorId", "authorName", "metadata",
        "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        article.faqCategoryId, article.title, slug, article.content, article.contentHtml,
        article.excerpt, article.keywords, article.relatedArticleIds,
        article.sortOrder || 0, article.isPublished || false,
        article.isFeatured || false, article.isPinned || false,
        article.isPublished ? now : null, article.authorId, article.authorName,
        article.metadata ? JSON.stringify(article.metadata) : null, now, now
      ]
    );

    // Update category article count
    if (article.faqCategoryId) {
      await updateCategoryArticleCount(article.faqCategoryId);
    }

    return mapToArticle(result!);
  }
}

export async function publishArticle(faqArticleId: string): Promise<void> {
  const now = new Date().toISOString();
  const article = await getArticle(faqArticleId);
  
  await query(
    `UPDATE "faqArticle" SET "isPublished" = true, "publishedAt" = $1, "updatedAt" = $1
     WHERE "faqArticleId" = $2`,
    [now, faqArticleId]
  );

  if (article?.faqCategoryId) {
    await updateCategoryArticleCount(article.faqCategoryId);
  }
}

export async function unpublishArticle(faqArticleId: string): Promise<void> {
  const article = await getArticle(faqArticleId);
  
  await query(
    `UPDATE "faqArticle" SET "isPublished" = false, "updatedAt" = $1
     WHERE "faqArticleId" = $2`,
    [new Date().toISOString(), faqArticleId]
  );

  if (article?.faqCategoryId) {
    await updateCategoryArticleCount(article.faqCategoryId);
  }
}

export async function deleteArticle(faqArticleId: string): Promise<void> {
  const article = await getArticle(faqArticleId);
  await query('DELETE FROM "faqArticle" WHERE "faqArticleId" = $1', [faqArticleId]);
  
  if (article?.faqCategoryId) {
    await updateCategoryArticleCount(article.faqCategoryId);
  }
}

export async function incrementViews(faqArticleId: string, isUnique: boolean = false): Promise<void> {
  if (isUnique) {
    await query(
      `UPDATE "faqArticle" SET "views" = "views" + 1, "uniqueViews" = "uniqueViews" + 1
       WHERE "faqArticleId" = $1`,
      [faqArticleId]
    );
  } else {
    await query(
      'UPDATE "faqArticle" SET "views" = "views" + 1 WHERE "faqArticleId" = $1',
      [faqArticleId]
    );
  }
}

export async function submitHelpfulVote(faqArticleId: string, isHelpful: boolean): Promise<void> {
  if (isHelpful) {
    await query(
      `UPDATE "faqArticle" SET 
        "helpfulYes" = "helpfulYes" + 1,
        "helpfulScore" = ("helpfulYes" + 1)::decimal / NULLIF("helpfulYes" + "helpfulNo" + 1, 0)
       WHERE "faqArticleId" = $1`,
      [faqArticleId]
    );
  } else {
    await query(
      `UPDATE "faqArticle" SET 
        "helpfulNo" = "helpfulNo" + 1,
        "helpfulScore" = "helpfulYes"::decimal / NULLIF("helpfulYes" + "helpfulNo" + 1, 0)
       WHERE "faqArticleId" = $1`,
      [faqArticleId]
    );
  }
}

async function updateCategoryArticleCount(faqCategoryId: string): Promise<void> {
  await query(
    `UPDATE "faqCategory" SET 
      "articleCount" = (
        SELECT COUNT(*) FROM "faqArticle" 
        WHERE "faqCategoryId" = $1 AND "isPublished" = true
      ),
      "updatedAt" = $2
     WHERE "faqCategoryId" = $1`,
    [faqCategoryId, new Date().toISOString()]
  );
}

// ============================================================================
// Helpers
// ============================================================================

function mapToCategory(row: Record<string, any>): FaqCategory {
  return {
    faqCategoryId: row.faqCategoryId,
    parentCategoryId: row.parentCategoryId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    color: row.color,
    imageUrl: row.imageUrl,
    sortOrder: parseInt(row.sortOrder) || 0,
    articleCount: parseInt(row.articleCount) || 0,
    isActive: Boolean(row.isActive),
    isFeatured: Boolean(row.isFeatured),
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}

function mapToArticle(row: Record<string, any>): FaqArticle {
  return {
    faqArticleId: row.faqArticleId,
    faqCategoryId: row.faqCategoryId,
    title: row.title,
    slug: row.slug,
    content: row.content,
    contentHtml: row.contentHtml,
    excerpt: row.excerpt,
    keywords: row.keywords,
    relatedArticleIds: row.relatedArticleIds,
    views: parseInt(row.views) || 0,
    uniqueViews: parseInt(row.uniqueViews) || 0,
    helpfulYes: parseInt(row.helpfulYes) || 0,
    helpfulNo: parseInt(row.helpfulNo) || 0,
    helpfulScore: parseFloat(row.helpfulScore) || 0,
    sortOrder: parseInt(row.sortOrder) || 0,
    isPublished: Boolean(row.isPublished),
    isFeatured: Boolean(row.isFeatured),
    isPinned: Boolean(row.isPinned),
    publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
    authorId: row.authorId,
    authorName: row.authorName,
    lastEditedBy: row.lastEditedBy,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  };
}
