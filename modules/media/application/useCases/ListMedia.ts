/**
 * ListMedia Use Case
 */

export interface ListMediaInput {
  folderId?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'file';
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface MediaItem {
  mediaId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  mediaType: string;
  createdAt: string;
}

export interface ListMediaOutput {
  items: MediaItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class ListMediaUseCase {
  constructor(private readonly mediaRepository: any) {}

  async execute(input: ListMediaInput): Promise<ListMediaOutput> {
    const page = input.page || 1;
    const limit = input.limit || 20;

    const filters: Record<string, unknown> = {};
    if (input.folderId) filters.folderId = input.folderId;
    if (input.mediaType) filters.mediaType = input.mediaType;
    if (input.tags && input.tags.length > 0) filters.tags = input.tags;
    if (input.search) filters.search = input.search;

    const [items, total] = await Promise.all([
      this.mediaRepository.findAll(filters, {
        page,
        limit,
        sortBy: input.sortBy || 'createdAt',
        sortOrder: input.sortOrder || 'desc',
      }),
      this.mediaRepository.count(filters),
    ]);

    return {
      items: items.map((item: any) => ({
        mediaId: item.mediaId,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        altText: item.altText,
        mediaType: item.mediaType,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }
}
