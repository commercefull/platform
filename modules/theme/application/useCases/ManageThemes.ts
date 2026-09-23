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
import { themeRegistry } from '../../domain/services/ThemeRegistry';
import { createBuiltInThemes } from '../../domain/builtInThemes';
import { ThemeNotFoundError, ThemeAlreadyExistsError, BuiltInThemeCannotBeDeletedError } from '../../domain/errors/ThemeErrors';
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

  async update(
    themeId: string,
    updates: {
      name?: string;
      description?: string;
      settingsSchema?: ThemeSettingsSchema;
      defaultSettings?: Record<string, string | number | boolean>;
      layout?: ThemeLayoutConfig;
      components?: ThemeComponentConfig;
      assets?: ThemeAssetConfig;
      tags?: string[];
    },
  ): Promise<ThemeResponse> {
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

  async list(filters?: { status?: string; type?: string; tags?: string[]; organizationId?: string }): Promise<ThemeResponse[]> {
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
