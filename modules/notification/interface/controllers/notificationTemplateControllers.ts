/**
 * Notification Template & Preference Controllers
 *
 * Split from notificationBusinessController.ts; re-exported there for router compatibility.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  manageNotificationTemplatesUseCase,
  manageNotificationPreferencesUseCase,
} from '../../application/useCases/wired';
import { successResponse, errorResponse } from '../../../../libs/apiResponse';
import { getErrorMessage, getErrorStatusCode } from '../../../../libs/errors';
import { NotificationTemplate, NotificationPreference } from '../../application/wired';

// ============================================================================
// Notification Template CRUD handlers
// ============================================================================

interface CreateTemplateBody {
  code: string;
  name: string;
  description?: string;
  type: string;
  supportedChannels: string[];
  defaultChannel: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, unknown>;
  isActive?: boolean;
  categoryCode?: string;
  previewData?: Record<string, unknown>;
}

interface UpdateTemplateBody {
  name?: string;
  description?: string;
  type?: string;
  supportedChannels?: string[];
  defaultChannel?: string;
  subject?: string;
  htmlTemplate?: string;
  textTemplate?: string;
  pushTemplate?: string;
  smsTemplate?: string;
  parameters?: Record<string, unknown>;
  isActive?: boolean;
  categoryCode?: string;
  previewData?: Record<string, unknown>;
}

function mapTemplate(t: NotificationTemplate) {
  return {
    id: t.notificationTemplateId,
    code: t.code,
    name: t.name,
    description: t.description,
    type: t.type,
    supportedChannels: t.supportedChannels,
    defaultChannel: t.defaultChannel,
    subject: t.subject,
    htmlTemplate: t.htmlTemplate,
    textTemplate: t.textTemplate,
    pushTemplate: t.pushTemplate,
    smsTemplate: t.smsTemplate,
    parameters: t.parameters,
    isActive: t.isActive,
    categoryCode: t.categoryCode,
    previewData: t.previewData,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export const getAllTemplates = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const activeOnly = req.query.activeOnly === 'true';
  const templates = await manageNotificationTemplatesUseCase.findAll(activeOnly);
  successResponse(res, templates.map(mapTemplate));
};

export const getTemplateById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  try {
    successResponse(res, mapTemplate(await manageNotificationTemplatesUseCase.getById(String(req.params.id))));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const getTemplatesByType = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const { type } = req.params;
  const filtered = await manageNotificationTemplatesUseCase.findByType(type);
  successResponse(res, filtered.map(mapTemplate));
};

export const createTemplate = async (
  req: HttpRequest<Record<string, string>, unknown, CreateTemplateBody>,
  res: HttpResponse,
): Promise<void> => {
  const { code, name, type, supportedChannels, defaultChannel } = req.body;

  try {
    const created = await manageNotificationTemplatesUseCase.create({
      code,
      name,
      description: req.body.description ?? undefined,
      type: type as never,
      supportedChannels: supportedChannels as never,
      defaultChannel: defaultChannel as never,
      subject: req.body.subject ?? undefined,
      htmlTemplate: req.body.htmlTemplate ?? undefined,
      textTemplate: req.body.textTemplate ?? undefined,
      pushTemplate: req.body.pushTemplate ?? undefined,
      smsTemplate: req.body.smsTemplate ?? undefined,
      parameters: req.body.parameters ?? undefined,
      isActive: req.body.isActive ?? true,
      categoryCode: req.body.categoryCode ?? undefined,
      previewData: req.body.previewData ?? undefined,
      createdBy: undefined,
    });
    successResponse(res, mapTemplate(created), 201);
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const updateTemplate = async (
  req: HttpRequest<Record<string, string>, unknown, UpdateTemplateBody>,
  res: HttpResponse,
): Promise<void> => {
  const id = String(req.params.id);

  try {
    const updated = await manageNotificationTemplatesUseCase.updateExisting(id, {
      name: req.body.name,
      description: req.body.description ?? undefined,
      type: req.body.type as never,
      supportedChannels: req.body.supportedChannels as never,
      defaultChannel: req.body.defaultChannel as never,
      subject: req.body.subject ?? undefined,
      htmlTemplate: req.body.htmlTemplate ?? undefined,
      textTemplate: req.body.textTemplate ?? undefined,
      pushTemplate: req.body.pushTemplate ?? undefined,
      smsTemplate: req.body.smsTemplate ?? undefined,
      parameters: req.body.parameters ?? undefined,
      isActive: req.body.isActive,
      categoryCode: req.body.categoryCode ?? undefined,
      previewData: req.body.previewData ?? undefined,
      createdBy: undefined,
    });
    successResponse(res, mapTemplate(updated));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const deleteTemplate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const id = String(req.params.id);

  try {
    const deleted = await manageNotificationTemplatesUseCase.deleteExisting(id);
    if (!deleted) {
      errorResponse(res, 'Failed to delete template', 500);
      return;
    }
    successResponse(res, { id });
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};

export const previewTemplate = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const id = String(req.params.id);
  const { data, channel } = req.body as { data?: Record<string, unknown>; channel?: string };
  const result = await manageNotificationTemplatesUseCase.getPreview(id, data);

  const template = result.template;
  const html = channel === 'email' || !channel ? result.compiledHtml : undefined;
  const text = channel === 'email' || !channel ? result.compiledText : undefined;

  successResponse(res, { html, text, template: mapTemplate(template) });
};

// ============================================================================
// Admin Notification Preference handlers
// ============================================================================

function mapPreferenceAdmin(p: NotificationPreference) {
  return {
    id: p.notificationPreferenceId,
    userId: p.userId,
    userType: p.userType,
    type: p.type,
    channelPreferences: p.channelPreferences,
    isEnabled: p.isEnabled,
    schedulePreferences: p.schedulePreferences || null,
    metadata: p.metadata || null,
    updatedAt: p.updatedAt.toISOString ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

export const getAllPreferences = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const preferences = await manageNotificationPreferencesUseCase.findAll();
  successResponse(res, preferences.map(mapPreferenceAdmin));
};

export const getPreferencesByUser = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
  const userId = String(req.params.userId);
  const preferences = await manageNotificationPreferencesUseCase.findByUser(userId, 'customer');
  successResponse(res, preferences.map(mapPreferenceAdmin));
};

interface UpdatePreferenceAdminBody {
  channelPreferences?: Record<string, boolean>;
  isEnabled?: boolean;
  schedulePreferences?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export const updatePreferenceAdmin = async (
  req: HttpRequest<Record<string, string>, unknown, UpdatePreferenceAdminBody>,
  res: HttpResponse,
): Promise<void> => {
  const id = String(req.params.id);
  const { channelPreferences, isEnabled, schedulePreferences, metadata } = req.body;

  try {
    const updated = await manageNotificationPreferencesUseCase.update(id, {
      channelPreferences,
      isEnabled,
      schedulePreferences,
      metadata,
    });
    successResponse(res, mapPreferenceAdmin(updated));
  } catch (error) {
    errorResponse(res, getErrorMessage(error), getErrorStatusCode(error));
  }
};
