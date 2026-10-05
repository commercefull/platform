import { query, queryOne } from '../../../../libs/db';
import type { AssortmentCollectionMap as DbAssortmentCollectionMap } from '../../../../libs/db/types';
import type { CollectionMapRepository } from '../../domain/repositories/AssortmentRepository';
import { CollectionMap, type CollectionMapProps } from '../../domain/entities/CollectionMap';

function mapToCollectionMap(row: DbAssortmentCollectionMap): CollectionMap {
  const props: CollectionMapProps = {
    assortmentCollectionMapId: row.assortmentCollectionMapId,
    assortmentCollectionId: row.assortmentCollectionId,
    productId: row.productId,
    position: row.position,
    addedManually: row.addedManually,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return CollectionMap.reconstitute(props);
}

class CollectionMapRepositoryImpl implements CollectionMapRepository {
  async findByCollection(assortmentCollectionId: string): Promise<CollectionMap[]> {
    const rows = await query<DbAssortmentCollectionMap[]>(
      `SELECT * FROM "assortmentCollectionMap" WHERE "assortmentCollectionId" = $1 ORDER BY "position" ASC`,
      [assortmentCollectionId],
    );
    return (rows ?? []).map(mapToCollectionMap);
  }

  async findByProduct(assortmentCollectionId: string, productId: string): Promise<CollectionMap | null> {
    const row = await queryOne<DbAssortmentCollectionMap>(
      `SELECT * FROM "assortmentCollectionMap" WHERE "assortmentCollectionId" = $1 AND "productId" = $2`,
      [assortmentCollectionId, productId],
    );
    return row ? mapToCollectionMap(row) : null;
  }

  async create(map: CollectionMap): Promise<CollectionMap> {
    const p = map.toJSON();
    const row = await queryOne<DbAssortmentCollectionMap>(
      `INSERT INTO "assortmentCollectionMap" (
         "assortmentCollectionMapId", "assortmentCollectionId", "productId", "position", "addedManually", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [p.assortmentCollectionMapId, p.assortmentCollectionId, p.productId, p.position, p.addedManually, p.createdAt, p.updatedAt],
    );
    if (!row) throw new Error('Failed to create collection map entry');
    return mapToCollectionMap(row);
  }

  async delete(assortmentCollectionMapId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentCollectionMapId: string }>(
      `DELETE FROM "assortmentCollectionMap" WHERE "assortmentCollectionMapId" = $1 RETURNING "assortmentCollectionMapId"`,
      [assortmentCollectionMapId],
    );
    return !!row;
  }

  async deleteByProduct(assortmentCollectionId: string, productId: string): Promise<boolean> {
    const row = await queryOne<{ assortmentCollectionMapId: string }>(
      `DELETE FROM "assortmentCollectionMap" WHERE "assortmentCollectionId" = $1 AND "productId" = $2 RETURNING "assortmentCollectionMapId"`,
      [assortmentCollectionId, productId],
    );
    return !!row;
  }

  async deleteByCollection(assortmentCollectionId: string): Promise<void> {
    await query(`DELETE FROM "assortmentCollectionMap" WHERE "assortmentCollectionId" = $1`, [assortmentCollectionId]);
  }
}

export default new CollectionMapRepositoryImpl();
