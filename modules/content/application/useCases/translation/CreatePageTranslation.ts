/**
 * Create Page Translation Use Case
 * Creates a translated version of a content page for a locale
 */

import type { IContentRepository } from '../../../domain/repositories/ContentRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import type { PageTranslationCreateParams, PageTranslationRecord, PageTranslationWritePort } from './ports';

// ============================================================================
// Command
// ============================================================================

export class CreatePageTranslationCommand {
  constructor(
    public readonly pageId: string,
    public readonly localeId: string,
    public readonly title: string,
    public readonly fields?: Omit<PageTranslationCreateParams, 'contentPageId' | 'localeId' | 'title'>,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class CreatePageTranslationUseCase {
  constructor(
    private readonly contentRepo: IContentRepository,
    private readonly translationRepo: PageTranslationWritePort,
  ) {}

  async execute(command: CreatePageTranslationCommand): Promise<PageTranslationRecord> {
    if (!command.localeId || !command.title) {
      throw new ContentValidationError('Locale ID and title are required');
    }

    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    const translation = await this.translationRepo.createTranslation({
      ...command.fields,
      contentPageId: command.pageId,
      localeId: command.localeId,
      title: command.title,
    });

    eventBus.emit('content.page.translation_created', {
      pageId: command.pageId,
      translationId: translation.contentPageTranslationId,
      localeId: command.localeId,
    });

    return translation;
  }
}
