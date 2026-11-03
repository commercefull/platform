import { jsonResponse } from 'libs/apiResponse';
import type { HttpRequest, HttpResponse } from 'libs/http';
import {
  uploadMediaUseCase,
  deleteMediaUseCase,
  trackMediaUsageUseCase,
  organizeMediaFolderUseCase,
  manageContentUseCase,
} from '../../../application/useCases/wired';
import { UploadMediaCommand } from '../../../application/useCases/media/UploadMedia';
import { TrackMediaUsageCommand } from '../../../application/useCases/media/TrackMediaUsage';
import { MoveMediaToFolderCommand, CreateFolderCommand } from '../../../application/useCases/media/OrganizeMediaFolder';
import type {
  UploadMediaBody,
  UpdateMediaBody,
  MoveMediaToFolderBody,
  CreateMediaFolderBody,
  UpdateMediaFolderBody,
  TrackMediaUsageBody,
} from './types';

/** Media, media-folder, and media-usage handlers. */
export class MediaHandlers {
  private contentUC = manageContentUseCase;

  // Media Handlers

  getMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const folderId = req.query.folderId as string | undefined;
    const fileType = req.query.fileType as string | undefined;

    const media = await this.contentUC.findAllMedia(folderId, fileType, limit, offset);
    jsonResponse(res, 200, { success: true, data: media });
  };

  uploadMedia = async (req: HttpRequest<Record<string, string>, unknown, UploadMediaBody>, res: HttpResponse): Promise<void> => {
    const {
      title,
      fileName,
      filePath,
      fileType,
      fileSize,
      url,
      width,
      height,
      duration,
      altText,
      caption,
      description,
      folderId,
      thumbnailUrl,
      tags,
      isExternal,
      externalService,
      externalId,
    } = req.body;

    const result = await uploadMediaUseCase.execute(
      new UploadMediaCommand({
        title: title,
        fileName: fileName,
        filePath: filePath || '',
        fileType: fileType || 'application/octet-stream',
        fileSize: fileSize || 0,
        url: url,
        width: width,
        height: height,
        duration: duration,
        altText: altText,
        caption: caption,
        description: description,
        folderId: folderId || undefined,
        thumbnailUrl: thumbnailUrl,
        tags: tags,
        isExternal: isExternal,
        externalService: externalService,
        externalId: externalId,
        uploadedBy: req.user?.id,
      }),
    );
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentMediaId: result.id, contentMediaFolderId: folderId || null },
      message: 'Media uploaded successfully',
    });
  };

  getMediaById = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const media = await this.contentUC.findMediaById(id);
    if (!media) {
      jsonResponse(res, 404, { success: false, message: `Media with ID ${id} not found` });
      return;
    }
    jsonResponse(res, 200, { success: true, data: media });
  };

  updateMedia = async (req: HttpRequest<Record<string, string>, unknown, UpdateMediaBody>, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    const { title, altText, caption, description, folderId, tags, sortOrder } = req.body;

    const updated = await this.contentUC.updateMedia(id, {
      title,
      altText,
      caption,
      description,
      contentMediaFolderId: folderId,
      tags,
      sortOrder,
    });
    jsonResponse(res, 200, { success: true, data: updated, message: 'Media updated successfully' });
  };

  deleteMedia = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;

    await deleteMediaUseCase.execute(id);
    jsonResponse(res, 200, { success: true, message: 'Media deleted successfully' });
  };

  moveMediaToFolder = async (
    req: HttpRequest<Record<string, string>, unknown, MoveMediaToFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { mediaIds, folderId } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds)) {
      jsonResponse(res, 400, { success: false, message: 'Media IDs array is required' });
      return;
    }

    const result = await organizeMediaFolderUseCase.moveMediaToFolder(new MoveMediaToFolderCommand(mediaIds, folderId ?? null));
    jsonResponse(res, 200, { success: true, data: result, message: `${result.movedCount} media items moved successfully` });
  };

  // Media Folder Handlers

  getMediaFolders = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const parentId = req.query.parentId as string | undefined;
    const folders = await this.contentUC.findAllFolders(parentId);
    jsonResponse(res, 200, { success: true, data: folders });
  };

  getMediaFolderTree = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const folders = await this.contentUC.findAllFolders();
    jsonResponse(res, 200, { success: true, data: folders });
  };

  createMediaFolder = async (
    req: HttpRequest<Record<string, string>, unknown, CreateMediaFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { name, parentId } = req.body;

    const result = await organizeMediaFolderUseCase.createFolder(new CreateFolderCommand(name, parentId, req.user?.id));
    jsonResponse(res, 201, {
      success: true,
      data: { ...result, contentMediaFolderId: result.id },
      message: 'Folder created successfully',
    });
  };

  updateMediaFolder = async (
    req: HttpRequest<Record<string, string>, unknown, UpdateMediaFolderBody>,
    res: HttpResponse,
  ): Promise<void> => {
    const { id } = req.params;
    const { name, parentId, sortOrder } = req.body;

    const updated = await this.contentUC.updateFolder(id, { name, parentId, sortOrder });
    jsonResponse(res, 200, { success: true, data: updated, message: 'Folder updated successfully' });
  };

  deleteMediaFolder = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { id } = req.params;
    await this.contentUC.deleteFolder(id);
    jsonResponse(res, 200, { success: true, message: 'Folder deleted successfully' });
  };

  // Media Usage Handlers

  getMediaUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { mediaId } = req.params;

    const media = await this.contentUC.findMediaById(mediaId);
    if (!media) {
      jsonResponse(res, 404, { success: false, message: `Media with ID ${mediaId} not found` });
      return;
    }

    const usages = await this.contentUC.findUsageByMediaId(mediaId);
    jsonResponse(res, 200, { success: true, data: usages });
  };

  getMediaUsageByEntity = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { entityType, entityId } = req.params;

    const usages = await this.contentUC.findUsageByEntity(entityType, entityId);
    jsonResponse(res, 200, { success: true, data: usages });
  };

  trackMediaUsage = async (req: HttpRequest<Record<string, string>, unknown, TrackMediaUsageBody>, res: HttpResponse): Promise<void> => {
    const { mediaId, entityType, entityId, field, sortOrder } = req.body;

    const result = await trackMediaUsageUseCase.execute(new TrackMediaUsageCommand(mediaId, entityType, entityId, field, sortOrder));
    jsonResponse(res, 201, { success: true, data: result, message: 'Media usage tracked successfully' });
  };

  untrackMediaUsage = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { usageId } = req.params;

    const deleted = await this.contentUC.deleteMediaUsage(usageId);
    if (!deleted) {
      jsonResponse(res, 404, { success: false, message: `Media usage with ID ${usageId} not found` });
      return;
    }

    jsonResponse(res, 200, { success: true, message: 'Media usage untracked successfully' });
  };

  getMediaUsageCount = async (req: HttpRequest, res: HttpResponse): Promise<void> => {
    const { mediaId } = req.params;

    const count = await this.contentUC.getMediaUsageCount(mediaId);
    jsonResponse(res, 200, { success: true, data: { mediaId, usageCount: count } });
  };
}
