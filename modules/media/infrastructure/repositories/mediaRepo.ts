/**
 * PostgreSQL Media Repository
 * Implementation of MediaRepository for PostgreSQL
 */

import { pool } from '../../../../libs/db/pool';
import { Media } from '../../domain/entities/Media';
import { MediaRepository, MediaFilters } from '../../domain/repositories/MediaRepository';

export class PostgreSQLMediaRepository implements MediaRepository {
  async save(media: Media): Promise<void> {
    const data = media.toJSON();

    await pool.query(
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
    const result = await pool.query(
      `
      SELECT * FROM media WHERE "mediaId" = $1
    `,
      [mediaId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToMedia(result.rows[0]);
  }

  async findByIds(mediaIds: string[]): Promise<Media[]> {
    if (mediaIds.length === 0) {
      return [];
    }

    const result = await pool.query(
      `
      SELECT * FROM media WHERE "mediaId" = ANY($1)
      ORDER BY "createdAt" DESC
    `,
      [mediaIds],
    );

    return result.rows.map(row => this.mapToMedia(row));
  }

  async findAll(filters: MediaFilters = {}): Promise<Media[]> {
    let query = 'SELECT * FROM media WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.mediaId) {
      query += ` AND "mediaId" = $${paramIndex}`;
      params.push(filters.mediaId);
      paramIndex++;
    }

    if (filters.mimeType) {
      query += ` AND "mimeType" = $${paramIndex}`;
      params.push(filters.mimeType);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    if (filters.createdAfter) {
      query += ` AND "createdAt" >= $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      query += ` AND "createdAt" <= $${paramIndex}`;
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.size?.min) {
      query += ` AND size >= $${paramIndex}`;
      params.push(filters.size.min);
      paramIndex++;
    }

    if (filters.size?.max) {
      query += ` AND size <= $${paramIndex}`;
      params.push(filters.size.max);
      paramIndex++;
    }

    query += ' ORDER BY "createdAt" DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => this.mapToMedia(row));
  }

  async delete(mediaId: string): Promise<void> {
    await pool.query('DELETE FROM media WHERE "mediaId" = $1', [mediaId]);
  }

  async count(filters: Omit<MediaFilters, 'limit' | 'offset'> = {}): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM media WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.mediaId) {
      query += ` AND "mediaId" = $${paramIndex}`;
      params.push(filters.mediaId);
      paramIndex++;
    }

    if (filters.mimeType) {
      query += ` AND "mimeType" = $${paramIndex}`;
      params.push(filters.mimeType);
      paramIndex++;
    }

    if (filters.tags && filters.tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    if (filters.createdAfter) {
      query += ` AND "createdAt" >= $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    if (filters.createdBefore) {
      query += ` AND "createdAt" <= $${paramIndex}`;
      params.push(filters.createdBefore);
      paramIndex++;
    }

    if (filters.size?.min) {
      query += ` AND size >= $${paramIndex}`;
      params.push(filters.size.min);
      paramIndex++;
    }

    if (filters.size?.max) {
      query += ` AND size <= $${paramIndex}`;
      params.push(filters.size.max);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  private mapToMedia(row: any): Media {
    return Media.reconstitute({
      mediaId: row.mediaId,
      originalName: row.originalName,
      mimeType: row.mimeType,
      size: row.size,
      originalUrl: row.originalUrl,
      processedFiles: row.processedFiles || [],
      thumbnailUrl: row.thumbnailUrl,
      altText: row.altText,
      title: row.title,
      description: row.description,
      tags: row.tags || [],
      metadata: row.metadata || {},
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}
