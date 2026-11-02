/**
 * Upload Media Use Case
 * Handles media file upload and registration
 */

import type { IContentMediaRepository } from '../../../domain/repositories/ContentMediaRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { MediaFolderNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
export interface UploadMediaCommandProps {
  title: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  thumbnailUrl?: string;
  tags?: string[];
  isExternal?: boolean;
  externalService?: string;
  externalId?: string;
  uploadedBy?: string;
}

export class UploadMediaCommand {
  public readonly title: string;
  public readonly fileName: string;
  public readonly filePath: string;
  public readonly fileType: string;
  public readonly fileSize: number;
  public readonly url: string;
  public readonly width?: number;
  public readonly height?: number;
  public readonly duration?: number;
  public readonly altText?: string;
  public readonly caption?: string;
  public readonly description?: string;
  public readonly folderId?: string;
  public readonly thumbnailUrl?: string;
  public readonly tags?: string[];
  public readonly isExternal?: boolean;
  public readonly externalService?: string;
  public readonly externalId?: string;
  public readonly uploadedBy?: string;

  constructor(props: UploadMediaCommandProps) {
    this.title = props.title;
    this.fileName = props.fileName;
    this.filePath = props.filePath;
    this.fileType = props.fileType;
    this.fileSize = props.fileSize;
    this.url = props.url;
    this.width = props.width;
    this.height = props.height;
    this.duration = props.duration;
    this.altText = props.altText;
    this.caption = props.caption;
    this.description = props.description;
    this.folderId = props.folderId;
    this.thumbnailUrl = props.thumbnailUrl;
    this.tags = props.tags;
    this.isExternal = props.isExternal;
    this.externalService = props.externalService;
    this.externalId = props.externalId;
    this.uploadedBy = props.uploadedBy;
  }
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
  constructor(private readonly mediaRepo: IContentMediaRepository) {}

  async execute(command: UploadMediaCommand): Promise<MediaResponse> {
    if (!command.title || !command.fileName || !command.url) {
      throw new ContentValidationError('Title, fileName, and URL are required');
    }

    // Validate file type
    const allowedTypes = ['image', 'video', 'audio', 'document', 'application'];
    const typeCategory = command.fileType.split('/')[0];
    if (!allowedTypes.includes(typeCategory) && !command.fileType.startsWith('application/')) {
      throw new ContentValidationError(`File type ${command.fileType} is not allowed`);
    }

    // Verify folder exists if provided
    if (command.folderId) {
      const folder = await this.mediaRepo.findFolderById(command.folderId);
      if (!folder) {
        throw new MediaFolderNotFoundError(command.folderId);
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
