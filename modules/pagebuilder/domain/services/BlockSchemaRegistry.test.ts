/**
 * Block Schema Registry Tests
 */

import { blockSchemaRegistry, BlockTypeDefinition } from './BlockSchemaRegistry';

describe('BlockSchemaRegistry', () => {
  beforeEach(() => {
    blockSchemaRegistry.registerBuiltIns();
  });

  describe('registerBuiltIns', () => {
    it('should register all built-in block types', () => {
      expect(blockSchemaRegistry.has('heading')).toBe(true);
      expect(blockSchemaRegistry.has('text')).toBe(true);
      expect(blockSchemaRegistry.has('rich-text')).toBe(true);
      expect(blockSchemaRegistry.has('image')).toBe(true);
      expect(blockSchemaRegistry.has('hero-banner')).toBe(true);
      expect(blockSchemaRegistry.has('spacer')).toBe(true);
      expect(blockSchemaRegistry.has('video')).toBe(true);
      expect(blockSchemaRegistry.has('html')).toBe(true);
      expect(blockSchemaRegistry.has('product-grid')).toBe(true);
      expect(blockSchemaRegistry.has('product-carousel')).toBe(true);
      expect(blockSchemaRegistry.has('category-grid')).toBe(true);
      expect(blockSchemaRegistry.has('call-to-action')).toBe(true);
      expect(blockSchemaRegistry.has('divider')).toBe(true);
      expect(blockSchemaRegistry.has('container')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return block type definition', () => {
      const def = blockSchemaRegistry.get('heading');
      expect(def).toBeDefined();
      expect(def?.name).toBe('Heading');
      expect(def?.category).toBe('content');
      expect(def?.isBuiltIn).toBe(true);
    });

    it('should return undefined for unknown type', () => {
      expect(blockSchemaRegistry.get('nonexistent')).toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list all block types', () => {
      const types = blockSchemaRegistry.list();
      expect(types.length).toBeGreaterThanOrEqual(14);
    });
  });

  describe('listByCategory', () => {
    it('should filter by category', () => {
      const contentTypes = blockSchemaRegistry.listByCategory('content');
      expect(contentTypes.length).toBeGreaterThan(0);
      expect(contentTypes.every(t => t.category === 'content')).toBe(true);
    });

    it('should return commerce blocks', () => {
      const commerceTypes = blockSchemaRegistry.listByCategory('commerce');
      expect(commerceTypes.length).toBe(3);
      expect(commerceTypes.map(t => t.typeId).sort()).toEqual(['category-grid', 'product-carousel', 'product-grid']);
    });
  });

  describe('validateContent', () => {
    it('should validate required fields', () => {
      const result = blockSchemaRegistry.validateContent('heading', { text: '', level: 'h2' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass validation with valid content', () => {
      const result = blockSchemaRegistry.validateContent('heading', { text: 'Hello', level: 'h2' });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for unknown block type', () => {
      const result = blockSchemaRegistry.validateContent('unknown', {});
      expect(result.valid).toBe(false);
    });

    it('should validate number fields', () => {
      const result = blockSchemaRegistry.validateContent('spacer', { height: 'not-a-number' });
      expect(result.valid).toBe(false);
    });
  });

  describe('getDefaultContent', () => {
    it('should return default content for heading', () => {
      const content = blockSchemaRegistry.getDefaultContent('heading');
      expect(content.level).toBe('h2');
      expect(content.alignment).toBe('left');
    });

    it('should return empty object for unknown type', () => {
      const content = blockSchemaRegistry.getDefaultContent('unknown');
      expect(content).toEqual({});
    });
  });

  describe('getDefaultSettings', () => {
    it('should return default settings', () => {
      const settings = blockSchemaRegistry.getDefaultSettings('heading');
      expect(settings.marginBottom).toBe(16);
    });
  });

  describe('container block', () => {
    it('should have isContainer flag', () => {
      const def = blockSchemaRegistry.get('container');
      expect(def?.isContainer).toBe(true);
      expect(def?.allowedChildTypes).toBeDefined();
      expect(def?.allowedChildTypes).toContain('heading');
    });
  });

  describe('register', () => {
    it('should throw on duplicate registration', () => {
      expect(() => {
        blockSchemaRegistry.register({
          typeId: 'heading',
          name: 'Duplicate',
          description: '',
          icon: '',
          category: 'content',
          fields: [],
          defaultContent: {},
        });
      }).toThrow();
    });

    it('should register a custom block type', () => {
      const customDef: BlockTypeDefinition = {
        typeId: 'custom-banner',
        name: 'Custom Banner',
        description: 'A custom banner block',
        icon: 'ti ti-star',
        category: 'advanced',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
        ],
        defaultContent: { title: '' },
      };

      blockSchemaRegistry.register(customDef);
      expect(blockSchemaRegistry.has('custom-banner')).toBe(true);
      expect(blockSchemaRegistry.get('custom-banner')?.name).toBe('Custom Banner');
    });
  });
});
