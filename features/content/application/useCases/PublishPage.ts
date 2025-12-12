/**
 * Publish Page Use Case
 * Publishes a content page
 */

import { ContentRepo } from '../../repos/contentRepo';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class PublishPageCommand {
  constructor(
    public readonly pageId: string,
    public readonly publishedBy?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface PublishPageResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class PublishPageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: PublishPageCommand): Promise<PublishPageResponse> {
    // Validate command
    if (!command.pageId) {
      throw new Error('Page ID is required');
    }

    // Get existing page
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new Error(`Page with ID ${command.pageId} not found`);
    }

    // Check if already published
    if (page.status === 'published') {
      throw new Error('Page is already published');
    }

    // Update page status to published
    const now = new Date().toISOString();
    const updatedPage = await this.contentRepo.updatePage(command.pageId, {
      status: 'published',
      publishedAt: now
    });

    // Emit event
    eventBus.emit('content.page.published', {
      pageId: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      publishedAt: now,
      publishedBy: command.publishedBy
    });

    return {
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      publishedAt: updatedPage.publishedAt || now
    };
  }
}
