/**
 * Page Builder Use Cases
 *
 * CRUD for page drafts, block management, publish, and preview resolution.
 * Integrates with the theme engine for preview rendering.
 */

import { generateUUID } from '../../../../libs/uuid';
import { PageDraft, PlacedBlockProps } from '../../domain/entities/PageDraft';
import { PageDraftRepository } from '../../domain/repositories/PageDraftRepository';
import { blockSchemaRegistry } from '../../domain/services/BlockSchemaRegistry';
import { themeRegistry } from '../../../theme/domain/services/ThemeRegistry';
import { ThemeRepository } from '../../../theme/domain/repositories/ThemeRepository';
import {
  PageDraftNotFoundError,
  PageDraftValidationError,
  BlockNotFoundError,
  BlockTypeNotRegisteredError,
  BlockPlacementError,
  DraftAlreadyPublishedError,
  DraftNotReadyToPublishError,
} from '../../domain/errors/PageBuilderErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ── Commands ───────────────────────────────────────────────────

export interface CreateDraftCommand {
  storeId: string;
  organizationId: string;
  themeId: string;
  title: string;
  slug: string;
  pageType: string;
  pageId?: string;
}

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

export interface PreviewDraftCommand {
  draftId: string;
}

// ── Theme Preview Resolution ───────────────────────────────────

export interface PreviewData {
  draft: PageDraft;
  theme: {
    themeId: string;
    slug: string;
    name: string;
    cssVariables: Record<string, string>;
    customCss?: string;
    headTags: string[];
    bodyAttributes: Record<string, string>;
  };
  blocks: PlacedBlockProps[];
  blockTypes: Map<string, { name: string; icon: string; category: string }>;
}

// ── Use Cases ──────────────────────────────────────────────────

export class ManageDraftsUseCase {
  constructor(private readonly repo: PageDraftRepository) {}

  async create(cmd: CreateDraftCommand): Promise<PageDraft> {
    if (!cmd.title?.trim()) throw new PageDraftValidationError('Title is required');
    if (!cmd.slug?.trim()) throw new PageDraftValidationError('Slug is required');
    if (!cmd.storeId) throw new PageDraftValidationError('Store ID is required');
    if (!cmd.themeId) throw new PageDraftValidationError('Theme ID is required');

    const draft = PageDraft.create({
      draftId: generateUUID(),
      pageId: cmd.pageId,
      storeId: cmd.storeId,
      organizationId: cmd.organizationId,
      themeId: cmd.themeId,
      title: cmd.title,
      slug: cmd.slug,
      pageType: cmd.pageType || 'page',
    });

    const saved = await this.repo.save(draft);

    eventBus.emit('pagebuilder.draft.created', {
      draftId: saved.draftId,
      storeId: cmd.storeId,
      title: cmd.title,
      slug: cmd.slug,
    });

    return saved;
  }

  async getById(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);
    return draft;
  }

  async getByPageId(pageId: string): Promise<PageDraft | null> {
    return this.repo.findByPageId(pageId);
  }

  async listByStore(storeId: string): Promise<PageDraft[]> {
    return this.repo.findByStore(storeId);
  }

  async listByOrganization(organizationId: string): Promise<PageDraft[]> {
    return this.repo.findByOrganization(organizationId);
  }

  async updateTitle(draftId: string, title: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateTitle(title);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'title' });
    return saved;
  }

  async updateSlug(draftId: string, slug: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateSlug(slug);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'slug' });
    return saved;
  }

  async updateTheme(draftId: string, themeId: string): Promise<PageDraft> {
    const draft = await this.getById(draftId);
    draft.updateTheme(themeId);
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.updated', { draftId, field: 'theme' });
    return saved;
  }

  async delete(draftId: string): Promise<boolean> {
    const result = await this.repo.delete(draftId);
    if (result) {
      eventBus.emit('pagebuilder.draft.deleted', { draftId });
    }
    return result;
  }
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

export class PublishDraftUseCase {
  constructor(private readonly repo: PageDraftRepository) {}

  async publish(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    if (draft.isPublished()) {
      throw new DraftAlreadyPublishedError(draftId);
    }

    if (draft.blocks.length === 0) {
      throw new DraftNotReadyToPublishError('Cannot publish a draft with no blocks');
    }

    draft.publish();
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.published', { draftId, storeId: draft.storeId, slug: draft.slug });
    return saved;
  }

  async unpublish(draftId: string): Promise<PageDraft> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    draft.unpublish();
    const saved = await this.repo.save(draft);
    eventBus.emit('pagebuilder.draft.unpublished', { draftId });
    return saved;
  }
}

export class PreviewDraftUseCase {
  constructor(
    private readonly repo: PageDraftRepository,
    private readonly themeRepo: ThemeRepository,
  ) {}

  async preview(draftId: string): Promise<PreviewData> {
    const draft = await this.repo.findById(draftId);
    if (!draft) throw new PageDraftNotFoundError(draftId);

    const resolved = await themeRegistry.resolveThemeForStore(draft.storeId, this.themeRepo);

    const blockTypes = new Map<string, { name: string; icon: string; category: string }>();
    for (const block of draft.blocks) {
      if (!blockTypes.has(block.typeId)) {
        const def = blockSchemaRegistry.get(block.typeId);
        if (def) {
          blockTypes.set(block.typeId, { name: def.name, icon: def.icon, category: def.category });
        }
      }
    }

    return {
      draft,
      theme: {
        themeId: resolved?.theme.themeId || draft.themeId,
        slug: resolved?.theme.slug || '',
        name: resolved?.theme.name || 'Unknown',
        cssVariables: resolved?.cssVariables || {},
        customCss: resolved?.customCss,
        headTags: resolved ? themeRegistry.generateHeadTags(resolved) : [],
        bodyAttributes: resolved ? themeRegistry.generateBodyAttributes(resolved) : {},
      },
      blocks: draft.blocks,
      blockTypes,
    };
  }
}

export class GetBlockTypesUseCase {
  execute() {
    return blockSchemaRegistry.list();
  }

  executeByCategory(category: string) {
    return blockSchemaRegistry.listByCategory(category as 'layout' | 'content' | 'media' | 'commerce' | 'advanced');
  }

  executeByRegion(region: string) {
    return blockSchemaRegistry.listByRegion(region);
  }
}
