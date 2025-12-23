/**
 * Add Block To Page Use Case
 * Adds a new content block to a page
 */

import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class AddBlockToPageCommand {
  constructor(
    public readonly pageId: string,
    public readonly contentTypeId: string,
    public readonly name: string,
    public readonly content: Record<string, any>,
    public readonly order?: number,
    public readonly status?: 'active' | 'inactive',
    public readonly createdBy?: string,
  ) {}
}

export interface BlockResponse {
  id: string;
  pageId: string;
  contentTypeId: string;
  name: string;
  order: number;
  content: Record<string, any>;
  status: string;
  createdAt: string;
}

export class AddBlockToPageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: AddBlockToPageCommand): Promise<BlockResponse> {
    if (!command.pageId || !command.contentTypeId || !command.name) {
      throw new Error('Page ID, content type ID, and name are required');
    }

    // Verify page exists
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new Error(`Page with ID ${command.pageId} not found`);
    }

    // Verify content type exists
    const contentType = await this.contentRepo.findContentTypeById(command.contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID ${command.contentTypeId} not found`);
    }

    // Get existing blocks to determine order
    let order = command.order;
    if (order === undefined) {
      const existingBlocks = await this.contentRepo.findBlocksByPageId(command.pageId);
      order = existingBlocks.length;
    }

    const block = await this.contentRepo.createBlock({
      pageId: command.pageId,
      contentTypeId: command.contentTypeId,
      name: command.name,
      order,
      content: command.content,
      status: command.status || 'active',
    });

    eventBus.emit('content.block.created', {
      blockId: block.id,
      pageId: block.pageId,
      name: block.name,
      contentTypeId: block.contentTypeId,
      order: block.order,
    });

    return {
      id: block.id,
      pageId: block.pageId,
      contentTypeId: block.contentTypeId,
      name: block.name,
      order: block.order,
      content: block.content,
      status: block.status,
      createdAt: block.createdAt,
    };
  }
}
