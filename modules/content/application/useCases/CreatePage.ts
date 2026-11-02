/**
 * Create Page Use Case
 * Creates a new content page
 */

import type { IContentRepository } from '../../domain/repositories/ContentRepository';
import type { ContentPage } from '../../../../libs/db/types';
import { eventBus } from '../../../../libs/events/eventBus';
import { ContentTypeNotFoundError, ContentTemplateNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';
export interface CreatePageCommandProps {
  title: string;
  slug: string;
  contentTypeId: string;
  templateId?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  visibility?: 'public' | 'private' | 'passwordProtected';
  summary?: string;
  featuredImage?: string;
  parentId?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  customFields?: Record<string, unknown>;
  publishedAt?: string;
  scheduledAt?: string;
  isHomePage?: boolean;
  createdBy?: string;
}

// ============================================================================
// Command
// ============================================================================

export class CreatePageCommand {
  public readonly title: string;
  public readonly slug: string;
  public readonly contentTypeId: string;
  public readonly templateId?: string;
  public readonly status: 'draft' | 'published' | 'scheduled' | 'archived';
  public readonly visibility: 'public' | 'private' | 'passwordProtected';
  public readonly summary?: string;
  public readonly featuredImage?: string;
  public readonly parentId?: string;
  public readonly metaTitle?: string;
  public readonly metaDescription?: string;
  public readonly metaKeywords?: string;
  public readonly customFields?: Record<string, unknown>;
  public readonly publishedAt?: string;
  public readonly scheduledAt?: string;
  public readonly isHomePage?: boolean;
  public readonly createdBy?: string;

  constructor(props: CreatePageCommandProps) {
    this.title = props.title;
    this.slug = props.slug;
    this.contentTypeId = props.contentTypeId;
    this.templateId = props.templateId;
    this.status = props.status ?? 'draft';
    this.visibility = props.visibility ?? 'public';
    this.summary = props.summary;
    this.featuredImage = props.featuredImage;
    this.parentId = props.parentId;
    this.metaTitle = props.metaTitle;
    this.metaDescription = props.metaDescription;
    this.metaKeywords = props.metaKeywords;
    this.customFields = props.customFields;
    this.publishedAt = props.publishedAt;
    this.scheduledAt = props.scheduledAt;
    this.isHomePage = props.isHomePage;
    this.createdBy = props.createdBy;
  }
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
  constructor(private readonly contentRepo: IContentRepository) {}

  async execute(command: CreatePageCommand): Promise<PageResponse> {
    // Validate command
    if (!command.title || !command.slug) {
      throw new ContentValidationError('Title and slug are required');
    }

    if (!command.contentTypeId) {
      throw new ContentValidationError('Content type ID is required');
    }

    // Verify content type exists
    const contentType = await this.contentRepo.findContentTypeById(command.contentTypeId);
    if (!contentType) {
      throw new ContentTypeNotFoundError(command.contentTypeId);
    }

    // Verify template exists if provided
    if (command.templateId) {
      const template = await this.contentRepo.findTemplateById(command.templateId);
      if (!template) {
        throw new ContentTemplateNotFoundError(command.templateId);
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
