/**
 * Theme Override Entity
 *
 * Per-store theme setting overrides. When a store uses a theme, it can
 * customize any of the theme's settings (colors, fonts, layout options)
 * without modifying the theme itself.
 */

import { ThemeOverrideValidationError } from '../errors/ThemeErrors';

export interface ThemeOverrideProps {
  overrideId: string;
  storeId: string;
  themeId: string;
  organizationId: string;
  /** Setting key → value overrides */
  settings: Record<string, string | number | boolean>;
  /** Custom CSS injected after theme CSS */
  customCss?: string;
  /** Custom logo URL overriding theme default */
  customLogoUrl?: string;
  /** Custom favicon URL overriding theme default */
  customFaviconUrl?: string;
  /** Custom banner URL */
  customBannerUrl?: string;
  /** Additional head tags (meta, fonts, etc.) */
  customHeadTags?: string[];
  /** Additional body attributes */
  customBodyAttributes?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ThemeOverride {
  private props: ThemeOverrideProps;

  private constructor(props: ThemeOverrideProps) {
    this.props = props;
  }

  static create(props: {
    overrideId: string;
    storeId: string;
    themeId: string;
    organizationId: string;
    settings?: Record<string, string | number | boolean>;
    customCss?: string;
    customLogoUrl?: string;
    customFaviconUrl?: string;
    customBannerUrl?: string;
    customHeadTags?: string[];
    customBodyAttributes?: Record<string, string>;
  }): ThemeOverride {
    const now = new Date();
    return new ThemeOverride({
      overrideId: props.overrideId,
      storeId: props.storeId,
      themeId: props.themeId,
      organizationId: props.organizationId,
      settings: props.settings || {},
      customCss: props.customCss,
      customLogoUrl: props.customLogoUrl,
      customFaviconUrl: props.customFaviconUrl,
      customBannerUrl: props.customBannerUrl,
      customHeadTags: props.customHeadTags,
      customBodyAttributes: props.customBodyAttributes,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ThemeOverrideProps): ThemeOverride {
    return new ThemeOverride(props);
  }

  // Getters
  get overrideId(): string { return this.props.overrideId; }
  get storeId(): string { return this.props.storeId; }
  get themeId(): string { return this.props.themeId; }
  get organizationId(): string { return this.props.organizationId; }
  get settings(): Record<string, string | number | boolean> { return this.props.settings; }
  get customCss(): string | undefined { return this.props.customCss; }
  get customLogoUrl(): string | undefined { return this.props.customLogoUrl; }
  get customFaviconUrl(): string | undefined { return this.props.customFaviconUrl; }
  get customBannerUrl(): string | undefined { return this.props.customBannerUrl; }
  get customHeadTags(): string[] | undefined { return this.props.customHeadTags; }
  get customBodyAttributes(): Record<string, string> | undefined { return this.props.customBodyAttributes; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Lifecycle

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  // Updates

  updateSetting(key: string, value: string | number | boolean): void {
    if (!key.trim()) throw new ThemeOverrideValidationError('Setting key cannot be empty');
    this.props.settings[key] = value;
    this.touch();
  }

  updateSettings(settings: Record<string, string | number | boolean>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.touch();
  }

  removeSetting(key: string): void {
    delete this.props.settings[key];
    this.touch();
  }

  clearSettings(): void {
    this.props.settings = {};
    this.touch();
  }

  updateCustomCss(css: string): void {
    this.props.customCss = css;
    this.touch();
  }

  updateCustomLogoUrl(url: string): void {
    this.props.customLogoUrl = url;
    this.touch();
  }

  updateCustomFaviconUrl(url: string): void {
    this.props.customFaviconUrl = url;
    this.touch();
  }

  updateCustomBannerUrl(url: string): void {
    this.props.customBannerUrl = url;
    this.touch();
  }

  addHeadTag(tag: string): void {
    if (!this.props.customHeadTags) this.props.customHeadTags = [];
    if (!this.props.customHeadTags.includes(tag)) {
      this.props.customHeadTags.push(tag);
      this.touch();
    }
  }

  removeHeadTag(tag: string): void {
    if (this.props.customHeadTags) {
      this.props.customHeadTags = this.props.customHeadTags.filter(t => t !== tag);
      this.touch();
    }
  }

  updateBodyAttributes(attrs: Record<string, string>): void {
    this.props.customBodyAttributes = { ...this.props.customBodyAttributes, ...attrs };
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      overrideId: this.props.overrideId,
      storeId: this.props.storeId,
      themeId: this.props.themeId,
      organizationId: this.props.organizationId,
      settings: this.props.settings,
      customCss: this.props.customCss,
      customLogoUrl: this.props.customLogoUrl,
      customFaviconUrl: this.props.customFaviconUrl,
      customBannerUrl: this.props.customBannerUrl,
      customHeadTags: this.props.customHeadTags,
      customBodyAttributes: this.props.customBodyAttributes,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
