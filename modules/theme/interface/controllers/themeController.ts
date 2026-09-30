import { jsonResponse } from "libs/apiResponse";
/**
 * Theme Business Controller
 * Handles theme management, overrides, and assignment via /business/theme routes.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import { logger } from '../../../../libs/logger';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { CreateThemeCommand, CreateThemeOverrideCommand, AssignThemeToStoreCommand } from '../../application/useCases';
import { themeRegistry } from '../../domain/services/ThemeRegistry';
import {
  manageThemesUseCase,
  manageOverridesUseCase,
  assignThemeUseCase,
  resolveThemeUseCase,
} from '../../application/wired';

class ThemeController {
  // ── Theme CRUD ──────────────────────────────────────────────

  async listThemes(req: HttpRequest, res: HttpResponse) {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
      const organizationId = req.query.organizationId as string | undefined;

      const themes = await manageThemesUseCase.list({ status, type, tags, organizationId });
      jsonResponse(res, 200, { success: true, data: themes });
    } catch (error) {
      logger.error('Error listing themes:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to list themes' });
    }
  }

  async listBuiltInThemes(_req: HttpRequest, res: HttpResponse) {
    try {
      const themes = await manageThemesUseCase.listBuiltIn();
      jsonResponse(res, 200, { success: true, data: themes });
    } catch (error) {
      logger.error('Error listing built-in themes:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to list built-in themes' });
    }
  }

  async getTheme(req: HttpRequest, res: HttpResponse) {
    try {
      const theme = await manageThemesUseCase.getById(req.params.themeId);
      jsonResponse(res, 200, { success: true, data: theme });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async getThemeBySlug(req: HttpRequest, res: HttpResponse) {
    try {
      const theme = await manageThemesUseCase.getBySlug(req.params.slug);
      jsonResponse(res, 200, { success: true, data: theme });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async createTheme(req: HttpRequest, res: HttpResponse) {
    try {
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
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async updateTheme(req: HttpRequest, res: HttpResponse) {
    try {
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
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async deleteTheme(req: HttpRequest, res: HttpResponse) {
    try {
      await manageThemesUseCase.delete(req.params.themeId);
      jsonResponse(res, 200, { success: true, message: 'Theme deleted' });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async activateTheme(req: HttpRequest, res: HttpResponse) {
    try {
      const result = await manageThemesUseCase.activate(req.params.themeId);
      jsonResponse(res, 200, { success: true, data: result });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async archiveTheme(req: HttpRequest, res: HttpResponse) {
    try {
      const result = await manageThemesUseCase.archive(req.params.themeId);
      jsonResponse(res, 200, { success: true, data: result });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  // ── Theme Overrides ─────────────────────────────────────────

  async getOverrideByStore(req: HttpRequest, res: HttpResponse) {
    try {
      const override = await manageOverridesUseCase.getByStore(req.params.storeId);
      jsonResponse(res, 200, { success: true, data: override });
    } catch (error) {
      logger.error('Error getting override:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to get override' });
    }
  }

  async getOverridesByOrganization(req: HttpRequest, res: HttpResponse) {
    try {
      const overrides = await manageOverridesUseCase.getByOrganization(req.params.organizationId);
      jsonResponse(res, 200, { success: true, data: overrides });
    } catch (error) {
      logger.error('Error listing overrides:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to list overrides' });
    }
  }

  async createOverride(req: HttpRequest, res: HttpResponse) {
    try {
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
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async updateOverride(req: HttpRequest, res: HttpResponse) {
    try {
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
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async deleteOverride(req: HttpRequest, res: HttpResponse) {
    try {
      await manageOverridesUseCase.delete(req.params.overrideId);
      jsonResponse(res, 200, { success: true, message: 'Override deleted' });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  // ── Theme Assignment ────────────────────────────────────────

  async assignTheme(req: HttpRequest, res: HttpResponse) {
    try {
      const body = req.body as Record<string, unknown>;
      const command = new AssignThemeToStoreCommand(
        req.params.storeId,
        body.themeId as string,
        (body.organizationId as string) || (req.user?.id as string) || '',
      );
      await assignThemeUseCase.execute(command);
      jsonResponse(res, 200, { success: true, message: 'Theme assigned to store' });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async unassignTheme(req: HttpRequest, res: HttpResponse) {
    try {
      await assignThemeUseCase.unassign(req.params.storeId);
      jsonResponse(res, 200, { success: true, message: 'Theme unassigned from store' });
    } catch (error) {
      jsonResponse(res, getErrorStatusCode(error), { success: false, message: getErrorMessage(error) });
    }
  }

  async getAssignment(req: HttpRequest, res: HttpResponse) {
    try {
      const assignment = await assignThemeUseCase.getAssignment(req.params.storeId);
      jsonResponse(res, 200, { success: true, data: assignment });
    } catch (error) {
      logger.error('Error getting assignment:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to get assignment' });
    }
  }

  // ── Resolve Theme ───────────────────────────────────────────

  async resolveTheme(req: HttpRequest, res: HttpResponse) {
    try {
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
    } catch (error) {
      logger.error('Error resolving theme:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to resolve theme' });
    }
  }

  // ── Seed Built-in Themes ────────────────────────────────────

  async seedBuiltInThemes(_req: HttpRequest, res: HttpResponse) {
    try {
      const count = await manageThemesUseCase.seedBuiltInThemes();
      jsonResponse(res, 200, { success: true, message: `Seeded ${count} built-in themes` });
    } catch (error) {
      logger.error('Error seeding themes:', error);
      jsonResponse(res, 500, { success: false, message: 'Failed to seed built-in themes' });
    }
  }
}

export const themeController = new ThemeController();
