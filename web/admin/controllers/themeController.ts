/**
 * Theme Admin Controller
 * Renders the theme management admin views (EJS templates)
 */

import { Response } from 'express';
import { TypedRequest, RequestBody } from 'libs/types/express';
import { adminRespond } from '../../respond';
import {
  manageThemesUseCase,
  manageOverridesUseCase,
  assignThemeUseCase,
  resolveThemeUseCase,
  CreateThemeOverrideCommand,
} from '../../../modules/theme';
import { themeRegistry } from '../../../modules/theme';

// ── Theme Gallery ─────────────────────────────────────────────

export const listThemes = async (req: TypedRequest, res: Response): Promise<void> => {
  let themes: unknown[];
  try {
    themes = await manageThemesUseCase.list();
  } catch {
    themes = [];
  }

  const builtInThemes = themeRegistry.listBuiltInThemes().map(t => t.toJSON());

  adminRespond(req, res, 'theme/index', {
    pageName: 'Themes',
    themes,
    builtInThemes,
  });
};

// ── Theme Detail / Customizer ─────────────────────────────────

export const themeDetail = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;

  let theme;
  let override = null;
  let assignment = null;
  let resolved = null;

  try {
    theme = await manageThemesUseCase.getById(themeId);

    const storeId = req.query.storeId as string;
    if (storeId) {
      override = await manageOverridesUseCase.getByStore(storeId);
      assignment = await assignThemeUseCase.getAssignment(storeId);
      resolved = await resolveThemeUseCase.execute(storeId);
    }
  } catch {
    adminRespond(req, res, 'error', {
      pageName: 'Not Found',
      error: 'Theme not found',
    });
    return;
  }

  const themeData = theme;
  const settingsSchema = theme.settingsSchema;
  const defaultSettings = theme.defaultSettings;

  adminRespond(req, res, 'theme/detail', {
    pageName: `Theme: ${theme.name}`,
    theme,
    override,
    assignment,
    resolved,
    storeId: req.query.storeId || '',
    themeJson: JSON.stringify(themeData),
    settingsSchemaJson: JSON.stringify(settingsSchema),
    defaultSettingsJson: JSON.stringify(defaultSettings),
    overrideJson: JSON.stringify(override),
    resolvedJson: JSON.stringify(resolved),
  });
};

// ── Assign Theme to Store ─────────────────────────────────────

export const assignTheme = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  const { storeId, organizationId } = req.body as RequestBody;

  try {
    await assignThemeUseCase.execute({
      storeId,
      themeId,
      organizationId,
    });
    res.redirect(`/admin/themes/${themeId}?storeId=${storeId}&assigned=1`);
  } catch (err) {
    res.redirect(`/admin/themes/${themeId}?storeId=${storeId}&error=${encodeURIComponent((err as Error).message)}`);
  }
};

// ── Unassign Theme ────────────────────────────────────────────

export const unassignTheme = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  const { storeId } = req.body as RequestBody;

  try {
    await assignThemeUseCase.unassign(storeId);
    res.redirect(`/admin/themes/${themeId}?storeId=${storeId}&unassigned=1`);
  } catch (err) {
    res.redirect(`/admin/themes/${themeId}?storeId=${storeId}&error=${encodeURIComponent((err as Error).message)}`);
  }
};

// ── Save Override ─────────────────────────────────────────────

export const saveOverride = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  const body = req.body as RequestBody;
  const { storeId, organizationId, settings, customCss, customLogoUrl, customFaviconUrl, customBannerUrl } = body;

  try {
    let override;
    const existing = await manageOverridesUseCase.getByStore(storeId);

    if (existing) {
      override = await manageOverridesUseCase.update(existing.overrideId, {
        settings: typeof settings === 'string' ? JSON.parse(settings) : settings,
        customCss,
        customLogoUrl,
        customFaviconUrl,
        customBannerUrl,
      });
    } else {
      override = await manageOverridesUseCase.create(new CreateThemeOverrideCommand({
        storeId,
        themeId,
        organizationId,
        settings: typeof settings === 'string' ? JSON.parse(settings) : settings,
        customCss,
        customLogoUrl,
        customFaviconUrl,
        customBannerUrl,
      }));
    }

    res.json({ success: true, data: override });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

// ── Activate Theme ────────────────────────────────────────────

export const activateTheme = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  try {
    await manageThemesUseCase.activate(themeId);
    res.json({ success: true, message: 'Theme activated' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

// ── Archive Theme ─────────────────────────────────────────────

export const archiveTheme = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  try {
    await manageThemesUseCase.archive(themeId);
    res.json({ success: true, message: 'Theme archived' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

// ── Delete Custom Theme ───────────────────────────────────────

export const deleteTheme = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  try {
    await manageThemesUseCase.delete(themeId);
    res.json({ success: true, message: 'Theme deleted' });
  } catch (err) {
    res.status(400).json({ success: false, message: (err as Error).message });
  }
};

// ── Theme Preview (standalone) ────────────────────────────────

export const themePreview = async (req: TypedRequest, res: Response): Promise<void> => {
  const { themeId } = req.params;
  const storeId = req.query.storeId as string;

  try {
    let resolved;
    if (storeId) {
      resolved = await resolveThemeUseCase.execute(storeId);
    }

    if (!resolved) {
      const theme = await manageThemesUseCase.getById(themeId);
      const defaultSettings = theme.defaultSettings;
      res.render('admin/views/theme/preview', {
        title: `Preview: ${theme.name}`,
        theme,
        settings: defaultSettings,
        cssVariables: {},
        customCss: '',
        user: req.user,
        session: req.session,
      });
      return;
    }

    const theme = resolved.theme;
    res.render('admin/views/theme/preview', {
      title: `Preview: ${theme.name}`,
      theme: theme.toJSON(),
      settings: resolved.settings,
      cssVariables: resolved.cssVariables,
      customCss: resolved.customCss || '',
      customLogoUrl: resolved.customLogoUrl,
      customFaviconUrl: resolved.customFaviconUrl,
      customBannerUrl: resolved.customBannerUrl,
      headTags: themeRegistry.generateHeadTags(resolved),
      bodyAttributes: themeRegistry.generateBodyAttributes(resolved),
      user: req.user,
      session: req.session,
    });
  } catch {
    res.status(404).send('Theme not found');
  }
};
