/**
 * Block Schema Registry
 *
 * Defines the canonical block types available in the page builder.
 * Each block type declares its field schema (what content editors see),
 * default values, and which layout regions it can be placed in.
 *
 * Built-in block types are registered at boot. Custom block types can be
 * registered by modules at boot time.
 */

import { BlockTypeAlreadyRegisteredError } from '../errors/PageBuilderErrors';

// ── Field Types ────────────────────────────────────────────────

export type BlockFieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'color'
  | 'image'
  | 'select'
  | 'checkbox'
  | 'url'
  | 'date'
  | 'product-ref'
  | 'category-ref'
  | 'collection-ref'
  | 'json';

export interface BlockFieldOption {
  label: string;
  value: string;
}

export interface BlockField {
  key: string;
  label: string;
  type: BlockFieldType;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  placeholder?: string;
  helpText?: string;
  options?: BlockFieldOption[];
  min?: number;
  max?: number;
  step?: number;
  /** For image fields: accepted mime types */
  accept?: string;
  /** For select fields: allow multiple selections */
  multiple?: boolean;
  /** Field group for organizing in the editor sidebar */
  group?: string;
}

// ── Block Type Definition ──────────────────────────────────────

export interface BlockTypeDefinition {
  /** Unique identifier (e.g. 'heading', 'product-grid', 'hero-banner') */
  typeId: string;
  /** Display name shown in the editor block palette */
  name: string;
  /** Short description */
  description: string;
  /** Icon name (Tabler icons) for the block palette */
  icon: string;
  /** Category for grouping in the palette */
  category: 'layout' | 'content' | 'media' | 'commerce' | 'advanced';
  /** Which layout regions this block can be placed in */
  allowedRegions?: string[];
  /** Field definitions — what the editor sees when configuring this block */
  fields: BlockField[];
  /** Default field values when block is first added */
  defaultContent: Record<string, string | number | boolean | null | string[]>;
  /** Default styling settings */
  defaultSettings?: Record<string, string | number | boolean>;
  /** Styling field definitions (padding, margin, background, etc.) */
  styleFields?: BlockField[];
  /** Whether this block can contain child blocks (container) */
  isContainer?: boolean;
  /** Allowed child block type IDs (if isContainer) */
  allowedChildTypes?: string[];
  /** Max instances of this block per page (0 = unlimited) */
  maxPerPage?: number;
  /** Whether this block type is built-in (cannot be deleted) */
  isBuiltIn?: boolean;
}

// ── Registry ───────────────────────────────────────────────────

class BlockSchemaRegistry {
  private types = new Map<string, BlockTypeDefinition>();
  private initialized = false;

  /**
   * Register a block type definition.
   */
  register(def: BlockTypeDefinition): void {
    if (this.types.has(def.typeId)) {
      throw new BlockTypeAlreadyRegisteredError(def.typeId);
    }
    this.types.set(def.typeId, def);
  }

  /**
   * Get a block type definition by ID.
   */
  get(typeId: string): BlockTypeDefinition | undefined {
    return this.types.get(typeId);
  }

  /**
   * List all registered block types.
   */
  list(): BlockTypeDefinition[] {
    return Array.from(this.types.values());
  }

  /**
   * List block types by category.
   */
  listByCategory(category: BlockTypeDefinition['category']): BlockTypeDefinition[] {
    return this.list().filter(t => t.category === category);
  }

  /**
   * List block types allowed in a specific region.
   */
  listByRegion(region: string): BlockTypeDefinition[] {
    return this.list().filter(t => !t.allowedRegions || t.allowedRegions.includes(region));
  }

  /**
   * Check if a block type exists.
   */
  has(typeId: string): boolean {
    return this.types.has(typeId);
  }

  /**
   * Validate content against a block type's field schema.
   */
  validateContent(typeId: string, content: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const def = this.types.get(typeId);
    if (!def) return { valid: false, errors: [`Unknown block type: ${typeId}`] };

    const errors: string[] = [];

    for (const field of def.fields) {
      if (field.required) {
        const value = content[field.key];
        if (value === undefined || value === null || value === '') {
          errors.push(`Field '${field.label}' is required`);
        }
      }

      if (field.type === 'number') {
        const value = content[field.key];
        if (value !== undefined && value !== null && value !== '') {
          const num = Number(value);
          if (isNaN(num)) {
            errors.push(`Field '${field.label}' must be a number`);
          }
          if (field.min !== undefined && num < field.min) {
            errors.push(`Field '${field.label}' must be at least ${field.min}`);
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(`Field '${field.label}' must be at most ${field.max}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get default content for a block type.
   */
  getDefaultContent(typeId: string): Record<string, string | number | boolean | null | string[]> {
    const def = this.types.get(typeId);
    if (!def) return {};
    return { ...def.defaultContent };
  }

  /**
   * Get default settings for a block type.
   */
  getDefaultSettings(typeId: string): Record<string, string | number | boolean> {
    const def = this.types.get(typeId);
    if (!def || !def.defaultSettings) return {};
    return { ...def.defaultSettings };
  }

  /**
   * Register all built-in block types. Called at boot.
   */
  registerBuiltIns(): void {
    if (this.initialized) return;

    this.register(BUILT_IN_BLOCK_TYPES.heading);
    this.register(BUILT_IN_BLOCK_TYPES.text);
    this.register(BUILT_IN_BLOCK_TYPES.richText);
    this.register(BUILT_IN_BLOCK_TYPES.image);
    this.register(BUILT_IN_BLOCK_TYPES.heroBanner);
    this.register(BUILT_IN_BLOCK_TYPES.spacer);
    this.register(BUILT_IN_BLOCK_TYPES.video);
    this.register(BUILT_IN_BLOCK_TYPES.html);
    this.register(BUILT_IN_BLOCK_TYPES.productGrid);
    this.register(BUILT_IN_BLOCK_TYPES.productCarousel);
    this.register(BUILT_IN_BLOCK_TYPES.categoryGrid);
    this.register(BUILT_IN_BLOCK_TYPES.callToAction);
    this.register(BUILT_IN_BLOCK_TYPES.divider);
    this.register(BUILT_IN_BLOCK_TYPES.container);

    this.initialized = true;
  }
}

export const blockSchemaRegistry = new BlockSchemaRegistry();

// ── Built-in Block Type Definitions ────────────────────────────

const BUILT_IN_BLOCK_TYPES = {
  heading: {
    typeId: 'heading',
    name: 'Heading',
    description: 'Section heading with configurable level and alignment',
    icon: 'ti ti-h-1',
    category: 'content' as const,
    fields: [
      { key: 'text', label: 'Heading Text', type: 'text' as const, required: true, placeholder: 'Enter heading text...', group: 'Content' },
      { key: 'level', label: 'Heading Level', type: 'select' as const, defaultValue: 'h2', options: [
        { label: 'H1', value: 'h1' },
        { label: 'H2', value: 'h2' },
        { label: 'H3', value: 'h3' },
        { label: 'H4', value: 'h4' },
        { label: 'H5', value: 'h5' },
        { label: 'H6', value: 'h6' },
      ], group: 'Content' },
      { key: 'alignment', label: 'Alignment', type: 'select' as const, defaultValue: 'left', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ], group: 'Content' },
    ],
    defaultContent: { text: '', level: 'h2', alignment: 'left' },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  text: {
    typeId: 'text',
    name: 'Text Block',
    description: 'Simple paragraph text with alignment',
    icon: 'ti ti-text-recognition',
    category: 'content' as const,
    fields: [
      { key: 'text', label: 'Text Content', type: 'textarea' as const, required: true, placeholder: 'Enter text...', group: 'Content' },
      { key: 'alignment', label: 'Alignment', type: 'select' as const, defaultValue: 'left', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
        { label: 'Justify', value: 'justify' },
      ], group: 'Content' },
    ],
    defaultContent: { text: '', alignment: 'left' },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  richText: {
    typeId: 'rich-text',
    name: 'Rich Text',
    description: 'Formatted text with bold, italic, links, and lists',
    icon: 'ti ti-rich-text',
    category: 'content' as const,
    fields: [
      { key: 'html', label: 'Rich Text Content', type: 'richtext' as const, required: true, placeholder: 'Enter formatted text...', group: 'Content' },
    ],
    defaultContent: { html: '' },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  image: {
    typeId: 'image',
    name: 'Image',
    description: 'Single image with alt text, caption, and link',
    icon: 'ti ti-photo',
    category: 'media' as const,
    fields: [
      { key: 'src', label: 'Image URL', type: 'image' as const, required: true, placeholder: 'Upload or enter URL...', accept: 'image/*', group: 'Content' },
      { key: 'alt', label: 'Alt Text', type: 'text' as const, placeholder: 'Describe the image...', group: 'Content' },
      { key: 'caption', label: 'Caption', type: 'text' as const, placeholder: 'Optional caption...', group: 'Content' },
      { key: 'link', label: 'Link URL', type: 'url' as const, placeholder: 'https://...', group: 'Content' },
      { key: 'width', label: 'Width', type: 'select' as const, defaultValue: 'full', options: [
        { label: 'Full Width', value: 'full' },
        { label: 'Large', value: 'large' },
        { label: 'Medium', value: 'medium' },
        { label: 'Small', value: 'small' },
        { label: 'Original', value: 'original' },
      ], group: 'Content' },
      { key: 'rounded', label: 'Rounded Corners', type: 'checkbox' as const, defaultValue: false, group: 'Content' },
    ],
    defaultContent: { src: '', alt: '', caption: '', link: '', width: 'full', rounded: false },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  heroBanner: {
    typeId: 'hero-banner',
    name: 'Hero Banner',
    description: 'Large banner with background image, headline, subtext, and CTA button',
    icon: 'ti ti-banner',
    category: 'layout' as const,
    fields: [
      { key: 'backgroundImage', label: 'Background Image', type: 'image' as const, placeholder: 'Upload or enter URL...', group: 'Content' },
      { key: 'headline', label: 'Headline', type: 'text' as const, required: true, placeholder: 'Enter headline...', group: 'Content' },
      { key: 'subtext', label: 'Subtext', type: 'textarea' as const, placeholder: 'Enter subtext...', group: 'Content' },
      { key: 'ctaText', label: 'Button Text', type: 'text' as const, placeholder: 'Shop Now', group: 'Content' },
      { key: 'ctaLink', label: 'Button Link', type: 'url' as const, placeholder: 'https://...', group: 'Content' },
      { key: 'textColor', label: 'Text Color', type: 'color' as const, defaultValue: '#ffffff', group: 'Style' },
      { key: 'overlayColor', label: 'Overlay Color', type: 'color' as const, defaultValue: '#000000', group: 'Style' },
      { key: 'overlayOpacity', label: 'Overlay Opacity', type: 'number' as const, defaultValue: 40, min: 0, max: 100, step: 5, group: 'Style' },
      { key: 'height', label: 'Height (px)', type: 'number' as const, defaultValue: 400, min: 200, max: 800, step: 50, group: 'Style' },
      { key: 'alignment', label: 'Content Alignment', type: 'select' as const, defaultValue: 'center', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ], group: 'Style' },
    ],
    defaultContent: {
      backgroundImage: '', headline: '', subtext: '', ctaText: '', ctaLink: '',
      textColor: '#ffffff', overlayColor: '#000000', overlayOpacity: 40, height: 400, alignment: 'center',
    },
    defaultSettings: { marginTop: 0, marginBottom: 24 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 24, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  spacer: {
    typeId: 'spacer',
    name: 'Spacer',
    description: 'Empty vertical space between blocks',
    icon: 'ti ti-arrows-vertical',
    category: 'layout' as const,
    fields: [
      { key: 'height', label: 'Height (px)', type: 'number' as const, defaultValue: 32, min: 4, max: 500, step: 4, group: 'Spacing' },
    ],
    defaultContent: { height: 32 },
    defaultSettings: {},
    isBuiltIn: true,
  },

  video: {
    typeId: 'video',
    name: 'Video',
    description: 'Embedded video from YouTube, Vimeo, or direct URL',
    icon: 'ti ti-video',
    category: 'media' as const,
    fields: [
      { key: 'url', label: 'Video URL', type: 'url' as const, required: true, placeholder: 'https://youtube.com/watch?v=...', group: 'Content' },
      { key: 'poster', label: 'Poster Image', type: 'image' as const, placeholder: 'Optional poster image...', group: 'Content' },
      { key: 'autoplay', label: 'Autoplay', type: 'checkbox' as const, defaultValue: false, group: 'Content' },
      { key: 'loop', label: 'Loop', type: 'checkbox' as const, defaultValue: false, group: 'Content' },
      { key: 'controls', label: 'Show Controls', type: 'checkbox' as const, defaultValue: true, group: 'Content' },
    ],
    defaultContent: { url: '', poster: '', autoplay: false, loop: false, controls: true },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  html: {
    typeId: 'html',
    name: 'Custom HTML',
    description: 'Raw HTML code block for advanced customization',
    icon: 'ti ti-code',
    category: 'advanced' as const,
    fields: [
      { key: 'html', label: 'HTML Code', type: 'textarea' as const, required: true, placeholder: '<div>Custom HTML...</div>', group: 'Content' },
    ],
    defaultContent: { html: '' },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  productGrid: {
    typeId: 'product-grid',
    name: 'Product Grid',
    description: 'Grid of products from a collection, category, or manual selection',
    icon: 'ti ti-grid-dots',
    category: 'commerce' as const,
    fields: [
      { key: 'source', label: 'Product Source', type: 'select' as const, defaultValue: 'collection', options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Category', value: 'category' },
        { label: 'Manual Selection', value: 'manual' },
        { label: 'Best Sellers', value: 'best-sellers' },
        { label: 'New Arrivals', value: 'new-arrivals' },
        { label: 'On Sale', value: 'on-sale' },
      ], group: 'Content' },
      { key: 'collectionId', label: 'Collection', type: 'collection-ref' as const, helpText: 'Select a product collection', group: 'Content' },
      { key: 'categoryId', label: 'Category', type: 'category-ref' as const, helpText: 'Select a category', group: 'Content' },
      { key: 'productIds', label: 'Products', type: 'product-ref' as const, multiple: true, helpText: 'Select specific products', group: 'Content' },
      { key: 'columns', label: 'Columns', type: 'select' as const, defaultValue: '4', options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
        { label: '5 Columns', value: '5' },
        { label: '6 Columns', value: '6' },
      ], group: 'Layout' },
      { key: 'limit', label: 'Max Products', type: 'number' as const, defaultValue: 8, min: 1, max: 50, group: 'Layout' },
      { key: 'showTitle', label: 'Show Section Title', type: 'checkbox' as const, defaultValue: true, group: 'Layout' },
      { key: 'title', label: 'Section Title', type: 'text' as const, placeholder: 'Featured Products', group: 'Layout' },
    ],
    defaultContent: {
      source: 'collection', collectionId: '', categoryId: '', productIds: [],
      columns: '4', limit: 8, showTitle: true, title: '',
    },
    defaultSettings: { marginTop: 0, marginBottom: 24 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 24, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  productCarousel: {
    typeId: 'product-carousel',
    name: 'Product Carousel',
    description: 'Scrollable carousel of products',
    icon: 'ti ti-carousel-horizontal',
    category: 'commerce' as const,
    fields: [
      { key: 'source', label: 'Product Source', type: 'select' as const, defaultValue: 'best-sellers', options: [
        { label: 'Collection', value: 'collection' },
        { label: 'Category', value: 'category' },
        { label: 'Best Sellers', value: 'best-sellers' },
        { label: 'New Arrivals', value: 'new-arrivals' },
        { label: 'On Sale', value: 'on-sale' },
      ], group: 'Content' },
      { key: 'collectionId', label: 'Collection', type: 'collection-ref' as const, group: 'Content' },
      { key: 'categoryId', label: 'Category', type: 'category-ref' as const, group: 'Content' },
      { key: 'limit', label: 'Max Products', type: 'number' as const, defaultValue: 10, min: 1, max: 30, group: 'Layout' },
      { key: 'showArrows', label: 'Show Navigation Arrows', type: 'checkbox' as const, defaultValue: true, group: 'Layout' },
      { key: 'autoplay', label: 'Autoplay', type: 'checkbox' as const, defaultValue: false, group: 'Layout' },
      { key: 'title', label: 'Section Title', type: 'text' as const, placeholder: 'Trending Now', group: 'Layout' },
    ],
    defaultContent: {
      source: 'best-sellers', collectionId: '', categoryId: '',
      limit: 10, showArrows: true, autoplay: false, title: '',
    },
    defaultSettings: { marginTop: 0, marginBottom: 24 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 24, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  categoryGrid: {
    typeId: 'category-grid',
    name: 'Category Grid',
    description: 'Grid of category cards with images',
    icon: 'ti ti-categories',
    category: 'commerce' as const,
    fields: [
      { key: 'categoryIds', label: 'Categories', type: 'category-ref' as const, multiple: true, required: true, group: 'Content' },
      { key: 'columns', label: 'Columns', type: 'select' as const, defaultValue: '4', options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
        { label: '5 Columns', value: '5' },
      ], group: 'Layout' },
      { key: 'showImage', label: 'Show Category Image', type: 'checkbox' as const, defaultValue: true, group: 'Layout' },
      { key: 'showProductCount', label: 'Show Product Count', type: 'checkbox' as const, defaultValue: false, group: 'Layout' },
      { key: 'title', label: 'Section Title', type: 'text' as const, placeholder: 'Shop by Category', group: 'Layout' },
    ],
    defaultContent: {
      categoryIds: [], columns: '4', showImage: true, showProductCount: false, title: '',
    },
    defaultSettings: { marginTop: 0, marginBottom: 24 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 24, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  callToAction: {
    typeId: 'call-to-action',
    name: 'Call to Action',
    description: 'Button or banner with a call-to-action link',
    icon: 'ti ti-button',
    category: 'content' as const,
    fields: [
      { key: 'text', label: 'CTA Text', type: 'text' as const, required: true, placeholder: 'Shop the Collection', group: 'Content' },
      { key: 'link', label: 'Link URL', type: 'url' as const, required: true, placeholder: 'https://...', group: 'Content' },
      { key: 'style', label: 'Button Style', type: 'select' as const, defaultValue: 'primary', options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'Outline', value: 'outline' },
        { label: 'Ghost', value: 'ghost' },
      ], group: 'Style' },
      { key: 'size', label: 'Button Size', type: 'select' as const, defaultValue: 'medium', options: [
        { label: 'Small', value: 'small' },
        { label: 'Medium', value: 'medium' },
        { label: 'Large', value: 'large' },
      ], group: 'Style' },
      { key: 'alignment', label: 'Alignment', type: 'select' as const, defaultValue: 'center', options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ], group: 'Style' },
      { key: 'fullWidth', label: 'Full Width', type: 'checkbox' as const, defaultValue: false, group: 'Style' },
    ],
    defaultContent: { text: '', link: '', style: 'primary', size: 'medium', alignment: 'center', fullWidth: false },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  divider: {
    typeId: 'divider',
    name: 'Divider',
    description: 'Horizontal line separator',
    icon: 'ti ti-line',
    category: 'layout' as const,
    fields: [
      { key: 'style', label: 'Line Style', type: 'select' as const, defaultValue: 'solid', options: [
        { label: 'Solid', value: 'solid' },
        { label: 'Dashed', value: 'dashed' },
        { label: 'Dotted', value: 'dotted' },
      ], group: 'Style' },
      { key: 'width', label: 'Width', type: 'select' as const, defaultValue: '100', options: [
        { label: '25%', value: '25' },
        { label: '50%', value: '50' },
        { label: '75%', value: '75' },
        { label: '100%', value: '100' },
      ], group: 'Style' },
      { key: 'color', label: 'Color', type: 'color' as const, defaultValue: '#e0e0e0', group: 'Style' },
      { key: 'thickness', label: 'Thickness (px)', type: 'number' as const, defaultValue: 1, min: 1, max: 10, group: 'Style' },
    ],
    defaultContent: { style: 'solid', width: '100', color: '#e0e0e0', thickness: 1 },
    defaultSettings: { marginTop: 16, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },

  container: {
    typeId: 'container',
    name: 'Container',
    description: 'Wrapper block that can contain other blocks',
    icon: 'ti ti-container',
    category: 'layout' as const,
    isContainer: true,
    allowedChildTypes: ['heading', 'text', 'rich-text', 'image', 'video', 'html', 'call-to-action', 'divider', 'spacer'],
    fields: [
      { key: 'layout', label: 'Layout', type: 'select' as const, defaultValue: 'single', options: [
        { label: 'Single Column', value: 'single' },
        { label: 'Two Columns (50/50)', value: 'two-col-50' },
        { label: 'Two Columns (60/40)', value: 'two-col-60' },
        { label: 'Two Columns (40/60)', value: 'two-col-40' },
        { label: 'Three Columns', value: 'three-col' },
        { label: 'Sidebar + Main', value: 'sidebar-main' },
        { label: 'Main + Sidebar', value: 'main-sidebar' },
      ], group: 'Layout' },
      { key: 'background', label: 'Background Color', type: 'color' as const, defaultValue: '', group: 'Style' },
      { key: 'padding', label: 'Padding (px)', type: 'number' as const, defaultValue: 24, min: 0, max: 100, group: 'Style' },
      { key: 'maxWidth', label: 'Max Width', type: 'select' as const, defaultValue: 'container', options: [
        { label: 'Container', value: 'container' },
        { label: 'Full Width', value: 'full' },
        { label: 'Narrow', value: 'narrow' },
      ], group: 'Style' },
    ],
    defaultContent: { layout: 'single', background: '', padding: 24, maxWidth: 'container' },
    defaultSettings: { marginTop: 0, marginBottom: 16 },
    styleFields: [
      { key: 'marginTop', label: 'Margin Top (px)', type: 'number' as const, defaultValue: 0, min: 0, max: 200, group: 'Spacing' },
      { key: 'marginBottom', label: 'Margin Bottom (px)', type: 'number' as const, defaultValue: 16, min: 0, max: 200, group: 'Spacing' },
    ],
    isBuiltIn: true,
  },
} satisfies Record<string, BlockTypeDefinition>;
