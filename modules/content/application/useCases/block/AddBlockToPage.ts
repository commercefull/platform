/**
 * Add Block To Page Use Case
 * Adds a new content block to a page
 */

import { ContentRepo } from '../../../infrastructure/repositories/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class AddBlockToPageCommand {
  constructor(
    public readonly contentPageId: string,
    public readonly blockTypeId: string,
    public readonly title: string,
    public readonly content: Record<string, unknown>,
    public readonly sortOrder?: number,
    public readonly isVisible?: boolean,
    public readonly createdBy?: string,
  ) {}
}

export interface BlockResponse {
  contentBlockId: string;
  contentPageId: string;
  blockTypeId: string;
  title: string | null;
  sortOrder: number;
  content: Record<string, unknown>;
  isVisible: boolean;
  createdAt: Date;
}

export class AddBlockToPageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: AddBlockToPageCommand): Promise<BlockResponse> {
    if (!command.contentPageId || !command.blockTypeId || !command.title) {
      throw new Error('Content page ID, block type ID, and title are required');
    }

    // Verify page exists
    const page = await this.contentRepo.findPageById(command.contentPageId);
    if (!page) {
      throw new Error(`Page with ID ${command.contentPageId} not found`);
    }

    // Verify content type exists
    const contentType = await this.contentRepo.findBlockTypeById(command.blockTypeId);
    if (!contentType) {
      throw new Error(`Block type with ID ${command.blockTypeId} not found`);
    }

    // Get existing blocks to determine sort order
    let sortOrder = command.sortOrder;
    if (sortOrder === undefined) {
      const existingBlocks = await this.contentRepo.findBlocksByPageId(command.contentPageId);
      sortOrder = existingBlocks.length;
    }

    const block = await this.contentRepo.createBlock({
      contentPageId: command.contentPageId,
      blockTypeId: command.blockTypeId,
      title: command.title,
      sortOrder,
      content: command.content,
      isVisible: command.isVisible ?? true,
    });

    eventBus.emit('content.block.created', {
      blockId: block.contentBlockId,
      pageId: block.contentPageId,
      title: block.title,
      blockTypeId: block.blockTypeId,
      sortOrder: block.sortOrder,
    });

    return {
      contentBlockId: block.contentBlockId,
      contentPageId: block.contentPageId,
      blockTypeId: block.blockTypeId,
      title: block.title,
      sortOrder: block.sortOrder,
      content: block.content,
      isVisible: block.isVisible,
      createdAt: block.createdAt,
    };
  }
}
