/**
 * PostgreSQL Media Repository
 * Implementation of MediaRepository for PostgreSQL
 */

import { query, queryOne } from '../../../../libs/db';
import { Media, MediaFile } from '../../domain/entities/Media';
import { MediaRepository, MediaFilters } from '../../domain/repositories/MediaRepository';
import { Media as DbMedia } from '../../../../libs/db/types';

export class PostgreSQLMediaRepository implements MediaRepository {
  async save(media: Media): Promise<void> {
    const data = media.toJSON();

    await query(
      `
      INSERT INTO media (
        "mediaId", "originalName", "mimeType", size, "originalUrl",
        "processedFiles", "thumbnailUrl", "altText", title, description,
        tags, metadata, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT ("mediaId") DO UPDATE SET
        "processedFiles" = EXCLUDED."processedFiles",
        "thumbnailUrl" = EXCLUDED."thumbnailUrl",
        "altText" = EXCLUDED."altText",
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        metadata = EXCLUDED.metadata,
        "updatedAt" = EXCLUDED."updatedAt"
    `,
      [
        data.mediaId,
        data.originalName,
        data.mimeType,
        data.size,
        data.originalUrl,
        JSON.stringify(data.processedFiles),
        data.thumbnailUrl,
        data.altText,
        data.title,
        data.description,
        data.tags,
        JSON.stringify(data.metadata),
        data.createdAt,
        data.updatedAt,
      ],
    );
  }

  async findById(mediaId: string): Promise<Media | null> {
    const row = await queryOne<DbMedia>(
      `
      SELECT * FROM media WHERE "mediaId" = $1
    `,
      [mediaId],
    );

    return row ? this.mapToMedia(row) : null;
  }

  async findByIds(mediaIds: string[]): Promise<Media[]> {
    if (mediaIds.length === 0) {
      return [];
    }

    const rows = await query<DbMedia[]>(
      `
      SELECT * FROM media WHERE "mediaId" = ANY($1)
      ORDER BY "createdAt" DESC
    `,
      [mediaIds],
    );

    return (rows ?? []).map(row => this.mapToMedia(row));
  }

  async findAll(filters: MediaFilters = {}): Promise<Media[]> {
    let sql = 'SELECT * FROM media WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.mediaId) {
      sql += ` AND "mediaId" = $${paramIndex}`;
      params.push(filters.mediaId);
      paramIndex++;
    }

    if (filters.mimeType) {
      sql += ` AND "mimeType" = $${paramIndex}`;
      params.push(filters.mimeType);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      sql += ` AND tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    if (filters.createdAfter) {
      sql += ` AND "createdAt" >= $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      sql += ` AND "createdAt" <= $${paramIndex}`;
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.size?.min) {
      sql += ` AND size >= $${paramIndex}`;
      params.push(filters.size.min);
      paramIndex++;
    }

    if (filters.size?.max) {
      sql += ` AND size <= $${paramIndex}`;
      params.push(filters.size.max);
      paramIndex++;
    }

    sql += ' ORDER BY "createdAt" DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const rows = await query<DbMedia[]>(sql, params);
    return (rows ?? []).map(row => this.mapToMedia(row));
  }

  async delete(mediaId: string): Promise<void> {
    await query('DELETE FROM media WHERE "mediaId" = $1', [mediaId]);
  }

  async count(filters: Omit<MediaFilters, 'limit' | 'offset'> = {}): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM media WHERE 1=1';
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.mediaId) {
      sql += ` AND "mediaId" = $${paramIndex}`;
      params.push(filters.mediaId);
      paramIndex++;
    }

    if (filters.mimeType) {
      sql += ` AND "mimeType" = $${paramIndex}`;
      params.push(filters.mimeType);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      sql += ` AND tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    if (filters.createdAfter) {
      sql += ` AND "createdAt" >= $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      sql += ` AND "createdAt" <= $${paramIndex}`;
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.size?.min) {
      sql += ` AND size >= $${paramIndex}`;
      params.push(filters.size.min);
      paramIndex++;
    }

    if (filters.size?.max) {
      sql += ` AND size <= $${paramIndex}`;
      params.push(filters.size.max);
    }

    const row = await queryOne<{ count: string }>(sql, params);
    return parseInt(row?.count ?? '0', 10);
  }

  private mapToMedia(row: DbMedia): Media {
    return Media.reconstitute({
      mediaId: row.mediaId,
      originalName: row.originalName,
      mimeType: row.mimeType,
      size: Number(row.size),
      originalUrl: row.originalUrl,
      processedFiles: (row.processedFiles || []) as MediaFile[],
      thumbnailUrl: row.thumbnailUrl ?? undefined,
      altText: row.altText ?? undefined,
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}
