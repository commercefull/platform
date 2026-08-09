/**
 * Create Page Use Case
 * Creates a new content page
 */

import { ContentRepo } from '../../infrastructure/repositories/contentRepo';
import type { ContentPage } from '../../../../libs/db/types';
import { eventBus } from '../../../../libs/events/eventBus';

// ============================================================================
// Command
// ============================================================================

export class CreatePageCommand {
  constructor(
    public readonly title: string,
    public readonly slug: string,
    public readonly contentTypeId: string,
    public readonly templateId?: string,
    public readonly status: 'draft' | 'published' | 'scheduled' | 'archived' = 'draft',
    public readonly visibility: 'public' | 'private' | 'password_protected' = 'public',
    public readonly summary?: string,
    public readonly featuredImage?: string,
    public readonly parentId?: string,
    public readonly metaTitle?: string,
    public readonly metaDescription?: string,
    public readonly metaKeywords?: string,
    public readonly customFields?: Record<string, unknown>,
    public readonly publishedAt?: string,
    public readonly scheduledAt?: string,
    public readonly isHomePage?: boolean,
    public readonly createdBy?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface PageResponse {
  contentPageId: string;
  title: string;
  slug: string;
  contentTypeId: string;
  templateId?: string | null;
  status: string;
  visibility: string;
  summary?: string | null;
  isHomePage?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Use Case
// ============================================================================

export class CreatePageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: CreatePageCommand): Promise<PageResponse> {
    // Validate command
    if (!command.title || !command.slug) {
      throw new Error('Title and slug are required');
    }

    if (!command.contentTypeId) {
      throw new Error('Content type ID is required');
    }

    // Verify content type exists
    const contentType = await this.contentRepo.findContentTypeById(command.contentTypeId);
    if (!contentType) {
      throw new Error(`Content type with ID ${command.contentTypeId} not found`);
    }

    // Verify template exists if provided
    if (command.templateId) {
      const template = await this.contentRepo.findTemplateById(command.templateId);
      if (!template) {
        throw new Error(`Template with ID ${command.templateId} not found`);
      }
    }

    // Create page
    const page = await this.contentRepo.createPage({
      title: command.title,
      slug: command.slug,
      contentTypeId: command.contentTypeId,
      templateId: command.templateId,
      status: command.status,
      visibility: command.visibility,
      summary: command.summary,
      featuredImage: command.featuredImage,
      parentId: command.parentId,
      metaTitle: command.metaTitle,
      metaDescription: command.metaDescription,
      metaKeywords: command.metaKeywords,
      customFields: command.customFields,
      publishedAt: command.publishedAt ? new Date(command.publishedAt) : undefined,
      scheduledAt: command.scheduledAt ? new Date(command.scheduledAt) : undefined,
      isHomePage: command.isHomePage,
    });

    // Emit event
    eventBus.emit('content.page.created', {
      pageId: page.contentPageId,
      title: page.title,
      slug: page.slug,
      contentTypeId: page.contentTypeId,
      status: page.status,
      createdBy: command.createdBy,
    });

    return this.mapToResponse(page);
  }

  private mapToResponse(page: ContentPage): PageResponse {
    return {
      contentPageId: page.contentPageId,
      title: page.title,
      slug: page.slug,
      contentTypeId: page.contentTypeId,
      templateId: page.templateId,
      status: page.status,
      visibility: page.visibility,
      summary: page.summary,
      isHomePage: page.isHomePage,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
