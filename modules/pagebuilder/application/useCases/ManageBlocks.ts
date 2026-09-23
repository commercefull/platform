import { generateUUID } from '../../../../libs/uuid';
import { PageDraft } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { blockSchemaRegistry } from '../../domain/services/BlockSchemaRegistry';
import {
  PageDraftNotFoundError,
  PageDraftValidationError,
  BlockNotFoundError,
  BlockTypeNotRegisteredError,
  BlockPlacementError,
} from '../../domain/errors/PageBuilderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

export interface AddBlockCommand {
  draftId: string;
  typeId: string;
  region: string;
  content?: Record<string, unknown>;
  settings?: Record<string, string | number | boolean>;
  parentBlockId?: string;
  order?: number;
}

export interface UpdateBlockCommand {
  draftId: string;
  blockId: string;
  content?: Record<string, unknown>;
  settings?: Record<string, string | number | boolean>;
}

export interface MoveBlockCommand {
  draftId: string;
  blockId: string;
  region: string;
  order: number;
  parentBlockId?: string;
}

export class ManageBlocksUseCase {
  constructor(private readonly repo: PageDraftRepository) {}

  async addBlock(cmd: AddBlockCommand): Promise<PageDraft> {
    const draft = await this.repo.findById(cmd.draftId);
    if (!draft) throw new PageDraftNotFoundError(cmd.draftId);

    if (!blockSchemaRegistry.has(cmd.typeId)) {
      throw new BlockTypeNotRegisteredError(cmd.typeId);
    }

    const def = blockSchemaRegistry.get(cmd.typeId)!;

    if (def.maxPerPage && def.maxPerPage > 0) {
      const count = draft.countBlocksByType(cmd.typeId);
      if (count >= def.maxPerPage) {
        throw new BlockPlacementError(`Maximum ${def.maxPerPage} instances of '${cmd.typeId}' allowed per page`);
      }
    }

    const content = cmd.content || blockSchemaRegistry.getDefaultContent(cmd.typeId);
    const settings = cmd.settings || blockSchemaRegistry.getDefaultSettings(cmd.typeId);

    const validation = blockSchemaRegistry.validateContent(cmd.typeId, content);
    if (!validation.valid) {
      throw new PageDraftValidationError(validation.errors.join('; '));
    }

    const blockId = generateUUID();
    draft.addBlock({
      blockId,
      typeId: cmd.typeId,
      region: cmd.region,
      content,
      settings,
      parentBlockId: cmd.parentBlockId,
      order: cmd.order,
    });

    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.block.added', { draftId: cmd.draftId, blockId, typeId: cmd.typeId });
    return saved;
  }

  async removeBlock(draftId: string, blockId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    const block = draft.getBlock(blockId);
    if (!block) throw new BlockNotFoundError(blockId);

    draft.removeBlock(blockId);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.block.removed', { draftId, blockId });
    return saved;
  }

  async moveBlock(cmd: MoveBlockCommand): Promise<PageDraft> {
    const draft = await this.repo.findById(cmd.draftId);
    if (!draft) throw new PageDraftNotFoundError(cmd.draftId);

    const block = draft.getBlock(cmd.blockId);
    if (!block) throw new BlockNotFoundError(cmd.blockId);

    draft.moveBlock(cmd.blockId, cmd.region, cmd.order, cmd.parentBlockId);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.block.moved', { draftId: cmd.draftId, blockId: cmd.blockId, region: cmd.region });
    return saved;
  }

  async updateBlock(cmd: UpdateBlockCommand): Promise<PageDraft> {
    const draft = await this.repo.findById(cmd.draftId);
    if (!draft) throw new PageDraftNotFoundError(cmd.draftId);

    const block = draft.getBlock(cmd.blockId);
    if (!block) throw new BlockNotFoundError(cmd.blockId);

    if (cmd.content) {
      const validation = blockSchemaRegistry.validateContent(block.typeId, cmd.content);
      if (!validation.valid) {
        throw new PageDraftValidationError(validation.errors.join('; '));
      }
      draft.updateBlockContent(cmd.blockId, cmd.content);
    }

    if (cmd.settings) {
      draft.updateBlockSettings(cmd.blockId, cmd.settings);
    }

    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.block.updated', { draftId: cmd.draftId, blockId: cmd.blockId });
    return saved;
  }

  async reorderBlocks(draftId: string, region: string, blockOrders: Array<{ blockId: string; order: number }>): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    for (const { blockId, order } of blockOrders) {
      draft.moveBlock(blockId, region, order);
    }

    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.blocks.reordered', { draftId, region });
    return saved;
  }
}

