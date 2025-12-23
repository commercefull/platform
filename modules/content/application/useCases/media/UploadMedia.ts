/**
 * Upload Media Use Case
 * Handles media file upload and registration
 */

import { ContentMediaRepo } from '../../../repos/contentMediaRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class UploadMediaCommand {
  constructor(
    public readonly title: string,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly fileType: string,
    public readonly fileSize: number,
    public readonly url: string,
    public readonly width?: number,
    public readonly height?: number,
    public readonly duration?: number,
    public readonly altText?: string,
    public readonly caption?: string,
    public readonly description?: string,
    public readonly folderId?: string,
    public readonly thumbnailUrl?: string,
    public readonly tags?: string[],
    public readonly isExternal?: boolean,
    public readonly externalService?: string,
    public readonly externalId?: string,
    public readonly uploadedBy?: string,
  ) {}
}

export interface MediaResponse {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  altText?: string;
  folderId?: string;
  createdAt: string;
}

export class UploadMediaUseCase {
  constructor(private readonly mediaRepo: ContentMediaRepo) {}

  async execute(command: UploadMediaCommand): Promise<MediaResponse> {
    if (!command.title || !command.fileName || !command.url) {
      throw new Error('Title, fileName, and URL are required');
    }

    // Validate file type
    const allowedTypes = ['image', 'video', 'audio', 'document', 'application'];
    const typeCategory = command.fileType.split('/')[0];
    if (!allowedTypes.includes(typeCategory) && !command.fileType.startsWith('application/')) {
      throw new Error(`File type ${command.fileType} is not allowed`);
    }

    // Verify folder exists if provided
    if (command.folderId) {
      const folder = await this.mediaRepo.findFolderById(command.folderId);
      if (!folder) {
        throw new Error(`Folder with ID ${command.folderId} not found`);
      }
    }

    const media = await this.mediaRepo.createMedia({
      title: command.title,
      fileName: command.fileName,
      filePath: command.filePath,
      fileType: command.fileType,
      fileSize: command.fileSize,
      url: command.url,
      width: command.width ?? null,
      height: command.height ?? null,
      duration: command.duration ?? null,
      altText: command.altText ?? null,
      caption: command.caption ?? null,
      description: command.description ?? null,
      contentMediaFolderId: command.folderId ?? null,
      thumbnailUrl: command.thumbnailUrl ?? null,
      sortOrder: 0,
      tags: command.tags ?? null,
      isExternal: command.isExternal || false,
      externalService: command.externalService ?? null,
      externalId: command.externalId ?? null,
      createdBy: command.uploadedBy ?? null,
      updatedBy: null,
    });

    eventBus.emit('content.media.uploaded', {
      mediaId: media.contentMediaId,
      title: media.title,
      fileName: media.fileName,
      fileType: media.fileType,
      fileSize: media.fileSize,
      uploadedBy: command.uploadedBy,
    });

    return {
      id: media.contentMediaId,
      title: media.title,
      fileName: media.fileName,
      fileType: media.fileType,
      fileSize: media.fileSize,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl ?? undefined,
      width: media.width ?? undefined,
      height: media.height ?? undefined,
      altText: media.altText ?? undefined,
      folderId: media.contentMediaFolderId ?? undefined,
      createdAt: media.createdAt instanceof Date ? media.createdAt.toISOString() : String(media.createdAt),
    };
  }
}
