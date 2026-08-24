/**
 * Schedule Page Use Case
 * Schedules a page for future publication
 */

import type { ContentRepo } from '../../../infrastructure/repositories/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

export class SchedulePageCommand {
  constructor(
    public readonly pageId: string,
    public readonly scheduledAt: Date,
    public readonly scheduledBy?: string,
  ) {}
}

export interface SchedulePageResponse {
  contentPageId: string;
  title: string;
  slug: string;
  status: string;
  scheduledAt: Date | null;
}

export class SchedulePageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: SchedulePageCommand): Promise<SchedulePageResponse> {
    if (!command.pageId || !command.scheduledAt) {
      throw new ContentValidationError('Page ID and scheduled date are required');
    }

    // Validate scheduled date is in the future
    const now = new Date();
    if (command.scheduledAt <= now) {
      throw new ContentValidationError('Scheduled date must be in the future');
    }

    // Get existing page
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    // Cannot schedule already published pages
    if (page.status === 'published') {
      throw new ContentValidationError('Cannot schedule an already published page');
    }

    // Update page status to scheduled
    const updatedPage = await this.contentRepo.updatePage(command.pageId, {
      status: 'scheduled',
      scheduledAt: command.scheduledAt,
    });

    eventBus.emit('content.page.updated', {
      pageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      updatedBy: command.scheduledBy,
      changes: ['status', 'scheduledAt'],
    });

    return {
      contentPageId: updatedPage.contentPageId,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      scheduledAt: updatedPage.scheduledAt,
    };
  }
}
