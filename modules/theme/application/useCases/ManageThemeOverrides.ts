import { generateUUID } from '../../../../libs/uuid';
import { ThemeRepository } from '../../domain/repositories/ThemeRepository';
import { ThemeOverride } from '../../domain/entities/ThemeOverride';
import { ThemeNotFoundError, ThemeOverrideNotFoundError } from '../../domain/errors/ThemeErrors';
import { eventBus } from '../../../../libs/events/eventBus';


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

  async update(
    overrideId: string,
    updates: {
      settings?: Record<string, string | number | boolean>;
      customCss?: string;
      customLogoUrl?: string;
      customFaviconUrl?: string;
      customBannerUrl?: string;
      customHeadTags?: string[];
      customBodyAttributes?: Record<string, string>;
    },
  ): Promise<ThemeOverrideResponse> {
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
