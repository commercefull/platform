/**
 * Theme Use Cases
 *
 * - ManageThemes: CRUD for themes (custom themes only; built-in are read-only)
 * - ManageThemeOverrides: CRUD for per-store theme overrides
 * - AssignThemeToStore: Assign a theme to a store
 * - ResolveStoreTheme: Get the fully resolved theme config for a store
 */

import { generateUUID } from '../../../../libs/uuid';
import { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { Theme, ThemeSettingsSchema, ThemeLayoutConfig, ThemeComponentConfig, ThemeAssetConfig } from '../../domain/entities/Theme';
import { ThemeOverride } from '../../domain/entities/ThemeOverride';
import { themeRegistry, ResolvedTheme } from '../../domain/services/ThemeRegistry';
import { createBuiltInThemes } from '../../domain/builtInThemes';
import {
  ThemeNotFoundError,
  ThemeAlreadyExistsError,
  ThemeValidationError,
  BuiltInThemeCannotBeDeletedError,
  ThemeOverrideNotFoundError,
  ThemeAssignmentNotFoundError,
} from '../../domain/errors/ThemeErrors';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Manage Themes
// ============================================================================

export class CreateThemeCommand {
  constructor(
    public readonly themeData: {
      slug: string;
      name: string;
      description?: string;
      version?: string;
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
    },
  ) {}
}

export interface ThemeResponse {
  themeId: string;
  slug: string;
  name: string;
  description?: string;
  version: string;
  type: string;
  status: string;
  author?: string;
  screenshotUrl?: string;
  previewUrl?: string;
  tags: string[];
  isCustomizable: boolean;
  organizationId?: string;
  defaultSettings: Record<string, string | number | boolean>;
  settingsSchema: ThemeSettingsSchema;
  layout: ThemeLayoutConfig;
  components: ThemeComponentConfig;
  createdAt: string;
  updatedAt: string;
}

function toThemeResponse(theme: Theme): ThemeResponse {
  return {
    themeId: theme.themeId,
    slug: theme.slug,
    name: theme.name,
    description: theme.description,
    version: theme.version,
    type: theme.type,
    status: theme.status,
    author: theme.author,
    screenshotUrl: theme.screenshotUrl,
    previewUrl: theme.previewUrl,
    tags: theme.tags,
    isCustomizable: theme.isCustomizable,
    organizationId: theme.organizationId,
    defaultSettings: theme.defaultSettings,
    settingsSchema: theme.settingsSchema,
    layout: theme.layout,
    components: theme.components,
    createdAt: theme.createdAt.toISOString(),
    updatedAt: theme.updatedAt.toISOString(),
  };
}

export class ManageThemesUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async create(command: CreateThemeCommand): Promise<ThemeResponse> {
    const existing = await this.themeRepository.findBySlug(command.themeData.slug);
    if (existing) throw new ThemeAlreadyExistsError(command.themeData.slug);

    const theme = Theme.create({
      themeId: generateUUID(),
      ...command.themeData,
    });

    const saved = await this.themeRepository.save(theme);
    themeRegistry.registerTheme(saved);

    eventBus.emit('theme.created', { themeId: saved.themeId, slug: saved.slug });

    return toThemeResponse(saved);
  }

  async update(themeId: string, updates: {
    name?: string;
    description?: string;
    settingsSchema?: ThemeSettingsSchema;
    defaultSettings?: Record<string, string | number | boolean>;
    layout?: ThemeLayoutConfig;
    components?: ThemeComponentConfig;
    assets?: ThemeAssetConfig;
    tags?: string[];
  }): Promise<ThemeResponse> {
    const theme = await this.themeRepository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);

    if (updates.name !== undefined) theme.updateName(updates.name);
    if (updates.description !== undefined) theme.updateDescription(updates.description);
    if (updates.settingsSchema) theme.updateSettingsSchema(updates.settingsSchema);
    if (updates.defaultSettings) theme.updateDefaultSettings(updates.defaultSettings);
    if (updates.layout) theme.updateLayout(updates.layout);
    if (updates.components) theme.updateComponents(updates.components);
    if (updates.assets) theme.updateAssets(updates.assets);
    if (updates.tags) {
      // Replace tags
      for (const tag of theme.tags) theme.removeTag(tag);
      for (const tag of updates.tags) theme.addTag(tag);
    }

    const saved = await this.themeRepository.save(theme);
    themeRegistry.registerTheme(saved);

    eventBus.emit('theme.updated', { themeId: saved.themeId });

    return toThemeResponse(saved);
  }

  async delete(themeId: string): Promise<void> {
    const theme = await this.themeRepository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);
    if (theme.isBuiltIn()) throw new BuiltInThemeCannotBeDeletedError(theme.slug);

    await this.themeRepository.delete(themeId);
    themeRegistry.unregisterTheme(themeId);

    eventBus.emit('theme.deleted', { themeId });
  }

  async getById(themeId: string): Promise<ThemeResponse> {
    const theme = await this.themeRepository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);
    return toThemeResponse(theme);
  }

  async getBySlug(slug: string): Promise<ThemeResponse> {
    const theme = await this.themeRepository.findBySlug(slug);
    if (!theme) throw new ThemeNotFoundError(slug);
    return toThemeResponse(theme);
  }

  async list(filters?: {
    status?: string;
    type?: string;
    tags?: string[];
    organizationId?: string;
  }): Promise<ThemeResponse[]> {
    const themes = await this.themeRepository.findAll(filters);
    return themes.map(toThemeResponse);
  }

  async listBuiltIn(): Promise<ThemeResponse[]> {
    const themes = await this.themeRepository.findBuiltIn();
    return themes.map(toThemeResponse);
  }

  async activate(themeId: string): Promise<ThemeResponse> {
    const theme = await this.themeRepository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);

    theme.activate();
    const saved = await this.themeRepository.save(theme);
    themeRegistry.registerTheme(saved);

    eventBus.emit('theme.activated', { themeId: saved.themeId });

    return toThemeResponse(saved);
  }

  async archive(themeId: string): Promise<ThemeResponse> {
    const theme = await this.themeRepository.findById(themeId);
    if (!theme) throw new ThemeNotFoundError(themeId);

    theme.archive();
    const saved = await this.themeRepository.save(theme);
    themeRegistry.registerTheme(saved);

    eventBus.emit('theme.archived', { themeId: saved.themeId });

    return toThemeResponse(saved);
  }

  /**
   * Seed built-in themes into the database if they don't exist.
   */
  async seedBuiltInThemes(): Promise<number> {
    const builtInThemes = createBuiltInThemes();
    let count = 0;

    for (const theme of builtInThemes) {
      const existing = await this.themeRepository.findBySlug(theme.slug);
      if (!existing) {
        theme.activate();
        await this.themeRepository.save(theme);
        themeRegistry.registerTheme(theme);
        count++;
      } else {
        themeRegistry.registerTheme(existing);
      }
    }

    return count;
  }
}

// ============================================================================
// Manage Theme Overrides
// ============================================================================

export class CreateThemeOverrideCommand {
  constructor(
    public readonly overrideData: {
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
    },
  ) {}
}

export interface ThemeOverrideResponse {
  overrideId: string;
  storeId: string;
  themeId: string;
  organizationId: string;
  settings: Record<string, string | number | boolean>;
  customCss?: string;
  customLogoUrl?: string;
  customFaviconUrl?: string;
  customBannerUrl?: string;
  customHeadTags?: string[];
  customBodyAttributes?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function toOverrideResponse(override: ThemeOverride): ThemeOverrideResponse {
  return {
    overrideId: override.overrideId,
    storeId: override.storeId,
    themeId: override.themeId,
    organizationId: override.organizationId,
    settings: override.settings,
    customCss: override.customCss,
    customLogoUrl: override.customLogoUrl,
    customFaviconUrl: override.customFaviconUrl,
    customBannerUrl: override.customBannerUrl,
    customHeadTags: override.customHeadTags,
    customBodyAttributes: override.customBodyAttributes,
    isActive: override.isActive,
    createdAt: override.createdAt.toISOString(),
    updatedAt: override.updatedAt.toISOString(),
  };
}

export class ManageThemeOverridesUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async create(command: CreateThemeOverrideCommand): Promise<ThemeOverrideResponse> {
    const theme = await this.themeRepository.findById(command.overrideData.themeId);
    if (!theme) throw new ThemeNotFoundError(command.overrideData.themeId);

    const existing = await this.themeRepository.findOverrideByStore(command.overrideData.storeId);
    if (existing) {
      return this.update(existing.overrideId, {
        settings: command.overrideData.settings,
        customCss: command.overrideData.customCss,
        customLogoUrl: command.overrideData.customLogoUrl,
        customFaviconUrl: command.overrideData.customFaviconUrl,
        customBannerUrl: command.overrideData.customBannerUrl,
        customHeadTags: command.overrideData.customHeadTags,
        customBodyAttributes: command.overrideData.customBodyAttributes,
      });
    }

    const override = ThemeOverride.create({
      overrideId: generateUUID(),
      ...command.overrideData,
    });

    const saved = await this.themeRepository.saveOverride(override);

    eventBus.emit('theme.override.created', { overrideId: saved.overrideId, storeId: saved.storeId });

    return toOverrideResponse(saved);
  }

  async update(overrideId: string, updates: {
    settings?: Record<string, string | number | boolean>;
    customCss?: string;
    customLogoUrl?: string;
    customFaviconUrl?: string;
    customBannerUrl?: string;
    customHeadTags?: string[];
    customBodyAttributes?: Record<string, string>;
  }): Promise<ThemeOverrideResponse> {
    const override = await this.themeRepository.findOverrideById(overrideId);
    if (!override) throw new ThemeOverrideNotFoundError(overrideId);

    if (updates.settings) override.updateSettings(updates.settings);
    if (updates.customCss !== undefined) override.updateCustomCss(updates.customCss);
    if (updates.customLogoUrl !== undefined) override.updateCustomLogoUrl(updates.customLogoUrl);
    if (updates.customFaviconUrl !== undefined) override.updateCustomFaviconUrl(updates.customFaviconUrl);
    if (updates.customBannerUrl !== undefined) override.updateCustomBannerUrl(updates.customBannerUrl);
    if (updates.customHeadTags) {
      for (const tag of updates.customHeadTags) override.addHeadTag(tag);
    }
    if (updates.customBodyAttributes) override.updateBodyAttributes(updates.customBodyAttributes);

    const saved = await this.themeRepository.saveOverride(override);

    eventBus.emit('theme.override.updated', { overrideId: saved.overrideId });

    return toOverrideResponse(saved);
  }

  async delete(overrideId: string): Promise<void> {
    const override = await this.themeRepository.findOverrideById(overrideId);
    if (!override) throw new ThemeOverrideNotFoundError(overrideId);

    await this.themeRepository.deleteOverride(overrideId);

    eventBus.emit('theme.override.deleted', { overrideId });
  }

  async getByStore(storeId: string): Promise<ThemeOverrideResponse | null> {
    const override = await this.themeRepository.findOverrideByStore(storeId);
    return override ? toOverrideResponse(override) : null;
  }

  async getByTheme(themeId: string): Promise<ThemeOverrideResponse[]> {
    const overrides = await this.themeRepository.findOverridesByTheme(themeId);
    return overrides.map(toOverrideResponse);
  }

  async getByOrganization(organizationId: string): Promise<ThemeOverrideResponse[]> {
    const overrides = await this.themeRepository.findOverridesByOrganization(organizationId);
    return overrides.map(toOverrideResponse);
  }
}

// ============================================================================
// Assign Theme to Store
// ============================================================================

export class AssignThemeToStoreCommand {
  constructor(
    public readonly storeId: string,
    public readonly themeId: string,
    public readonly organizationId: string,
  ) {}
}

export class AssignThemeToStoreUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async execute(command: AssignThemeToStoreCommand): Promise<void> {
    const theme = await this.themeRepository.findById(command.themeId);
    if (!theme) throw new ThemeNotFoundError(command.themeId);
    if (!theme.isActive()) throw new ThemeValidationError(`Theme '${theme.slug}' is not active`);

    await this.themeRepository.assignThemeToStore(
      command.storeId,
      command.themeId,
      command.organizationId,
    );

    eventBus.emit('theme.assigned', { storeId: command.storeId, themeId: command.themeId });
  }

  async unassign(storeId: string): Promise<void> {
    const assignment = await this.themeRepository.findThemeAssignment(storeId);
    if (!assignment) throw new ThemeAssignmentNotFoundError(storeId);

    await this.themeRepository.unassignThemeFromStore(storeId);

    eventBus.emit('theme.unassigned', { storeId });
  }

  async getAssignment(storeId: string): Promise<{ themeId: string; overrideId?: string } | null> {
    return this.themeRepository.findThemeAssignment(storeId);
  }
}

// ============================================================================
// Resolve Store Theme
// ============================================================================

export class ResolveStoreThemeUseCase {
  constructor(private readonly themeRepository: ThemeRepository) {}

  async execute(storeId: string): Promise<ResolvedTheme | null> {
    return themeRegistry.resolveThemeForStore(storeId, this.themeRepository);
  }
}
