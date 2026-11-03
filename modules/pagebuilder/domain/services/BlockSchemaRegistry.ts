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
import type { BlockField, BlockTypeDefinition } from './blockTypes';
export type { BlockField, BlockFieldOption, BlockFieldType, BlockTypeDefinition } from './blockTypes';

const isEmptyValue = (v: unknown): boolean => v === undefined || v === null || v === '';

function validateNumberField(field: BlockField, value: unknown, errors: string[]): void {
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

function validateFieldContent(field: BlockField, value: unknown, errors: string[]): void {
  if (field.required && isEmptyValue(value)) {
    errors.push(`Field '${field.label}' is required`);
  }
  if (field.type === 'number' && !isEmptyValue(value)) {
    validateNumberField(field, value, errors);
  }
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
      validateFieldContent(field, content[field.key], errors);
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

import { BUILT_IN_BLOCK_TYPES } from './builtInBlockTypes';

// Register built-in block types after definitions are available
blockSchemaRegistry.registerBuiltIns();
