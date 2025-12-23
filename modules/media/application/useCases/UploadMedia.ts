/**
 * UploadMedia Use Case
 */

export interface UploadMediaInput {
  fileName: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  url: string;
  altText?: string;
  caption?: string;
  folderId?: string;
  uploadedBy?: string;
  tags?: string[];
}

export interface UploadMediaOutput {
  mediaId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export class UploadMediaUseCase {
  constructor(private readonly mediaRepository: any) {}

  async execute(input: UploadMediaInput): Promise<UploadMediaOutput> {
    if (!input.fileName || !input.mimeType || !input.url) {
      throw new Error('FileName, mimeType, and url are required');
    }

    const mediaId = `med_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine media type
    const mediaType = this.getMediaType(input.mimeType);

    const media = await this.mediaRepository.create({
      mediaId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      filePath: input.filePath,
      url: input.url,
      mediaType,
      altText: input.altText,
      caption: input.caption,
      folderId: input.folderId,
      uploadedBy: input.uploadedBy,
      tags: input.tags || [],
    });

    return {
      mediaId: media.mediaId,
      fileName: media.fileName,
      mimeType: media.mimeType,
      fileSize: media.fileSize,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      createdAt: media.createdAt.toISOString(),
    };
  }

  private getMediaType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'document';
    return 'file';
  }
}
