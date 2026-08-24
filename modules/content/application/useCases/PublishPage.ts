/**
 * Publish Page Use Case
 * Publishes a content page
 */

import type { ContentRepo } from '../../infrastructure/repositories/contentRepo';
import { eventBus } from '../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';

// ============================================================================
// Command
// ============================================================================

export class PublishPageCommand {
  constructor(
    public readonly pageId: string,
    public readonly publishedBy?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface PublishPageResponse {
  contentPageId: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: Date | null;
}

// ============================================================================
// Use Case
// ============================================================================

export class PublishPageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: PublishPageCommand): Promise<PublishPageResponse> {
    // Validate command
    if (!command.pageId) {
      throw new ContentValidationError('Page ID is required');
    }

    // Get existing page
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    // Check if already published
    if (page.status === 'published') {
      throw new ContentValidationError('Page is already published');
    }

    // Update page status to published
    const now = new Date();
    const updatedPage = await this.contentRepo.updatePage(command.pageId, {
      status: 'published',
      publishedAt: now,
    });

    // Emit event
    eventBus.emit('content.page.published', {
      pageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      publishedAt: now,
      publishedBy: command.publishedBy,
    });

    return {
      contentPageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      publishedAt: updatedPage.publishedAt,
    };
  }
}
