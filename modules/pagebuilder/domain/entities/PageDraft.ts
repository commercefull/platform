/**
 * PageDraft Entity
 *
 * Represents a builder draft of a page — a collection of placed blocks
 * organized into layout regions. Drafts can be previewed, versioned,
 * and published to create/update a content page.
 *
 * Integration with Theme Engine:
 * - The draft references a themeId for preview rendering
 * - Layout regions come from the theme's layout config
 * - When published, the CSS variables from the theme + override are applied
 */

export type DraftStatus = 'draft' | 'published' | 'archived';

import { PageDraftValidationError } from '../errors/PageBuilderErrors';

export interface PlacedBlockProps {
  blockId: string;
  typeId: string;
  region: string;
  order: number;
  content: Record<string, unknown>;
  settings: Record<string, string | number | boolean>;
  /** For container blocks: child block IDs in order */
  childBlockIds?: string[];
  /** Parent block ID if this block is inside a container */
  parentBlockId?: string;
}

export interface PageDraftProps {
  draftId: string;
  pageId?: string;
  storeId: string;
  organizationId: string;
  themeId: string;
  title: string;
  slug: string;
  pageType: string;
  status: DraftStatus;
  blocks: PlacedBlockProps[];
  version: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class PageDraft {
  private props: PageDraftProps;

  private constructor(props: PageDraftProps) {
    this.props = props;
  }

  static create(props: Omit<PageDraftProps, 'status' | 'blocks' | 'version' | 'createdAt' | 'updatedAt'> & {
    blocks?: PlacedBlockProps[];
    status?: DraftStatus;
  }): PageDraft {
    const now = new Date();
    return new PageDraft({
      ...props,
      blocks: props.blocks || [],
      status: props.status || 'draft',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: PageDraftProps): PageDraft {
    return new PageDraft(props);
  }

  // ── Getters ──────────────────────────────────────────────────

  get draftId(): string { return this.props.draftId; }
  get pageId(): string | undefined { return this.props.pageId; }
  get storeId(): string { return this.props.storeId; }
  get organizationId(): string { return this.props.organizationId; }
  get themeId(): string { return this.props.themeId; }
  get title(): string { return this.props.title; }
  get slug(): string { return this.props.slug; }
  get pageType(): string { return this.props.pageType; }
  get status(): DraftStatus { return this.props.status; }
  get blocks(): PlacedBlockProps[] { return this.props.blocks; }
  get version(): number { return this.props.version; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isDraft(): boolean { return this.props.status === 'draft'; }
  isPublished(): boolean { return this.props.status === 'published'; }

  // ── Block Management ─────────────────────────────────────────

  /**
   * Add a block to a region at a specific order position.
   */
  addBlock(block: Omit<PlacedBlockProps, 'order'> & { order?: number }): PlacedBlockProps {
    const order = block.order ?? this.getNextOrder(block.region, block.parentBlockId);

    const newBlock: PlacedBlockProps = {
      blockId: block.blockId,
      typeId: block.typeId,
      region: block.region,
      order,
      content: block.content,
      settings: block.settings,
      childBlockIds: block.childBlockIds,
      parentBlockId: block.parentBlockId,
    };

    this.props.blocks.push(newBlock);
    this.sortBlocks();
    this.touch();

    return newBlock;
  }

  /**
   * Remove a block by ID. Also removes from parent's childBlockIds.
   */
  removeBlock(blockId: string): void {
    const block = this.props.blocks.find(b => b.blockId === blockId);
    if (!block) return;

    // Remove from parent's child list
    if (block.parentBlockId) {
      const parent = this.props.blocks.find(b => b.blockId === block.parentBlockId);
      if (parent?.childBlockIds) {
        parent.childBlockIds = parent.childBlockIds.filter(id => id !== blockId);
      }
    }

    // Remove child blocks if this is a container
    if (block.childBlockIds) {
      this.props.blocks = this.props.blocks.filter(b => b.parentBlockId !== blockId);
    }

    this.props.blocks = this.props.blocks.filter(b => b.blockId !== blockId);
    this.sortBlocks();
    this.touch();
  }

  /**
   * Move a block to a different region and/or order position.
   */
  moveBlock(blockId: string, region: string, order: number, parentBlockId?: string): void {
    const block = this.props.blocks.find(b => b.blockId === blockId);
    if (!block) return;

    // Remove from old parent's child list
    if (block.parentBlockId && block.parentBlockId !== parentBlockId) {
      const oldParent = this.props.blocks.find(b => b.blockId === block.parentBlockId);
      if (oldParent?.childBlockIds) {
        oldParent.childBlockIds = oldParent.childBlockIds.filter(id => id !== blockId);
      }
    }

    block.region = region;
    block.order = order;
    block.parentBlockId = parentBlockId;

    // Add to new parent's child list
    if (parentBlockId) {
      const newParent = this.props.blocks.find(b => b.blockId === parentBlockId);
      if (newParent) {
        if (!newParent.childBlockIds) newParent.childBlockIds = [];
        if (!newParent.childBlockIds.includes(blockId)) {
          newParent.childBlockIds.push(blockId);
        }
      }
    }

    this.sortBlocks();
    this.touch();
  }

  /**
   * Update a block's content.
   */
  updateBlockContent(blockId: string, content: Record<string, unknown>): void {
    const block = this.props.blocks.find(b => b.blockId === blockId);
    if (!block) return;
    block.content = content;
    this.touch();
  }

  /**
   * Update a block's style settings.
   */
  updateBlockSettings(blockId: string, settings: Record<string, string | number | boolean>): void {
    const block = this.props.blocks.find(b => b.blockId === blockId);
    if (!block) return;
    block.settings = settings;
    this.touch();
  }

  /**
   * Get blocks for a specific region, sorted by order.
   */
  getBlocksByRegion(region: string): PlacedBlockProps[] {
    return this.props.blocks
      .filter(b => b.region === region && !b.parentBlockId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get child blocks of a container block.
   */
  getChildBlocks(parentBlockId: string): PlacedBlockProps[] {
    return this.props.blocks
      .filter(b => b.parentBlockId === parentBlockId)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get a single block by ID.
   */
  getBlock(blockId: string): PlacedBlockProps | undefined {
    return this.props.blocks.find(b => b.blockId === blockId);
  }

  /**
   * Get all regions that have blocks.
   */
  getActiveRegions(): string[] {
    return Array.from(new Set(this.props.blocks.map(b => b.region)));
  }

  /**
   * Count blocks by type.
   */
  countBlocksByType(typeId: string): number {
    return this.props.blocks.filter(b => b.typeId === typeId).length;
  }

  // ── Lifecycle ────────────────────────────────────────────────

  publish(): void {
    this.props.status = 'published';
    this.props.publishedAt = new Date();
    this.props.version += 1;
    this.touch();
  }

  archive(): void {
    this.props.status = 'archived';
    this.touch();
  }

  unpublish(): void {
    this.props.status = 'draft';
    this.props.publishedAt = undefined;
    this.touch();
  }

  // ── Updates ──────────────────────────────────────────────────

  updateTitle(title: string): void {
    if (!title || !title.trim()) throw new PageDraftValidationError('Title cannot be empty');
    this.props.title = title.trim();
    this.touch();
  }

  updateSlug(slug: string): void {
    if (!slug || !slug.trim()) throw new PageDraftValidationError('Slug cannot be empty');
    this.props.slug = slug.trim().toLowerCase().replace(/\s+/g, '-');
    this.touch();
  }

  updateTheme(themeId: string): void {
    if (!themeId) throw new PageDraftValidationError('Theme ID cannot be empty');
    this.props.themeId = themeId;
    this.touch();
  }

  // ── Serialization ────────────────────────────────────────────

  toJSON(): PageDraftProps {
    return {
      ...this.props,
      blocks: this.props.blocks.map(b => ({ ...b })),
    };
  }

  // ── Private ──────────────────────────────────────────────────

  private getNextOrder(region: string, parentBlockId?: string): number {
    const siblings = this.props.blocks.filter(
      b => b.region === region && b.parentBlockId === parentBlockId,
    );
    if (siblings.length === 0) return 0;
    return Math.max(...siblings.map(b => b.order)) + 1;
  }

  private sortBlocks(): void {
    this.props.blocks.sort((a, b) => {
      if (a.region !== b.region) return a.region.localeCompare(b.region);
      if (a.parentBlockId !== b.parentBlockId) {
        return (a.parentBlockId || '').localeCompare(b.parentBlockId || '');
      }
      return a.order - b.order;
    });
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
