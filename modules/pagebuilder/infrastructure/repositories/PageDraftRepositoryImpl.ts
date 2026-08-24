/**
 * Page Draft Repository — PostgreSQL Implementation
 */

import { query, queryOne } from '../../../../libs/db';
import { PageDraft, PageDraftProps, PlacedBlockProps } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { PageDraftValidationError } from '../../domain/errors/PageBuilderErrors';

interface DraftRow {
  draftId: string;
  pageId: string | null;
  storeId: string;
  organizationId: string;
  themeId: string;
  title: string;
  slug: string;
  pageType: string;
  status: string;
  blocks: PlacedBlockProps[];
  version: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PageDraftRepositoryImpl implements PageDraftRepository {
  async findById(draftId: string): Promise<PageDraft | null> {
    const row = await queryOne<DraftRow>(
      `SELECT * FROM "pageDraft" WHERE "draftId" = $1`,
      [draftId],
    );
    return row ? this.mapToDraft(row) : null;
  }

  async findByPageId(pageId: string): Promise<PageDraft | null> {
    const row = await queryOne<DraftRow>(
      `SELECT * FROM "pageDraft" WHERE "pageId" = $1 AND "status" != 'archived' ORDER BY "updatedAt" DESC LIMIT 1`,
      [pageId],
    );
    return row ? this.mapToDraft(row) : null;
  }

  async findByStore(storeId: string): Promise<PageDraft[]> {
    const rows = await query<DraftRow[]>(
      `SELECT * FROM "pageDraft" WHERE "storeId" = $1 AND "status" != 'archived' ORDER BY "updatedAt" DESC`,
      [storeId],
    );
    return (rows || []).map(row => this.mapToDraft(row));
  }

  async findByOrganization(organizationId: string): Promise<PageDraft[]> {
    const rows = await query<DraftRow[]>(
      `SELECT * FROM "pageDraft" WHERE "organizationId" = $1 AND "status" != 'archived' ORDER BY "updatedAt" DESC`,
      [organizationId],
    );
    return (rows || []).map(row => this.mapToDraft(row));
  }

  async findBySlug(slug: string, storeId: string): Promise<PageDraft | null> {
    const row = await queryOne<DraftRow>(
      `SELECT * FROM "pageDraft" WHERE "slug" = $1 AND "storeId" = $2 AND "status" != 'archived' LIMIT 1`,
      [slug, storeId],
    );
    return row ? this.mapToDraft(row) : null;
  }

  async findPublishedByStore(storeId: string): Promise<PageDraft[]> {
    const rows = await query<DraftRow[]>(
      `SELECT * FROM "pageDraft" WHERE "storeId" = $1 AND "status" = 'published' ORDER BY "publishedAt" DESC`,
      [storeId],
    );
    return (rows || []).map(row => this.mapToDraft(row));
  }

  async findPublishedBySlug(slug: string, storeId: string): Promise<PageDraft | null> {
    const row = await queryOne<DraftRow>(
      `SELECT * FROM "pageDraft" WHERE "slug" = $1 AND "storeId" = $2 AND "status" = 'published' LIMIT 1`,
      [slug, storeId],
    );
    return row ? this.mapToDraft(row) : null;
  }

  async save(draft: PageDraft): Promise<PageDraft> {
    const data = draft.toJSON();

    const existing = await this.findById(data.draftId);

    if (existing) {
      const row = await queryOne<DraftRow>(
        `UPDATE "pageDraft" SET
          "pageId" = $2,
          "themeId" = $3,
          "title" = $4,
          "slug" = $5,
          "pageType" = $6,
          "status" = $7,
          "blocks" = $8,
          "version" = $9,
          "publishedAt" = $10,
          "updatedAt" = NOW()
        WHERE "draftId" = $1
        RETURNING *`,
        [
          data.draftId,
          data.pageId || null,
          data.themeId,
          data.title,
          data.slug,
          data.pageType,
          data.status,
          JSON.stringify(data.blocks),
          data.version,
          data.publishedAt || null,
        ],
      );
      if (!row) throw new PageDraftValidationError(`Failed to update draft ${data.draftId}`);
      return this.mapToDraft(row);
    }

    const row = await queryOne<DraftRow>(
      `INSERT INTO "pageDraft" (
        "draftId", "pageId", "storeId", "organizationId", "themeId",
        "title", "slug", "pageType", "status", "blocks", "version",
        "publishedAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        data.draftId,
        data.pageId || null,
        data.storeId,
        data.organizationId,
        data.themeId,
        data.title,
        data.slug,
        data.pageType,
        data.status,
        JSON.stringify(data.blocks),
        data.version,
        data.publishedAt || null,
      ],
    );
    if (!row) throw new PageDraftValidationError(`Failed to create draft ${data.draftId}`);
    return this.mapToDraft(row);
  }

  async delete(draftId: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `DELETE FROM "pageDraft" WHERE "draftId" = $1 RETURNING "draftId" as id`,
      [draftId],
    );
    return !!result;
  }

  private mapToDraft(row: DraftRow): PageDraft {
    const props: PageDraftProps = {
      draftId: row.draftId,
      pageId: row.pageId || undefined,
      storeId: row.storeId,
      organizationId: row.organizationId,
      themeId: row.themeId,
      title: row.title,
      slug: row.slug,
      pageType: row.pageType,
      status: row.status as PageDraftProps['status'],
      blocks: Array.isArray(row.blocks) ? row.blocks : [],
      version: row.version,
      publishedAt: row.publishedAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PageDraft.reconstitute(props);
  }
}
