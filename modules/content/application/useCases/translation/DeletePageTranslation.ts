/**
 * Delete Page Translation Use Case
 * Deletes a page translation and emits a deletion event
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { PageTranslationNotFoundError } from '../../../domain/errors/ContentErrors';
import type { PageTranslationWritePort } from './ports';

// ============================================================================
// Use Case
// ============================================================================

export class DeletePageTranslationUseCase {
  constructor(private readonly translationRepo: PageTranslationWritePort) {}

  async execute(translationId: string): Promise<void> {
    const existing = await this.translationRepo.findTranslationById(translationId);
    if (!existing) {
      throw new PageTranslationNotFoundError(translationId);
    }

    await this.translationRepo.deleteTranslation(translationId);

    eventBus.emit('content.page.translation_deleted', {
      translationId,
      pageId: existing.contentPageId,
    });
  }
}
