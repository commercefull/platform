/**
 * Unit Tests for ContentPage Entity
 */

import { ContentPage, ContentBlock } from './ContentPage';

describe('ContentPage', () => {
  function createPage(): ContentPage {
    return ContentPage.create({
      pageId: 'page-1',
      title: 'About Us',
      slug: 'about-us',
      locale: 'en',
    });
  }

  describe('create', () => {
    it('should create with draft status and empty blocks', () => {
      const page = createPage();

      expect(page.pageId).toBe('page-1');
      expect(page.title).toBe('About Us');
      expect(page.slug).toBe('about-us');
      expect(page.status).toBe('draft');
      expect(page.blocks).toHaveLength(0);
      expect(page.isPublished).toBe(false);
    });

    it('should create with provided blocks', () => {
      const blocks: ContentBlock[] = [
        { blockId: 'b-1', type: 'text', content: { text: 'Hello' }, position: 0 },
      ];
      const page = ContentPage.create({
        pageId: 'page-1',
        title: 'Test',
        slug: 'test',
        locale: 'en',
        blocks,
      });

      expect(page.blocks).toHaveLength(1);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from props', () => {
      const page = ContentPage.reconstitute({
        pageId: 'page-1',
        title: 'Test',
        slug: 'test',
        blocks: [],
        status: 'published',
        locale: 'en',
        order: 0,
        isHomepage: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      expect(page.status).toBe('published');
      expect(page.isPublished).toBe(true);
    });
  });

  describe('publish', () => {
    it('should set status to published', () => {
      const page = createPage();
      page.publish();

      expect(page.status).toBe('published');
      expect(page.isPublished).toBe(true);
    });
  });

  describe('unpublish', () => {
    it('should set status back to draft', () => {
      const page = createPage();
      page.publish();
      page.unpublish();

      expect(page.status).toBe('draft');
      expect(page.isPublished).toBe(false);
    });
  });

  describe('schedule', () => {
    it('should set status to scheduled with date', () => {
      const page = createPage();
      const date = new Date('2024-12-25');
      page.schedule(date);

      expect(page.status).toBe('scheduled');
    });
  });

  describe('archive', () => {
    it('should set status to archived', () => {
      const page = createPage();
      page.archive();

      expect(page.status).toBe('archived');
    });
  });

  describe('addBlock', () => {
    it('should add a block and reorder positions', () => {
      const page = createPage();
      page.addBlock({ blockId: 'b-1', type: 'text', content: {}, position: 0 });
      page.addBlock({ blockId: 'b-2', type: 'image', content: {}, position: 0 });

      expect(page.blocks).toHaveLength(2);
      expect(page.blocks[0].position).toBe(0);
      expect(page.blocks[1].position).toBe(1);
    });
  });

  describe('removeBlock', () => {
    it('should remove a block and reorder', () => {
      const page = createPage();
      page.addBlock({ blockId: 'b-1', type: 'text', content: {}, position: 0 });
      page.addBlock({ blockId: 'b-2', type: 'image', content: {}, position: 1 });
      page.addBlock({ blockId: 'b-3', type: 'video', content: {}, position: 2 });

      page.removeBlock('b-2');

      expect(page.blocks).toHaveLength(2);
      expect(page.blocks[0].blockId).toBe('b-1');
      expect(page.blocks[0].position).toBe(0);
      expect(page.blocks[1].blockId).toBe('b-3');
      expect(page.blocks[1].position).toBe(1);
    });
  });

  describe('toJSON', () => {
    it('should return serialized object', () => {
      const page = createPage();
      const json = page.toJSON();

      expect(json.pageId).toBe('page-1');
      expect(json.title).toBe('About Us');
      expect(json.status).toBe('draft');
    });
  });
});
