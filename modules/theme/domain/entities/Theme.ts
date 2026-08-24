/**
 * Theme Entity
 *
 * Represents a storefront theme with layout, components, settings schema,
 * and asset references. Themes can be built-in (shipped with the platform)
 * or custom (created by a business).
 */

import { ThemeValidationError } from '../errors/ThemeErrors';

// ============================================================================
// Types
// ============================================================================

export type ThemeStatus = 'draft' | 'active' | 'archived';
export type ThemeType = 'built_in' | 'custom';

export interface ThemeSettingsSchema {
  /** Setting groups for the theme customizer UI */
  groups: ThemeSettingGroup[];
}

export interface ThemeSettingGroup {
  groupId: string;
  label: string;
  settings: ThemeSettingDefinition[];
}

export type SettingType = 'color' | 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'image' | 'font' | 'range';

export interface ThemeSettingDefinition {
  key: string;
  label: string;
  type: SettingType;
  defaultValue: string | number | boolean;
  description?: string;
  options?: Array<{ label: string; value: string }>;
  min?: number;
  max?: number;
  step?: number;
  /** CSS variable this setting maps to (e.g. --color-primary) */
  cssVariable?: string;
}

export interface ThemeLayoutConfig {
  /** Named layout regions (header, footer, sidebar, main, etc.) */
  regions: string[];
  /** Default region assignments for page types */
  pageLayouts: Array<{
    pageType: string;
    regions: Array<{ region: string; component: string; props?: Record<string, unknown> }>;
  }>;
}

export interface ThemeComponentConfig {
  /** Component name → file path mapping */
  components: Array<{
    name: string;
    path: string;
    /** Props this component accepts */
    props?: Array<{ name: string; type: string; required?: boolean; defaultValue?: string }>;
  }>;
}

export interface ThemeAssetConfig {
  /** CSS entry point relative to theme directory */
  cssEntry?: string;
  /** JS entry point relative to theme directory */
  jsEntry?: string;
  /** Additional static assets */
  assets?: Array<{ path: string; type: string }>;
}

export interface ThemeProps {
  themeId: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  type: ThemeType;
  status: ThemeStatus;
  author?: string;
  screenshotUrl?: string;
  previewUrl?: string;
  settingsSchema: ThemeSettingsSchema;
  defaultSettings: Record<string, string | number | boolean>;
  layout: ThemeLayoutConfig;
  components: ThemeComponentConfig;
  assets: ThemeAssetConfig;
  /** Tags for filtering (e.g. 'fashion', 'electronics', 'minimal') */
  tags: string[];
  isCustomizable: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Entity
// ============================================================================

export class Theme {
  private props: ThemeProps;

  private constructor(props: ThemeProps) {
    this.props = props;
  }

  static create(props: {
    themeId: string;
    slug: string;
    name: string;
    description?: string;
    version?: string;
    type?: ThemeType;
    author?: string;
    screenshotUrl?: string;
    previewUrl?: string;
    settingsSchema: ThemeSettingsSchema;
    defaultSettings: Record<string, string | number | boolean>;
    layout: ThemeLayoutConfig;
    components: ThemeComponentConfig;
    assets?: ThemeAssetConfig;
    tags?: string[];
    isCustomizable?: boolean;
    organizationId?: string;
  }): Theme {
    if (!props.slug.trim()) throw new ThemeValidationError('Theme slug cannot be empty');
    if (!/^[a-z0-9-]+$/.test(props.slug)) throw new ThemeValidationError('Theme slug must be lowercase alphanumeric with dashes only');
    if (!props.name.trim()) throw new ThemeValidationError('Theme name cannot be empty');

    const now = new Date();
    return new Theme({
      themeId: props.themeId,
      slug: props.slug,
      name: props.name,
      description: props.description,
      version: props.version || '1.0.0',
      type: props.type || 'custom',
      status: 'draft',
      author: props.author,
      screenshotUrl: props.screenshotUrl,
      previewUrl: props.previewUrl,
      settingsSchema: props.settingsSchema,
      defaultSettings: props.defaultSettings,
      layout: props.layout,
      components: props.components,
      assets: props.assets || {},
      tags: props.tags || [],
      isCustomizable: props.isCustomizable ?? true,
      organizationId: props.organizationId,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ThemeProps): Theme {
    return new Theme(props);
  }

  // Getters
  get themeId(): string { return this.props.themeId; }
  get slug(): string { return this.props.slug; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get version(): string { return this.props.version; }
  get type(): ThemeType { return this.props.type; }
  get status(): ThemeStatus { return this.props.status; }
  get author(): string | undefined { return this.props.author; }
  get screenshotUrl(): string | undefined { return this.props.screenshotUrl; }
  get previewUrl(): string | undefined { return this.props.previewUrl; }
  get settingsSchema(): ThemeSettingsSchema { return this.props.settingsSchema; }
  get defaultSettings(): Record<string, string | number | boolean> { return this.props.defaultSettings; }
  get layout(): ThemeLayoutConfig { return this.props.layout; }
  get components(): ThemeComponentConfig { return this.props.components; }
  get assets(): ThemeAssetConfig { return this.props.assets; }
  get tags(): string[] { return this.props.tags; }
  get isCustomizable(): boolean { return this.props.isCustomizable; }
  get organizationId(): string | undefined { return this.props.organizationId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Lifecycle

  activate(): void {
    this.props.status = 'active';
    this.touch();
  }

  archive(): void {
    this.props.status = 'archived';
    this.touch();
  }

  draft(): void {
    this.props.status = 'draft';
    this.touch();
  }

  isActive(): boolean {
    return this.props.status === 'active';
  }

  isBuiltIn(): boolean {
    return this.props.type === 'built_in';
  }

  // Updates

  updateName(name: string): void {
    if (!name.trim()) throw new ThemeValidationError('Theme name cannot be empty');
    this.props.name = name;
    this.touch();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.touch();
  }

  updateSettingsSchema(schema: ThemeSettingsSchema): void {
    this.props.settingsSchema = schema;
    this.touch();
  }

  updateDefaultSettings(settings: Record<string, string | number | boolean>): void {
    this.props.defaultSettings = { ...this.props.defaultSettings, ...settings };
    this.touch();
  }

  updateLayout(layout: ThemeLayoutConfig): void {
    this.props.layout = layout;
    this.touch();
  }

  updateComponents(components: ThemeComponentConfig): void {
    this.props.components = components;
    this.touch();
  }

  updateAssets(assets: ThemeAssetConfig): void {
    this.props.assets = assets;
    this.touch();
  }

  addTag(tag: string): void {
    const normalized = tag.toLowerCase().trim();
    if (!normalized) return;
    if (!this.props.tags.includes(normalized)) {
      this.props.tags.push(normalized);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    this.props.tags = this.props.tags.filter(t => t !== tag.toLowerCase().trim());
    this.touch();
  }

  hasTag(tag: string): boolean {
    return this.props.tags.includes(tag.toLowerCase().trim());
  }

  /**
   * Get a setting value, falling back to the default if not in the provided overrides.
   */
  getSettingValue(key: string, overrides?: Record<string, string | number | boolean>): string | number | boolean {
    if (overrides && key in overrides) return overrides[key];
    if (key in this.props.defaultSettings) return this.props.defaultSettings[key];
    // Find in schema
    for (const group of this.props.settingsSchema.groups) {
      for (const def of group.settings) {
        if (def.key === key) return def.defaultValue;
      }
    }
    return '';
  }

  /**
   * Resolve all settings with overrides applied, producing a complete settings map.
   */
  resolveSettings(overrides?: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const resolved: Record<string, string | number | boolean> = {};

    // Start with schema defaults
    for (const group of this.props.settingsSchema.groups) {
      for (const def of group.settings) {
        resolved[def.key] = def.defaultValue;
      }
    }

    // Apply theme defaults
    for (const [key, value] of Object.entries(this.props.defaultSettings)) {
      resolved[key] = value;
    }

    // Apply overrides
    if (overrides) {
      for (const [key, value] of Object.entries(overrides)) {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Generate CSS custom properties from resolved settings.
   */
  toCSSVariables(overrides?: Record<string, string | number | boolean>): Record<string, string> {
    const resolved = this.resolveSettings(overrides);
    const cssVars: Record<string, string> = {};

    for (const group of this.props.settingsSchema.groups) {
      for (const def of group.settings) {
        if (def.cssVariable) {
          const value = resolved[def.key];
          if (value !== undefined && value !== '') {
            cssVars[def.cssVariable] = String(value);
          }
        }
      }
    }

    return cssVars;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      themeId: this.props.themeId,
      slug: this.props.slug,
      name: this.props.name,
      description: this.props.description,
      version: this.props.version,
      type: this.props.type,
      status: this.props.status,
      author: this.props.author,
      screenshotUrl: this.props.screenshotUrl,
      previewUrl: this.props.previewUrl,
      settingsSchema: this.props.settingsSchema,
      defaultSettings: this.props.defaultSettings,
      layout: this.props.layout,
      components: this.props.components,
      assets: this.props.assets,
      tags: this.props.tags,
      isCustomizable: this.props.isCustomizable,
      organizationId: this.props.organizationId,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
