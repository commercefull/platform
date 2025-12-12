/**
 * Schedule Page Use Case
 * Schedules a page for future publication
 */

import { ContentRepo } from '../../../repos/contentRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class SchedulePageCommand {
  constructor(
    public readonly pageId: string,
    public readonly scheduledAt: Date,
    public readonly scheduledBy?: string
  ) {}
}

export interface SchedulePageResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  scheduledAt: string;
}

export class SchedulePageUseCase {
  constructor(private readonly contentRepo: ContentRepo) {}

  async execute(command: SchedulePageCommand): Promise<SchedulePageResponse> {
    if (!command.pageId || !command.scheduledAt) {
      throw new Error('Page ID and scheduled date are required');
    }

    // Validate scheduled date is in the future
    const now = new Date();
    if (command.scheduledAt <= now) {
      throw new Error('Scheduled date must be in the future');
    }

    // Get existing page
    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new Error(`Page with ID ${command.pageId} not found`);
    }

    // Cannot schedule already published pages
    if (page.status === 'published') {
      throw new Error('Cannot schedule an already published page');
    }

    // Update page status to scheduled
    const scheduledAtStr = command.scheduledAt.toISOString();
    const updatedPage = await this.contentRepo.updatePage(command.pageId, {
      status: 'scheduled',
      scheduledAt: scheduledAtStr
    });

    eventBus.emit('content.page.updated', {
      pageId: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      updatedBy: command.scheduledBy,
      changes: ['status', 'scheduledAt']
    });

    return {
      id: updatedPage.id,
      title: updatedPage.title,
      slug: updatedPage.slug,
      status: updatedPage.status,
      scheduledAt: scheduledAtStr
    };
  }
}
