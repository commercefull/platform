/**
 * Block type definitions — shared between BlockSchemaRegistry and the built-in block lists.
 */

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
