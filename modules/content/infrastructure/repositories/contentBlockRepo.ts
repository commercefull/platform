/**
 * Content Block Repository
 * Database operations for content blocks within pages
 */

import { queryOne, query } from '../../../../libs/db';
import { ContentBlock, ContentBlockType, ContentPage } from '../../../../libs/db/types';
import { unixTimestamp } from '../../../../libs/date';
import {
  ContentTypeNotFoundError,
  ContentPageNotFoundError,
  ContentBlockNotFoundError,
  ContentValidationError,
  FailedToCreateContentError,
} from '../../domain/errors/ContentErrors';
import type { ContentBlockType as DbContentBlockType } from '../../../../libs/db/types';
import type { ContentPage as DbContentPage } from '../../../../libs/db/types';
import type { ContentBlock as DbContentBlock } from '../../../../libs/db/types';
import { TABLES } from './contentTables';

export type ContentBlockCreateParams = Omit<
  ContentBlock,
  | 'contentBlockId'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'parentBlockId'
  | 'cssClasses'
  | 'conditions'
  | 'settings'
  | 'area'
>;
export type ContentBlockUpdateParams = Partial<
  Omit<ContentBlock, 'contentBlockId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
>;

export class ContentBlockRepo {
  private async findPageById(id: string): Promise<ContentPage | null> {
    return queryOne<DbContentPage>(`SELECT * FROM "${TABLES.CONTENT_PAGE}" WHERE "contentPageId" = $1`, [id]);
  }

  private async findBlockTypeById(id: string): Promise<ContentBlockType | null> {
    return queryOne<DbContentBlockType>(`SELECT * FROM "${TABLES.CONTENT_BLOCK_TYPE}" WHERE "contentBlockTypeId" = $1`, [id]);
  }

  // Content Block methods
  async findBlockById(id: string): Promise<ContentBlock | null> {
    return queryOne<DbContentBlock>(`SELECT * FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentBlockId" = $1`, [id]);
  }

  async findBlocksByPageId(pageId: string): Promise<ContentBlock[]> {
    const results = await query<DbContentBlock[]>(
      `SELECT * FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentPageId" = $1 ORDER BY "sortOrder" ASC`,
      [pageId],
    );
    return results || [];
  }

  async createBlock(params: ContentBlockCreateParams): Promise<ContentBlock> {
    const now = unixTimestamp();

    // Validate that page exists
    const page = await this.findPageById(params.contentPageId);
    if (!page) {
      throw new ContentPageNotFoundError(params.contentPageId);
    }

    // Validate that block type exists
    const blockType = await this.findBlockTypeById(params.blockTypeId);
    if (!blockType) {
      throw new ContentTypeNotFoundError(params.blockTypeId);
    }

    const result = await queryOne<DbContentBlock>(
      `INSERT INTO "${TABLES.CONTENT_BLOCK}"
      ("contentPageId", "blockTypeId", "title", "area", "sortOrder", "content", "isVisible", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        params.contentPageId,
        params.blockTypeId,
        params.title || null,
        'main',
        params.sortOrder,
        JSON.stringify(params.content),
        params.isVisible,
        now,
        now,
      ],
    );

    if (!result) {
      throw new FailedToCreateContentError('Failed to create content block');
    }

    return result;
  }

  async updateBlock(id: string, params: ContentBlockUpdateParams): Promise<ContentBlock> {
    const now = unixTimestamp();
    const currentBlock = await this.findBlockById(id);

    if (!currentBlock) {
      throw new ContentBlockNotFoundError(id);
    }

    // Build dynamic query with DB column names
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        if (key === 'content' || key === 'settings' || key === 'conditions') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    });

    // Always update the updatedAt timestamp
    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(now);

    // If no fields to update, just return the current block
    if (updateFields.length === 1) {
      return currentBlock;
    }

    // Add ID for WHERE clause
    values.push(id);

    const sql = `
      UPDATE "${TABLES.CONTENT_BLOCK}"
      SET ${updateFields.join(', ')}
      WHERE "contentBlockId" = $${paramIndex}
      RETURNING *
    `;

    const result = await queryOne<DbContentBlock>(sql, values);

    if (!result) {
      throw new FailedToCreateContentError(`Failed to update content block with ID ${id}`);
    }

    return result;
  }

  async deleteBlock(id: string): Promise<boolean> {
    const result = await queryOne<{ id: string }>(
      `DELETE FROM "${TABLES.CONTENT_BLOCK}" WHERE "contentBlockId" = $1 RETURNING "contentBlockId" as id`,
      [id],
    );

    return !!result;
  }

  /**
   * Reorders content blocks for a specific page
   * @param pageId The ID of the page
   * @param blockOrders Array of {id, order} objects representing new block ordering
   * @returns Promise resolving to true if successful
   */
  async reorderBlocks(pageId: string, blockOrders: Array<{ id: string; order: number }>): Promise<boolean> {
    // Verify page exists
    const page = await this.findPageById(pageId);
    if (!page) {
      throw new ContentPageNotFoundError(pageId);
    }

    // Process each block order update individually
    for (const blockOrder of blockOrders) {
      // Verify block exists and belongs to this page
      const block = await this.findBlockById(blockOrder.id);
      if (!block) {
        throw new ContentBlockNotFoundError(blockOrder.id);
      }

      if (block.contentPageId !== pageId) {
        throw new ContentValidationError(`Block with ID ${blockOrder.id} does not belong to page ${pageId}`);
      }

      // Update the block order
      await query(`UPDATE "${TABLES.CONTENT_BLOCK}" SET "sortOrder" = $1, "updatedAt" = $2 WHERE "contentBlockId" = $3`, [
        blockOrder.order,
        unixTimestamp(),
        blockOrder.id,
      ]);
    }

    return true;
  }
}
