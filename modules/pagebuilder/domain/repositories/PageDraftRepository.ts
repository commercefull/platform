/**
 * Page Builder Repository Port
 */

import { PageDraft } from '../entities/PageDraft';

export interface PageDraftRepository {
  findById(draftId: string): Promise<PageDraft | null>;
  findByPageId(pageId: string): Promise<PageDraft | null>;
  findByStore(storeId: string): Promise<PageDraft[]>;
  findByOrganization(organizationId: string): Promise<PageDraft[]>;
  findBySlug(slug: string, storeId: string): Promise<PageDraft | null>;

  save(draft: PageDraft): Promise<PageDraft>;
  delete(draftId: string): Promise<boolean>;

  /**
   * Find published drafts for a store (for storefront rendering).
   */
  findPublishedByStore(storeId: string): Promise<PageDraft[]>;

  /**
   * Find a specific published page by slug for storefront rendering.
   */
  findPublishedBySlug(slug: string, storeId: string): Promise<PageDraft | null>;
}
