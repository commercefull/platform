/**
 * Restore Page Version Use Case
 * Restores a content page's title/status/summary/customFields from a version snapshot
 */

import type { IContentRepository } from '../../../domain/repositories/ContentRepository';
import type { ContentPageRecord as ContentPage } from '../../../domain/entities/ContentModel';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import { NotFoundError } from '../../../../../libs/errors';

// ============================================================================
// Ports
// ============================================================================

export interface PageVersionSnapshot {
  contentPageVersionId: string;
  contentPageId: string;
  version: number;
  title: string;
  status: string;
  summary: string | null;
  customFields: unknown | null;
}

export interface PageVersionReadPort {
  findVersionById(id: string): Promise<PageVersionSnapshot | null>;
}

// ============================================================================
// Command
// ============================================================================

export class RestorePageVersionCommand {
  constructor(
    public readonly pageId: string,
    public readonly versionId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class RestorePageVersionUseCase {
  constructor(
    private readonly contentRepo: IContentRepository,
    private readonly pageVersionRepo: PageVersionReadPort,
  ) {}

  async execute(command: RestorePageVersionCommand): Promise<{ restoredPage: ContentPage; version: number }> {
    if (!command.pageId || !command.versionId) {
      throw new ContentValidationError('Page ID and version ID are required');
    }

    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    const version = await this.pageVersionRepo.findVersionById(command.versionId);
    if (!version || version.contentPageId !== command.pageId) {
      throw new NotFoundError(`Version with ID ${command.versionId} not found for page ${command.pageId}`);
    }

    const restoredPage = await this.contentRepo.updatePage(command.pageId, {
      title: version.title,
      status: version.status,
      summary: version.summary ?? undefined,
      customFields: (version.customFields as Record<string, unknown>) || undefined,
    });

    eventBus.emit('content.page.version_restored', {
      pageId: command.pageId,
      versionId: command.versionId,
      version: version.version,
    });

    return { restoredPage, version: version.version };
  }
}
