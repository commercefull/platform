/**
 * Content Media Repository Interface
 *
 * Defines the contract for Content Media and Media Folder persistence operations.
 */

import type { ContentMedia, ContentMediaFolder } from '../../../../libs/db/types';

export type ContentMediaCreateParams = Omit<ContentMedia, 'contentMediaId' | 'createdAt' | 'updatedAt'>;
export type ContentMediaUpdateParams = Partial<Omit<ContentMedia, 'contentMediaId' | 'createdAt' | 'updatedAt'>>;
export type ContentMediaFolderCreateParams = Omit<ContentMediaFolder, 'contentMediaFolderId' | 'createdAt' | 'updatedAt'>;
export type ContentMediaFolderUpdateParams = Partial<Omit<ContentMediaFolder, 'contentMediaFolderId' | 'createdAt' | 'updatedAt'>>;

export interface IContentMediaRepository {
  // Media methods
  findMediaById(id: string): Promise<ContentMedia | null>;
  findAllMedia(folderId?: string, fileType?: string, limit?: number, offset?: number): Promise<ContentMedia[]>;
  searchMedia(searchTerm: string, limit?: number): Promise<ContentMedia[]>;
  createMedia(params: ContentMediaCreateParams): Promise<ContentMedia>;
  updateMedia(id: string, params: ContentMediaUpdateParams): Promise<ContentMedia>;
  deleteMedia(id: string): Promise<boolean>;

  // Folder methods
  findFolderById(id: string): Promise<ContentMediaFolder | null>;
  findAllFolders(parentId?: string): Promise<ContentMediaFolder[]>;
  createFolder(params: ContentMediaFolderCreateParams): Promise<ContentMediaFolder>;
  updateFolder(id: string, params: ContentMediaFolderUpdateParams): Promise<ContentMediaFolder>;
  deleteFolder(id: string): Promise<boolean>;
}
