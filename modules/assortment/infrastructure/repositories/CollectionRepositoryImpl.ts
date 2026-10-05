import { query, queryOne } from '../../../../libs/db';
import type {
  AssortmentCollection as DbAssortmentCollection,
  AssortmentCollectionPublication as DbCollectionPublication,
} from '../../../../libs/db/types';
import { generateUUID } from '../../../../libs/uuid';
import type {
  CollectionRepository,
  CollectionFilters,
  CollectionPublication,
  CollectionScope,
  ScopedCollectionPlacement,
} from '../../domain/repositories/AssortmentRepository';
import { Collection, type CollectionProps, type CollectionCondition, type CollectionSortOrder } from '../../domain/entities/Collection';

function mapToCollection(row: DbAssortmentCollection): Collection {
  const props: CollectionProps = {
    assortmentCollectionId: row.assortmentCollectionId,
    organizationId: row.organizationId ?? undefined,
    name: row.name,
    slug: row.slug ?? '',
    description: row.description ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    bannerUrl: row.bannerUrl ?? undefined,
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    isAutomated: row.isAutomated,
    conditions: (row.conditions as CollectionCondition[] | undefined) ?? undefined,
    sortOrder: (row.sortOrder as CollectionSortOrder | null) ?? 'manual',
    publishAt: row.publishAt ?? undefined,
    unpublishAt: row.unpublishAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? undefined,
  };
  return Collection.reconstitute(props);
}

class CollectionRepositoryImpl implements CollectionRepository {
  async findAll(filters?: CollectionFilters): Promise<Collection[]> {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const values: unknown[] = [];
    let i = 1;

    if (filters?.organizationId !== undefined) {
      conditions.push(`"organizationId" = $${i++}`);
      values.push(filters.organizationId);
    }
    if (filters?.isActive !== undefined) {
      conditions.push(`"isActive" = $${i++}`);
      values.push(filters.isActive);
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${i}`);
      values.push(filters.isFeatured);
    }

    const rows = await query<DbAssortmentCollection[]>(
      `SELECT * FROM "assortmentCollection" WHERE ${conditions.join(' AND ')} ORDER BY "name" ASC`,
      values,
    );
    return (rows ?? []).map(mapToCollection);
  }

  async findById(assortmentCollectionId: string): Promise<Collection | null> {
    const row = await queryOne<DbAssortmentCollection>(
      `SELECT * FROM "assortmentCollection" WHERE "assortmentCollectionId" = $1 AND "deletedAt" IS NULL`,
      [assortmentCollectionId],
    );
    return row ? mapToCollection(row) : null;
  }

  async findBySlug(slug: string): Promise<Collection | null> {
    const row = await queryOne<DbAssortmentCollection>(`SELECT * FROM "assortmentCollection" WHERE "slug" = $1 AND "deletedAt" IS NULL`, [
      slug,
    ]);
    return row ? mapToCollection(row) : null;
  }

  async create(collection: Collection): Promise<Collection> {
    const p = collection.toJSON();
    const row = await queryOne<DbAssortmentCollection>(
      `INSERT INTO "assortmentCollection" (
         "assortmentCollectionId", "organizationId", "name", "slug", "description",
         "imageUrl", "bannerUrl", "metaTitle", "metaDescription",
         "isActive", "isFeatured", "isAutomated", "conditions", "sortOrder",
         "publishAt", "unpublishAt", "createdAt", "updatedAt"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        p.assortmentCollectionId,
        p.organizationId ?? null,
        p.name,
        p.slug,
        p.description ?? null,
        p.imageUrl ?? null,
        p.bannerUrl ?? null,
        p.metaTitle ?? null,
        p.metaDescription ?? null,
        p.isActive,
        p.isFeatured,
        p.isAutomated,
        p.conditions ? JSON.stringify(p.conditions) : null,
        p.sortOrder,
        p.publishAt ?? null,
        p.unpublishAt ?? null,
        p.createdAt,
        p.updatedAt,
      ],
    );
    if (!row) throw new Error('Failed to create collection');
    return mapToCollection(row);
  }

  async update(collection: Collection): Promise<Collection | null> {
    const p = collection.toJSON();
    const row = await queryOne<DbAssortmentCollection>(
      `UPDATE "assortmentCollection" SET
         "organizationId" = $2, "name" = $3, "slug" = $4, "description" = $5,
         "imageUrl" = $6, "bannerUrl" = $7, "metaTitle" = $8, "metaDescription" = $9,
         "isActive" = $10, "isFeatured" = $11, "isAutomated" = $12,
         "conditions" = $13, "sortOrder" = $14,
         "publishAt" = $15, "unpublishAt" = $16, "updatedAt" = $17
       WHERE "assortmentCollectionId" = $1 AND "deletedAt" IS NULL
       RETURNING *`,
      [
        p.assortmentCollectionId,
        p.organizationId ?? null,
        p.name,
        p.slug,
        p.description ?? null,
        p.imageUrl ?? null,
        p.bannerUrl ?? null,
        p.metaTitle ?? null,
        p.metaDescription ?? null,
        p.isActive,
        p.isFeatured,
        p.isAutomated,
        p.conditions ? JSON.stringify(p.conditions) : null,
        p.sortOrder,
        p.publishAt ?? null,
        p.unpublishAt ?? null,
        p.updatedAt,
      ],
    );
    return row ? mapToCollection(row) : null;
  }

  async delete(assortmentCollectionId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentCollectionId: string }>(
      `UPDATE "assortmentCollection" SET "deletedAt" = NOW(), "updatedAt" = NOW()
       WHERE "assortmentCollectionId" = $1 AND "deletedAt" IS NULL RETURNING "assortmentCollectionId"`,
      [assortmentCollectionId],
    );
    return !!row;
  }

  async hardDelete(assortmentCollectionId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentCollectionId: string }>(
      `DELETE FROM "assortmentCollection" WHERE "assortmentCollectionId" = $1 RETURNING "assortmentCollectionId"`,
      [assortmentCollectionId],
    );
    return !!row;
  }

  async listPublications(assortmentCollectionId: string): Promise<CollectionPublication[]> {
    const rows = await query<DbCollectionPublication[]>(
      `SELECT * FROM "assortmentCollectionPublication" WHERE "assortmentCollectionId" = $1 ORDER BY "sortOrder" ASC NULLS LAST`,
      [assortmentCollectionId],
    );
    return (rows ?? []).map(mapToPublication);
  }

  async upsertPublication(
    publication: Omit<CollectionPublication, 'assortmentCollectionPublicationId'> & { assortmentCollectionPublicationId?: string },
  ): Promise<CollectionPublication> {
    const id = publication.assortmentCollectionPublicationId ?? generateUUID();
    const row = await queryOne<DbCollectionPublication>(
      `INSERT INTO "assortmentCollectionPublication" (
         "assortmentCollectionPublicationId", "assortmentCollectionId", "storeId", "channelId", "sortOrder",
         "createdAt", "updatedAt"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT ON CONSTRAINT "uq_assortmentCollectionPublication_scope"
       DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = EXCLUDED."updatedAt"
       RETURNING *`,
      [
        id,
        publication.assortmentCollectionId,
        publication.storeId ?? null,
        publication.channelId ?? null,
        publication.sortOrder ?? null,
        new Date(),
        new Date(),
      ],
    );
    if (!row) throw new Error('Failed to save collection publication');
    return mapToPublication(row);
  }

  async deletePublication(assortmentCollectionPublicationId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentCollectionPublicationId: string }>(
      `DELETE FROM "assortmentCollectionPublication" WHERE "assortmentCollectionPublicationId" = $1 RETURNING "assortmentCollectionPublicationId"`,
      [assortmentCollectionPublicationId],
    );
    return !!row;
  }

  async resolveVisibleCollections(scope: CollectionScope): Promise<ScopedCollectionPlacement[]> {
    const rows = await query<Array<{ assortmentCollectionId: string; scopeSortOrder: number | null }>>(
      `SELECT c."assortmentCollectionId",
              (SELECT p."sortOrder"
               FROM "assortmentCollectionPublication" p
               WHERE p."assortmentCollectionId" = c."assortmentCollectionId"
                 AND (p."storeId" IS NULL OR p."storeId" = $1)
                 AND (p."channelId" IS NULL OR p."channelId" = $2)
               ORDER BY p."sortOrder" ASC NULLS LAST
               LIMIT 1) AS "scopeSortOrder"
       FROM "assortmentCollection" c
       WHERE c."deletedAt" IS NULL
         AND (
           NOT EXISTS (
             SELECT 1 FROM "assortmentCollectionPublication" p2
             WHERE p2."assortmentCollectionId" = c."assortmentCollectionId"
           )
           OR EXISTS (
             SELECT 1 FROM "assortmentCollectionPublication" p3
             WHERE p3."assortmentCollectionId" = c."assortmentCollectionId"
               AND (p3."storeId" IS NULL OR p3."storeId" = $1)
               AND (p3."channelId" IS NULL OR p3."channelId" = $2)
           )
         )`,
      [scope.storeId ?? null, scope.channelId ?? null],
    );
    return (rows ?? []).map(row => ({
      assortmentCollectionId: row.assortmentCollectionId,
      sortOrder: row.scopeSortOrder ?? undefined,
    }));
  }
}

function mapToPublication(row: DbCollectionPublication): CollectionPublication {
  return {
    assortmentCollectionPublicationId: row.assortmentCollectionPublicationId,
    assortmentCollectionId: row.assortmentCollectionId,
    storeId: row.storeId ?? undefined,
    channelId: row.channelId ?? undefined,
    sortOrder: row.sortOrder ?? undefined,
  };
}

export default new CollectionRepositoryImpl();
