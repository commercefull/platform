/**
 * Media Repository Interface
 * Defines contract for media persistence operations
 */

import { Media } from '../entities/Media';

export interface MediaFilters {
  mediaId?: string;
  mimeType?: string;
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  size?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  offset?: number;
}

export interface MediaRepository {
  save(media: Media): Promise<void>;
  findById(mediaId: string): Promise<Media | null>;
  findByIds(mediaIds: string[]): Promise<Media[]>;
  findAll(filters?: MediaFilters): Promise<Media[]>;
  delete(mediaId: string): Promise<void>;
  count(filters?: Omit<MediaFilters, 'limit' | 'offset'>): Promise<number>;
}
