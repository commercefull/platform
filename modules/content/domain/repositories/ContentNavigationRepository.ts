/**
 * Content Navigation Repository Interface
 *
 * Defines the contract for Content Navigation and Navigation Item persistence operations.
 */

import type { ContentNavigation, ContentNavigationItem } from '../../../../libs/db/types';

export type ContentNavigationCreateParams = Omit<ContentNavigation, 'contentNavigationId' | 'createdAt' | 'updatedAt'>;
export type ContentNavigationUpdateParams = Partial<Omit<ContentNavigation, 'contentNavigationId' | 'createdAt' | 'updatedAt'>>;
export type ContentNavigationItemCreateParams = Omit<ContentNavigationItem, 'contentNavigationItemId' | 'createdAt' | 'updatedAt'>;
export type ContentNavigationItemUpdateParams = Partial<Omit<ContentNavigationItem, 'contentNavigationItemId' | 'createdAt' | 'updatedAt'>>;

export interface IContentNavigationRepository {
  // Navigation methods
  findNavigationById(id: string): Promise<ContentNavigation | null>;
  findNavigationBySlug(slug: string): Promise<ContentNavigation | null>;
  findNavigationByLocation(location: string): Promise<ContentNavigation | null>;
  findAllNavigations(isActive?: boolean): Promise<ContentNavigation[]>;
  createNavigation(params: ContentNavigationCreateParams): Promise<ContentNavigation>;
  updateNavigation(id: string, params: ContentNavigationUpdateParams): Promise<ContentNavigation>;
  deleteNavigation(id: string): Promise<boolean>;

  // Navigation Item methods
  findNavigationItemById(id: string): Promise<ContentNavigationItem | null>;
  findNavigationItems(navigationId: string, parentId?: string): Promise<ContentNavigationItem[]>;
  findAllNavigationItems(navigationId: string): Promise<ContentNavigationItem[]>;
  createNavigationItem(params: ContentNavigationItemCreateParams): Promise<ContentNavigationItem>;
  updateNavigationItem(id: string, params: ContentNavigationItemUpdateParams): Promise<ContentNavigationItem>;
  deleteNavigationItem(id: string): Promise<boolean>;
  reorderNavigationItems(navigationId: string, itemOrders: Array<{ id: string; order: number }>): Promise<void>;
}
