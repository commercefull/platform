/**
 * PageDraft Entity Tests
 */

import { PageDraft } from './PageDraft';

describe('PageDraft', () => {
  const baseProps = {
    draftId: 'draft_1',
    storeId: 'store_1',
    organizationId: 'org_1',
    themeId: 'theme_1',
    title: 'Home Page',
    slug: 'home',
    pageType: 'page',
  };

  describe('create', () => {
    it('should create with defaults', () => {
      const draft = PageDraft.create(baseProps);
      expect(draft.draftId).toBe('draft_1');
      expect(draft.title).toBe('Home Page');
      expect(draft.slug).toBe('home');
      expect(draft.status).toBe('draft');
      expect(draft.blocks).toEqual([]);
      expect(draft.version).toBe(1);
      expect(draft.isDraft()).toBe(true);
      expect(draft.isPublished()).toBe(false);
    });

    it('should create with initial blocks', () => {
      const draft = PageDraft.create({
        ...baseProps,
        blocks: [{ blockId: 'b1', typeId: 'heading', region: 'main', order: 0, content: {}, settings: {} }],
      });
      expect(draft.blocks).toHaveLength(1);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const draft = PageDraft.reconstitute({
        ...baseProps,
        status: 'published',
        blocks: [],
        version: 3,
        publishedAt: new Date('2026-01-01'),
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(draft.status).toBe('published');
      expect(draft.version).toBe(3);
      expect(draft.isPublished()).toBe(true);
    });
  });

  describe('addBlock', () => {
    it('should add a block with auto-order', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });
      draft.addBlock({ blockId: 'b2', typeId: 'text', region: 'main', content: {}, settings: {} });

      expect(draft.blocks).toHaveLength(2);
      expect(draft.blocks[0].order).toBe(0);
      expect(draft.blocks[1].order).toBe(1);
    });

    it('should add a block with explicit order', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {}, order: 5 });
      expect(draft.blocks[0].order).toBe(5);
    });
  });

  describe('removeBlock', () => {
    it('should remove a block', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });
      draft.addBlock({ blockId: 'b2', typeId: 'text', region: 'main', content: {}, settings: {} });

      draft.removeBlock('b1');
      expect(draft.blocks).toHaveLength(1);
      expect(draft.getBlock('b1')).toBeUndefined();
    });

    it('should remove child blocks when removing a container', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'c1', typeId: 'container', region: 'main', content: {}, settings: {}, childBlockIds: ['c1a'] });
      draft.addBlock({ blockId: 'c1a', typeId: 'text', region: 'main', content: {}, settings: {}, parentBlockId: 'c1' });

      draft.removeBlock('c1');
      expect(draft.getBlock('c1')).toBeUndefined();
      expect(draft.getBlock('c1a')).toBeUndefined();
    });
  });

  describe('moveBlock', () => {
    it('should move block to different region', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });

      draft.moveBlock('b1', 'sidebar', 0);
      expect(draft.getBlock('b1')?.region).toBe('sidebar');
    });
  });

  describe('updateBlockContent', () => {
    it('should update block content', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: { text: 'Hello' }, settings: {} });

      draft.updateBlockContent('b1', { text: 'Updated' });
      expect(draft.getBlock('b1')?.content).toEqual({ text: 'Updated' });
    });
  });

  describe('updateBlockSettings', () => {
    it('should update block settings', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: { marginTop: 0 } });

      draft.updateBlockSettings('b1', { marginTop: 20 });
      expect(draft.getBlock('b1')?.settings).toEqual({ marginTop: 20 });
    });
  });

  describe('getBlocksByRegion', () => {
    it('should return blocks sorted by order', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b2', typeId: 'text', region: 'main', content: {}, settings: {}, order: 1 });
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {}, order: 0 });
      draft.addBlock({ blockId: 'b3', typeId: 'image', region: 'sidebar', content: {}, settings: {} });

      const mainBlocks = draft.getBlocksByRegion('main');
      expect(mainBlocks).toHaveLength(2);
      expect(mainBlocks[0].blockId).toBe('b1');
      expect(mainBlocks[1].blockId).toBe('b2');
    });
  });

  describe('publish', () => {
    it('should publish and increment version', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });

      draft.publish();
      expect(draft.isPublished()).toBe(true);
      expect(draft.version).toBe(2);
      expect(draft.publishedAt).toBeDefined();
    });
  });

  describe('unpublish', () => {
    it('should unpublish', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });
      draft.publish();
      draft.unpublish();
      expect(draft.isDraft()).toBe(true);
      expect(draft.publishedAt).toBeUndefined();
    });
  });

  describe('updateTitle', () => {
    it('should update title', () => {
      const draft = PageDraft.create(baseProps);
      draft.updateTitle('New Title');
      expect(draft.title).toBe('New Title');
    });

    it('should throw on empty title', () => {
      const draft = PageDraft.create(baseProps);
      expect(() => draft.updateTitle('')).toThrow();
    });
  });

  describe('updateSlug', () => {
    it('should slugify the slug', () => {
      const draft = PageDraft.create(baseProps);
      draft.updateSlug('My New Page');
      expect(draft.slug).toBe('my-new-page');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const draft = PageDraft.create(baseProps);
      draft.addBlock({ blockId: 'b1', typeId: 'heading', region: 'main', content: {}, settings: {} });
      const json = draft.toJSON();
      expect(json.draftId).toBe('draft_1');
      expect(json.blocks).toHaveLength(1);
    });
  });
});
