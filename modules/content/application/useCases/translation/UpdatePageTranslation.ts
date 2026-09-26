/**
 * Update Page Translation Use Case
 * Updates a page translation and emits an update event
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { PageTranslationNotFoundError } from '../../../domain/errors/ContentErrors';
import type { PageTranslationRecord, PageTranslationUpdateParams, PageTranslationWritePort } from './ports';

// ============================================================================
// Command
// ============================================================================

export class UpdatePageTranslationCommand {
  constructor(
    public readonly translationId: string,
    public readonly updates: PageTranslationUpdateParams,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdatePageTranslationUseCase {
  constructor(private readonly translationRepo: PageTranslationWritePort) {}

  async execute(command: UpdatePageTranslationCommand): Promise<PageTranslationRecord> {
    const existing = await this.translationRepo.findTranslationById(command.translationId);
    if (!existing) {
      throw new PageTranslationNotFoundError(command.translationId);
    }

    const updated = await this.translationRepo.updateTranslation(command.translationId, command.updates);

    eventBus.emit('content.page.translation_updated', {
      translationId: command.translationId,
      pageId: existing.contentPageId,
    });

    return updated;
  }
}
