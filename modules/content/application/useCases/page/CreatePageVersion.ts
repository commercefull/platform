/**
 * Create Page Version Use Case
 * Snapshots a content page's current state as a version record
 */

import type { IContentRepository } from '../../../domain/repositories/ContentRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Ports
// ============================================================================

export interface PageVersionRecord {
  contentPageVersionId: string;
  contentPageId: string;
  version: number;
  title: string;
  status: string;
}

export interface PageVersionWritePort {
  createVersion(params: {
    contentPageId: string;
    title: string;
    status: string;
    summary?: string;
    content?: Record<string, unknown>;
    customFields?: Record<string, unknown>;
    comment?: string;
    createdBy?: string | null;
  }): Promise<PageVersionRecord>;
}

// ============================================================================
// Command
// ============================================================================

export class CreatePageVersionCommand {
  constructor(
    public readonly pageId: string,
    public readonly comment?: string,
    public readonly createdBy?: string | null,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class CreatePageVersionUseCase {
  constructor(
    private readonly contentRepo: IContentRepository,
    private readonly pageVersionRepo: PageVersionWritePort,
  ) {}

  async execute(command: CreatePageVersionCommand): Promise<PageVersionRecord> {
    if (!command.pageId) {
      throw new ContentValidationError('Page ID is required');
    }

    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    const version = await this.pageVersionRepo.createVersion({
      contentPageId: command.pageId,
      title: page.title,
      status: page.status,
      summary: page.summary || undefined,
      content: (page.customFields as Record<string, unknown>) || undefined,
      customFields: (page.customFields as Record<string, unknown>) || undefined,
      comment: command.comment || `Version snapshot of "${page.title}"`,
      createdBy: command.createdBy ?? null,
    });

    eventBus.emit('content.page.version_created', {
      pageId: command.pageId,
      versionId: version.contentPageVersionId,
      version: version.version,
    });

    return version;
  }
}
