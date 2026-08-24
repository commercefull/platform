/**
 * Reorder Page Blocks Use Case
 * Reorders content blocks within a page
 */

import type { ContentRepo } from '../../../infrastructure/repositories/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentBlockNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

export class ReorderPageBlocksCommand {
  constructor(
    public readonly pageId: string,
    public readonly blockOrders: Array<{ id: string; order: number }>,
    public readonly reorderedBy?: string,
  ) {}
}

export interface ReorderBlocksResponse {
  pageId: string;
  blocksReordered: number;
}

export class ReorderPageBlocksUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: ReorderPageBlocksCommand): Promise<ReorderBlocksResponse> {
    if (!command.pageId) {
      throw new ContentValidationError('Page ID is required');
    }

    if (!command.blockOrders || command.blockOrders.length === 0) {
      throw new ContentValidationError('Block orders are required');
    }

    // Verify page exists
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    // Verify all blocks exist and belong to this page
    const existingBlocks = await this.contentRepo.findBlocksByPageId(command.pageId);
    const existingBlockIds = new Set(existingBlocks.map(b => b.contentBlockId));

    for (const blockOrder of command.blockOrders) {
      if (!existingBlockIds.has(blockOrder.id)) {
        throw new ContentBlockNotFoundError(blockOrder.id);
      }
    }

    // Perform reorder
    await this.contentRepo.reorderBlocks(command.pageId, command.blockOrders);

    eventBus.emit('content.blocks.reordered', {
      pageId: command.pageId,
      blockOrders: command.blockOrders,
    });

    return {
      pageId: command.pageId,
      blocksReordered: command.blockOrders.length,
    };
  }
}
