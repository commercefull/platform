/**
 * Unpublish Page Use Case
 * Reverts a content page to draft status
 */

import type { IContentRepository } from '../../../domain/repositories/ContentRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Command
// ============================================================================

export class UnpublishPageCommand {
  constructor(public readonly pageId: string) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UnpublishPageResponse {
  contentPageId: string;
  title: string;
  slug: string;
  status: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UnpublishPageUseCase {
  constructor(private readonly contentRepo: IContentRepository) {}

  async execute(command: UnpublishPageCommand): Promise<UnpublishPageResponse> {
    if (!command.pageId) {
      throw new ContentValidationError('Page ID is required');
    }

    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    const updatedPage = await this.contentRepo.updatePage(command.pageId, { status: 'draft' });

    eventBus.emit('content.page.unpublished', {
      pageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
    });

    return {
      contentPageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
    };
  }
}
