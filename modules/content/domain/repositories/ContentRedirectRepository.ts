/**
 * Content Redirect Repository Interface
 *
 * Defines the contract for Content Redirect persistence operations.
 */

import type { ContentRedirect } from '../../../../libs/db/types';

export type ContentRedirectCreateParams = Omit<ContentRedirect, 'contentRedirectId' | 'hits' | 'lastUsed' | 'createdAt' | 'updatedAt'>;
export type ContentRedirectUpdateParams = Partial<
  Omit<ContentRedirect, 'contentRedirectId' | 'hits' | 'lastUsed' | 'createdAt' | 'updatedAt'>
>;

export interface IContentRedirectRepository {
  findRedirectById(id: string): Promise<ContentRedirect | null>;
  findRedirectBySourceUrl(sourceUrl: string): Promise<ContentRedirect | null>;
  findMatchingRedirect(url: string): Promise<ContentRedirect | null>;
  findAllRedirects(isActive?: boolean, limit?: number, offset?: number): Promise<ContentRedirect[]>;
  createRedirect(params: ContentRedirectCreateParams): Promise<ContentRedirect>;
  updateRedirect(id: string, params: ContentRedirectUpdateParams): Promise<ContentRedirect>;
  deleteRedirect(id: string): Promise<boolean>;
  recordHit(id: string): Promise<void>;
  getTopRedirects(limit?: number): Promise<ContentRedirect[]>;
  getRecentRedirects(limit?: number): Promise<ContentRedirect[]>;
}
