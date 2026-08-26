/**
 * Theme Business Controller
 * Handles theme management, overrides, and assignment via /business/theme routes.
 */

import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { logger } from '../../../../libs/logger';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { ThemeRepositoryImpl } from '../../infrastructure/repositories/ThemeRepositoryImpl';
import {
  ManageThemesUseCase,
  ManageThemeOverridesUseCase,
  AssignThemeToStoreUseCase,
  ResolveStoreThemeUseCase,
  CreateThemeCommand,
  CreateThemeOverrideCommand,
  AssignThemeToStoreCommand,
} from '../../application/useCases/Theme';
import { themeRegistry } from '../../domain/services/ThemeRegistry';

const themeRepository = new ThemeRepositoryImpl();
const manageThemesUseCase = new ManageThemesUseCase(themeRepository);
const manageOverridesUseCase = new ManageThemeOverridesUseCase(themeRepository);
const assignThemeUseCase = new AssignThemeToStoreUseCase(themeRepository);
const resolveThemeUseCase = new ResolveStoreThemeUseCase(themeRepository);

export class ThemeController {
  // ── Theme CRUD ──────────────────────────────────────────────

  async listThemes(req: TypedRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const type = req.query.type as string | undefined;
      const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;
      const organizationId = req.query.organizationId as string | undefined;

      const themes = await manageThemesUseCase.list({ status, type, tags, organizationId });
      res.json({ success: true, data: themes });
    } catch (error) {
      logger.error('Error listing themes:', error);
      res.status(500).json({ success: false, message: 'Failed to list themes' });
    }
  }

  async listBuiltInThemes(_req: TypedRequest, res: Response) {
    try {
      const themes = await manageThemesUseCase.listBuiltIn();
      res.json({ success: true, data: themes });
    } catch (error) {
      logger.error('Error listing built-in themes:', error);
      res.status(500).json({ success: false, message: 'Failed to list built-in themes' });
    }
  }

  async getTheme(req: TypedRequest, res: Response) {
    try {
      const theme = await manageThemesUseCase.getById(req.params.themeId);
      res.json({ success: true, data: theme });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async getThemeBySlug(req: TypedRequest, res: Response) {
    try {
      const theme = await manageThemesUseCase.getBySlug(req.params.slug);
      res.json({ success: true, data: theme });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async createTheme(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const command = new CreateThemeCommand({
        slug: body.slug as string,
        name: body.name as string,
        description: body.description as string | undefined,
        version: body.version as string | undefined,
        author: body.author as string | undefined,
        screenshotUrl: body.screenshotUrl as string | undefined,
        previewUrl: body.previewUrl as string | undefined,
        settingsSchema: body.settingsSchema as CreateThemeCommand['themeData']['settingsSchema'],
        defaultSettings: body.defaultSettings as Record<string, string | number | boolean>,
        layout: body.layout as CreateThemeCommand['themeData']['layout'],
        components: body.components as CreateThemeCommand['themeData']['components'],
        assets: body.assets as CreateThemeCommand['themeData']['assets'],
        tags: body.tags as string[] | undefined,
        isCustomizable: body.isCustomizable as boolean | undefined,
        organizationId: body.organizationId as string | undefined,
      });

      const result = await manageThemesUseCase.create(command);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateTheme(req: TypedRequest, res: Response) {
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
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deleteTheme(req: TypedRequest, res: Response) {
    try {
      await manageThemesUseCase.delete(req.params.themeId);
      res.json({ success: true, message: 'Theme deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async activateTheme(req: TypedRequest, res: Response) {
    try {
      const result = await manageThemesUseCase.activate(req.params.themeId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async archiveTheme(req: TypedRequest, res: Response) {
    try {
      const result = await manageThemesUseCase.archive(req.params.themeId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Theme Overrides ─────────────────────────────────────────

  async getOverrideByStore(req: TypedRequest, res: Response) {
    try {
      const override = await manageOverridesUseCase.getByStore(req.params.storeId);
      res.json({ success: true, data: override });
    } catch (error) {
      logger.error('Error getting override:', error);
      res.status(500).json({ success: false, message: 'Failed to get override' });
    }
  }

  async getOverridesByOrganization(req: TypedRequest, res: Response) {
    try {
      const overrides = await manageOverridesUseCase.getByOrganization(req.params.organizationId);
      res.json({ success: true, data: overrides });
    } catch (error) {
      logger.error('Error listing overrides:', error);
      res.status(500).json({ success: false, message: 'Failed to list overrides' });
    }
  }

  async createOverride(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const command = new CreateThemeOverrideCommand({
        storeId: body.storeId as string,
        themeId: body.themeId as string,
        organizationId: body.organizationId as string,
        settings: body.settings as Record<string, string | number | boolean> | undefined,
        customCss: body.customCss as string | undefined,
        customLogoUrl: body.customLogoUrl as string | undefined,
        customFaviconUrl: body.customFaviconUrl as string | undefined,
        customBannerUrl: body.customBannerUrl as string | undefined,
        customHeadTags: body.customHeadTags as string[] | undefined,
        customBodyAttributes: body.customBodyAttributes as Record<string, string> | undefined,
      });

      const result = await manageOverridesUseCase.create(command);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async updateOverride(req: TypedRequest, res: Response) {
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
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async deleteOverride(req: TypedRequest, res: Response) {
    try {
      await manageOverridesUseCase.delete(req.params.overrideId);
      res.json({ success: true, message: 'Override deleted' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  // ── Theme Assignment ────────────────────────────────────────

  async assignTheme(req: TypedRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const command = new AssignThemeToStoreCommand(
        req.params.storeId,
        body.themeId as string,
        body.organizationId as string,
      );
      await assignThemeUseCase.execute(command);
      res.json({ success: true, message: 'Theme assigned to store' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async unassignTheme(req: TypedRequest, res: Response) {
    try {
      await assignThemeUseCase.unassign(req.params.storeId);
      res.json({ success: true, message: 'Theme unassigned from store' });
    } catch (error) {
      res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
    }
  }

  async getAssignment(req: TypedRequest, res: Response) {
    try {
      const assignment = await assignThemeUseCase.getAssignment(req.params.storeId);
      res.json({ success: true, data: assignment });
    } catch (error) {
      logger.error('Error getting assignment:', error);
      res.status(500).json({ success: false, message: 'Failed to get assignment' });
    }
  }

  // ── Resolve Theme ───────────────────────────────────────────

  async resolveTheme(req: TypedRequest, res: Response) {
    try {
      const resolved = await resolveThemeUseCase.execute(req.params.storeId);
      if (!resolved) {
        res.status(404).json({ success: false, message: 'No theme assigned to this store' });
        return;
      }

      res.json({
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
      res.status(500).json({ success: false, message: 'Failed to resolve theme' });
    }
  }

  // ── Seed Built-in Themes ────────────────────────────────────

  async seedBuiltInThemes(_req: TypedRequest, res: Response) {
    try {
      const count = await manageThemesUseCase.seedBuiltInThemes();
      res.json({ success: true, message: `Seeded ${count} built-in themes` });
    } catch (error) {
      logger.error('Error seeding themes:', error);
      res.status(500).json({ success: false, message: 'Failed to seed built-in themes' });
    }
  }
}

export const themeController = new ThemeController();
