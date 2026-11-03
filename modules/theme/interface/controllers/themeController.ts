import { jsonResponse } from 'libs/apiResponse';
/**
 * Theme Business Controller
 * Handles theme management, overrides, and assignment via /business/theme routes.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { CreateThemeCommand, CreateThemeOverrideCommand, AssignThemeToStoreCommand } from '../../application/useCases';
import { themeRegistry } from '../../domain/services/ThemeRegistry';
import { manageThemesUseCase, manageOverridesUseCase, assignThemeUseCase, resolveThemeUseCase } from '../../application/wired';

class ThemeController {
  // ── Theme CRUD ──────────────────────────────────────────────

  listThemes = async (req: HttpRequest, res: HttpResponse) => {
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
    const organizationId = req.query.organizationId as string | undefined;

    const themes = await manageThemesUseCase.list({ status, type, tags, organizationId });
    jsonResponse(res, 200, { success: true, data: themes });
  };

  listBuiltInThemes = async (_req: HttpRequest, res: HttpResponse) => {
    const themes = await manageThemesUseCase.listBuiltIn();
    jsonResponse(res, 200, { success: true, data: themes });
  };

  getTheme = async (req: HttpRequest, res: HttpResponse) => {
    const theme = await manageThemesUseCase.getById(req.params.themeId);
    jsonResponse(res, 200, { success: true, data: theme });
  };

  getThemeBySlug = async (req: HttpRequest, res: HttpResponse) => {
    const theme = await manageThemesUseCase.getBySlug(req.params.slug);
    jsonResponse(res, 200, { success: true, data: theme });
  };

  createTheme = async (req: HttpRequest, res: HttpResponse) => {
    const body = req.body as Record<string, unknown>;
    // Normalize settingsSchema: accept either {groups:[...]} or a flat array of settings
    let settingsSchema = body.settingsSchema as CreateThemeCommand['themeData']['settingsSchema'];
    if (Array.isArray(body.settingsSchema)) {
      settingsSchema = { groups: [{ groupId: 'general', label: 'General', settings: body.settingsSchema as never[] }] };
    } else if (!body.settingsSchema || !Array.isArray((body.settingsSchema as Record<string, unknown>).groups)) {
      settingsSchema = { groups: [] };
    }
    const command = new CreateThemeCommand({
      slug: body.slug as string,
      name: body.name as string,
      description: body.description as string | undefined,
      version: body.version as string | undefined,
      author: body.author as string | undefined,
      screenshotUrl: body.screenshotUrl as string | undefined,
      previewUrl: body.previewUrl as string | undefined,
      settingsSchema,
      defaultSettings: (body.defaultSettings as Record<string, string | number | boolean>) || {},
      layout: (body.layout as CreateThemeCommand['themeData']['layout']) || { regions: [], pageLayouts: [] },
      components: (body.components as CreateThemeCommand['themeData']['components']) || { components: [] },
      assets: body.assets as CreateThemeCommand['themeData']['assets'],
      tags: body.tags as string[] | undefined,
      isCustomizable: body.isCustomizable as boolean | undefined,
      organizationId: (body.organizationId as string | undefined) || (req.user?.id as string | undefined),
    });

    const result = await manageThemesUseCase.create(command);
    jsonResponse(res, 201, { success: true, data: result });
  };

  updateTheme = async (req: HttpRequest, res: HttpResponse) => {
    const body = req.body as Record<string, unknown>;
    const result = await manageThemesUseCase.update(req.params.themeId, {
      name: body.name as string | undefined,
      description: body.description as string | undefined,
      settingsSchema: body.settingsSchema as CreateThemeCommand['themeData']['settingsSchema'] | undefined,
      defaultSettings: body.defaultSettings as Record<string, string | number | boolean> | undefined,
      layout: body.layout as CreateThemeCommand['themeData']['layout'] | undefined,
      components: body.components as CreateThemeCommand['themeData']['components'] | undefined,
      assets: body.assets as CreateThemeCommand['themeData']['assets'] | undefined,
      tags: body.tags as string[] | undefined,
    });
    jsonResponse(res, 200, { success: true, data: result });
  };

  deleteTheme = async (req: HttpRequest, res: HttpResponse) => {
    await manageThemesUseCase.delete(req.params.themeId);
    jsonResponse(res, 200, { success: true, message: 'Theme deleted' });
  };

  activateTheme = async (req: HttpRequest, res: HttpResponse) => {
    const result = await manageThemesUseCase.activate(req.params.themeId);
    jsonResponse(res, 200, { success: true, data: result });
  };

  archiveTheme = async (req: HttpRequest, res: HttpResponse) => {
    const result = await manageThemesUseCase.archive(req.params.themeId);
    jsonResponse(res, 200, { success: true, data: result });
  };

  // ── Theme Overrides ─────────────────────────────────────────

  getOverrideByStore = async (req: HttpRequest, res: HttpResponse) => {
    const override = await manageOverridesUseCase.getByStore(req.params.storeId);
    jsonResponse(res, 200, { success: true, data: override });
  };

  getOverridesByOrganization = async (req: HttpRequest, res: HttpResponse) => {
    const overrides = await manageOverridesUseCase.getByOrganization(req.params.organizationId);
    jsonResponse(res, 200, { success: true, data: overrides });
  };

  createOverride = async (req: HttpRequest, res: HttpResponse) => {
    const body = req.body as Record<string, unknown>;
    const command = new CreateThemeOverrideCommand({
      storeId: body.storeId as string,
      themeId: body.themeId as string,
      organizationId: (body.organizationId as string) || (req.user?.id as string) || '',
      settings: body.settings as Record<string, string | number | boolean> | undefined,
      customCss: body.customCss as string | undefined,
      customLogoUrl: body.customLogoUrl as string | undefined,
      customFaviconUrl: body.customFaviconUrl as string | undefined,
      customBannerUrl: body.customBannerUrl as string | undefined,
      customHeadTags: body.customHeadTags as string[] | undefined,
      customBodyAttributes: body.customBodyAttributes as Record<string, string> | undefined,
    });

    const result = await manageOverridesUseCase.create(command);
    jsonResponse(res, 201, { success: true, data: result });
  };

  updateOverride = async (req: HttpRequest, res: HttpResponse) => {
    const body = req.body as Record<string, unknown>;
    const result = await manageOverridesUseCase.update(req.params.overrideId, {
      settings: body.settings as Record<string, string | number | boolean> | undefined,
      customCss: body.customCss as string | undefined,
      customLogoUrl: body.customLogoUrl as string | undefined,
      customFaviconUrl: body.customFaviconUrl as string | undefined,
      customBannerUrl: body.customBannerUrl as string | undefined,
      customHeadTags: body.customHeadTags as string[] | undefined,
      customBodyAttributes: body.customBodyAttributes as Record<string, string> | undefined,
    });
    jsonResponse(res, 200, { success: true, data: result });
  };

  deleteOverride = async (req: HttpRequest, res: HttpResponse) => {
    await manageOverridesUseCase.delete(req.params.overrideId);
    jsonResponse(res, 200, { success: true, message: 'Override deleted' });
  };

  // ── Theme Assignment ────────────────────────────────────────

  assignTheme = async (req: HttpRequest, res: HttpResponse) => {
    const body = req.body as Record<string, unknown>;
    const command = new AssignThemeToStoreCommand(
      req.params.storeId,
      body.themeId as string,
      (body.organizationId as string) || (req.user?.id as string) || '',
    );
    await assignThemeUseCase.execute(command);
    jsonResponse(res, 200, { success: true, message: 'Theme assigned to store' });
  };

  unassignTheme = async (req: HttpRequest, res: HttpResponse) => {
    await assignThemeUseCase.unassign(req.params.storeId);
    jsonResponse(res, 200, { success: true, message: 'Theme unassigned from store' });
  };

  getAssignment = async (req: HttpRequest, res: HttpResponse) => {
    const assignment = await assignThemeUseCase.getAssignment(req.params.storeId);
    jsonResponse(res, 200, { success: true, data: assignment });
  };

  // ── Resolve Theme ───────────────────────────────────────────

  resolveTheme = async (req: HttpRequest, res: HttpResponse) => {
    const resolved = await resolveThemeUseCase.execute(req.params.storeId);
    if (!resolved) {
      jsonResponse(res, 404, { success: false, message: 'No theme assigned to this store' });
      return;
    }

    jsonResponse(res, 200, {
      success: true,
      data: {
        theme: resolved.theme.toJSON(),
        settings: resolved.settings,
        cssVariables: resolved.cssVariables,
        css: themeRegistry.generateCSS(resolved),
        headTags: themeRegistry.generateHeadTags(resolved),
        bodyAttributes: themeRegistry.generateBodyAttributes(resolved),
        customLogoUrl: resolved.customLogoUrl,
        customFaviconUrl: resolved.customFaviconUrl,
        customBannerUrl: resolved.customBannerUrl,
      },
    });
  };

  // ── Seed Built-in Themes ────────────────────────────────────

  seedBuiltInThemes = async (_req: HttpRequest, res: HttpResponse) => {
    const count = await manageThemesUseCase.seedBuiltInThemes();
    jsonResponse(res, 200, { success: true, message: `Seeded ${count} built-in themes` });
  };
}

export const themeController = new ThemeController();
