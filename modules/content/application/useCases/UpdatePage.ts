/**
 * Update Page Use Case
 * Updates an existing content page
 */

import { ContentRepo } from '../../repos/contentRepo';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class UpdatePageCommand {
  constructor(
    public readonly pageId: string,
    public readonly title?: string,
    public readonly slug?: string,
    public readonly templateId?: string,
    public readonly status?: 'draft' | 'published' | 'scheduled' | 'archived',
    public readonly visibility?: 'public' | 'private' | 'password_protected',
    public readonly summary?: string,
    public readonly featuredImage?: string,
    public readonly metaTitle?: string,
    public readonly metaDescription?: string,
    public readonly metaKeywords?: string,
    public readonly customFields?: Record<string, any>,
    public readonly publishedAt?: string,
    public readonly scheduledAt?: string,
    public readonly isHomePage?: boolean,
    public readonly updatedBy?: string
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UpdatePageResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdatePageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: UpdatePageCommand): Promise<UpdatePageResponse> {
    // Validate command
    if (!command.pageId) {
      throw new Error('Page ID is required');
    }

    // Get existing page
    const existingPage = await this.contentRepo.findPageById(command.pageId);
    if (!existingPage) {
      throw new Error(`Page with ID ${command.pageId} not found`);
    }

    // Track changes for event
    const changes: string[] = [];
    if (command.title && command.title !== existingPage.title) changes.push('title');
    if (command.slug && command.slug !== existingPage.slug) changes.push('slug');
    if (command.status && command.status !== existingPage.status) changes.push('status');
    if (command.summary !== undefined) changes.push('summary');
    if (command.metaTitle !== undefined) changes.push('metaTitle');
    if (command.metaDescription !== undefined) changes.push('metaDescription');

    // Update page
    const updatedPage = await this.contentRepo.updatePage(command.pageId, {
      title: command.title,
      slug: command.slug,
      templateId: command.templateId,
      status: command.status,
      visibility: command.visibility,
      summary: command.summary,
      featuredImage: command.featuredImage,
      metaTitle: command.metaTitle,
      metaDescription: command.metaDescription,
      metaKeywords: command.metaKeywords,
      customFields: command.customFields,
      publishedAt: command.publishedAt,
      scheduledAt: command.scheduledAt,
      isHomePage: command.isHomePage
    });

    // Emit event
    eventBus.emit('content.page.updated', {
      pageId: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      updatedBy: command.updatedBy,
      changes
    });

    return {
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      updatedAt: updatedPage.updatedAt
    };
  }
}
