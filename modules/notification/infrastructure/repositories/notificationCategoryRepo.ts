import { query, queryOne } from '../../../../libs/db';

export interface NotificationCategory {
  notificationCategoryId: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function findAll(): Promise<NotificationCategory[]> {
  return (await query<NotificationCategory[]>(
    `SELECT * FROM "notificationCategory" WHERE "isActive" = true ORDER BY name ASC`,
  )) || [];
}

export async function findBySlug(slug: string): Promise<NotificationCategory | null> {
  return queryOne<NotificationCategory>(`SELECT * FROM "notificationCategory" WHERE slug = $1`, [slug]);
}

export async function create(params: Omit<NotificationCategory, 'notificationCategoryId' | 'createdAt' | 'updatedAt'>): Promise<NotificationCategory | null> {
  const now = new Date();
  return queryOne<NotificationCategory>(
    `INSERT INTO "notificationCategory" (name, slug, description, "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [params.name, params.slug, params.description || null, params.isActive, now, now],
  );
}

export default { findAll, findBySlug, create };
