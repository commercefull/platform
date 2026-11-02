/**
 * Update Page Use Case
 * Updates an existing content page
 */

import type { IContentRepository } from '../../domain/repositories/ContentRepository';
import { eventBus } from '../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../domain/errors/ContentErrors';
export interface UpdatePageCommandProps {
  pageId: string;
  title?: string;
  slug?: string;
  templateId?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  visibility?: 'public' | 'private' | 'passwordProtected';
  summary?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  customFields?: Record<string, unknown>;
  publishedAt?: string;
  scheduledAt?: string;
  isHomePage?: boolean;
  updatedBy?: string;
}

// ============================================================================
// Command
// ============================================================================

export class UpdatePageCommand {
  public readonly pageId: string;
  public readonly title?: string;
  public readonly slug?: string;
  public readonly templateId?: string;
  public readonly status?: 'draft' | 'published' | 'scheduled' | 'archived';
  public readonly visibility?: 'public' | 'private' | 'passwordProtected';
  public readonly summary?: string;
  public readonly featuredImage?: string;
  public readonly metaTitle?: string;
  public readonly metaDescription?: string;
  public readonly metaKeywords?: string;
  public readonly customFields?: Record<string, unknown>;
  public readonly publishedAt?: string;
  public readonly scheduledAt?: string;
  public readonly isHomePage?: boolean;
  public readonly updatedBy?: string;

  constructor(props: UpdatePageCommandProps) {
    this.pageId = props.pageId;
    this.title = props.title;
    this.slug = props.slug;
    this.templateId = props.templateId;
    this.status = props.status;
    this.visibility = props.visibility;
    this.summary = props.summary;
    this.featuredImage = props.featuredImage;
    this.metaTitle = props.metaTitle;
    this.metaDescription = props.metaDescription;
    this.metaKeywords = props.metaKeywords;
    this.customFields = props.customFields;
    this.publishedAt = props.publishedAt;
    this.scheduledAt = props.scheduledAt;
    this.isHomePage = props.isHomePage;
    this.updatedBy = props.updatedBy;
  }
}

// ============================================================================
// Response
// ============================================================================

export interface UpdatePageResponse {
  contentPageId: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: Date;
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdatePageUseCase {
  constructor(private readonly contentRepo: IContentRepository) {}

  async execute(command: UpdatePageCommand): Promise<UpdatePageResponse> {
    // Validate command
    if (!command.pageId) {
      throw new ContentValidationError('Page ID is required');
    }

    // Get existing page
    const existingPage = await this.contentRepo.findPageById(command.pageId);
    if (!existingPage) {
      throw new ContentPageNotFoundError(command.pageId);
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
      publishedAt: command.publishedAt ? new Date(command.publishedAt) : undefined,
      scheduledAt: command.scheduledAt ? new Date(command.scheduledAt) : undefined,
      isHomePage: command.isHomePage,
    });

    // Emit event
    eventBus.emit('content.page.updated', {
      pageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      updatedBy: command.updatedBy,
      changes,
    });

    return {
      contentPageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      updatedAt: updatedPage.updatedAt,
    };
  }
}
