import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  createRedirectUseCase,
  updateRedirectUseCase,
  deleteRedirectUseCase,
  createPageVersionUseCase,
  restorePageVersionUseCase,
  createPageTranslationUseCase,
  updatePageTranslationUseCase,
  deletePageTranslationUseCase,
  manageContentUseCase,
} from '../../../application/useCases/wired';
import { CreateRedirectCommand } from '../../../application/useCases/redirect/CreateRedirect';
import { UpdateRedirectCommand } from '../../../application/useCases/redirect/UpdateRedirect';
import { CreatePageVersionCommand } from '../../../application/useCases/page/CreatePageVersion';
import { RestorePageVersionCommand } from '../../../application/useCases/page/RestorePageVersion';
import { CreatePageTranslationCommand } from '../../../application/useCases/translation/CreatePageTranslation';
import { UpdatePageTranslationCommand } from '../../../application/useCases/translation/UpdatePageTranslation';
import type {
  CreateRedirectBody,
  UpdateRedirectBody,
  CreatePageVersionBody,
  CreatePageTranslationBody,
  UpdatePageTranslationBody,
} from './types';

/** Redirect, page-version, and page-translation handlers. */
export class RedirectVersionTranslationHandlers {
  private contentUC = manageContentUseCase;

  // Redirect Handlers

  getRedirects = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const redirects = await this.contentUC.findAllRedirects(isActive, limit, offset);
    jsonResponse(res, 200, { success: true, data: redirects });
  };

  createRedirect = async (req: HttpRequest<Record<string, string>, unknown, CreateRedirectBody>, res: HttpResponse): Promise<void> => {
    const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

    const result = await createRedirectUseCase.execute(
      new CreateRedirectCommand({
        sourceUrl: sourceUrl,
        targetUrl: targetUrl,
        statusCode: statusCode ? (Number(statusCode) as 301 | 302 | 303 | 307 | 308) : undefined,
        isRegex: isRegex,
        isActive: isActive,
        notes: notes,
        createdBy: req.user?.id,
      }),
    );
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentRedirectId: result.id },
      message: 'Redirect created successfully',
    });
  };

  getRedirectById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const redirect = await this.contentUC.findRedirectById(id);
    if (!redirect) {
      jsonResponse(res, 404, { success: false, message: `Redirect with ID ${id} not found` });
      return;
    }
    jsonResponse(res, 200, { success: true, data: redirect });
  };

  updateRedirect = async (req: HttpRequest<Record<string, string>, unknown, UpdateRedirectBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes } = req.body;

    const result = await updateRedirectUseCase.execute(
      new UpdateRedirectCommand(id, { sourceUrl, targetUrl, statusCode, isRegex, isActive, notes }),
    );
    jsonResponse(res, 200, { success: true, data: result, message: 'Redirect updated successfully' });
  };

  deleteRedirect = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    await deleteRedirectUseCase.execute(id);
    jsonResponse(res, 200, { success: true, message: 'Redirect deleted successfully' });
  };

  // Page Version Handlers

  getPageVersions = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      jsonResponse(res, 404, { success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const versions = await this.contentUC.findVersionsByPageId(pageId, limit, offset);
    jsonResponse(res, 200, { success: true, data: versions });
  };

  createPageVersion = async (
    req: HttpRequest<Record<string, string>, unknown, CreatePageVersionBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const { comment } = req.body;

    const version = await createPageVersionUseCase.execute(new CreatePageVersionCommand(pageId, comment));
    jsonResponse(res, 201, { success: true, data: version, message: 'Page version created successfully' });
  };

  restorePageVersion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, versionId } = req.params;

    const { restoredPage, version } = await restorePageVersionUseCase.execute(new RestorePageVersionCommand(pageId, versionId));
    jsonResponse(res, 200, { success: true, data: restoredPage, message: `Page restored to version ${version}` });
  };

  deletePageVersion = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { versionId } = req.params;

    const version = await this.contentUC.findVersionById(versionId);
    if (!version) {
      jsonResponse(res, 404, { success: false, message: `Version with ID ${versionId} not found` });
      return;
    }

    await this.contentUC.deleteVersion(versionId);
    jsonResponse(res, 200, { success: true, message: 'Page version deleted successfully' });
  };

  // Page Translation Handlers

  getPageTranslations = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId } = req.params;

    const page = await this.contentUC.findPageById(pageId);
    if (!page) {
      jsonResponse(res, 404, { success: false, message: `Page with ID ${pageId} not found` });
      return;
    }

    const translations = await this.contentUC.findTranslationsByPageId(pageId);
    jsonResponse(res, 200, { success: true, data: translations });
  };

  getPageTranslationByLocale = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { pageId, localeId } = req.params;

    const translation = await this.contentUC.findTranslationByPageAndLocale(pageId, localeId);
    if (!translation) {
      jsonResponse(res, 404, { success: false, message: `Translation for locale ${localeId} not found` });
      return;
    }

    jsonResponse(res, 200, { success: true, data: translation });
  };

  createPageTranslation = async (
    req: HttpRequest<Record<string, string>, unknown, CreatePageTranslationBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { pageId } = req.params;
    const {
      localeId,
      title,
      slug,
      summary,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      openGraphTitle,
      openGraphDescription,
      featuredImage,
      isAutoTranslated,
      translationSource,
      isApproved,
      isPublished,
    } = req.body;

    const result = await createPageTranslationUseCase.execute(
      new CreatePageTranslationCommand(pageId, localeId, title, {
        slug,
        summary,
        content,
        metaTitle,
        metaDescription,
        metaKeywords,
        openGraphTitle,
        openGraphDescription,
        featuredImage,
        isAutoTranslated,
        translationSource,
        isApproved,
        isPublished,
      }),
    );
    jsonResponse(res, 201, { success: true, data: result, message: 'Page translation created successfully' });
  };

  updatePageTranslation = async (
    req: HttpRequest<Record<string, string>, unknown, UpdatePageTranslationBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { translationId } = req.params;
    const {
      title,
      slug,
      summary,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      openGraphTitle,
      openGraphDescription,
      featuredImage,
      isAutoTranslated,
      translationSource,
      isApproved,
      isPublished,
      publishedAt,
    } = req.body;

    const result = await updatePageTranslationUseCase.execute(
      new UpdatePageTranslationCommand(translationId, {
        title,
        slug,
        summary,
        content,
        metaTitle,
        metaDescription,
        metaKeywords,
        openGraphTitle,
        openGraphDescription,
        featuredImage,
        isAutoTranslated,
        translationSource,
        isApproved,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      }),
    );
    jsonResponse(res, 200, { success: true, data: result, message: 'Page translation updated successfully' });
  };

  deletePageTranslation = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { translationId } = req.params;

    await deletePageTranslationUseCase.execute(translationId);
    jsonResponse(res, 200, { success: true, message: 'Page translation deleted successfully' });
  };
}
