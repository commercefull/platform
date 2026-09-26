/**
 * Assign Page to Category Use Case
 * Links a page to a category after verifying both exist
 */

import type { IContentRepository } from '../../../domain/repositories/ContentRepository';
import type { IContentCategoryRepository } from '../../../domain/repositories/ContentCategoryRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { ContentPageNotFoundError, CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';
import type { CategorizationRecord, CategorizationWritePort } from './ports';

// ============================================================================
// Command
// ============================================================================

export class AssignPageToCategoryCommand {
  constructor(
    public readonly pageId: string,
    public readonly categoryId: string,
    public readonly isPrimary?: boolean,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class AssignPageToCategoryUseCase {
  constructor(
    private readonly contentRepo: IContentRepository,
    private readonly categoryRepo: IContentCategoryRepository,
    private readonly categorizationRepo: CategorizationWritePort,
  ) {}

  async execute(command: AssignPageToCategoryCommand): Promise<CategorizationRecord> {
    if (!command.categoryId) {
      throw new ContentValidationError('Category ID is required');
    }

    const page = await this.contentRepo.findPageById(command.pageId);
    if (!page) {
      throw new ContentPageNotFoundError(command.pageId);
    }

    const category = await this.categoryRepo.findCategoryById(command.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(command.categoryId);
    }

    const categorization = await this.categorizationRepo.createCategorization({
      contentPageId: command.pageId,
      categoryId: command.categoryId,
      isPrimary: command.isPrimary || false,
    });

    eventBus.emit('content.page.categorized', {
      pageId: command.pageId,
      categoryId: command.categoryId,
      isPrimary: categorization.isPrimary,
    });

    return categorization;
  }
}
