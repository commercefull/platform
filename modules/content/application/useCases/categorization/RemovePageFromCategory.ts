/**
 * Remove Page from Category Use Case
 * Removes a page/category link and emits an uncategorized event
 */

import { eventBus } from '../../../../../libs/events/eventBus';
import { CategorizationNotFoundError } from '../../../domain/errors/ContentErrors';
import type { CategorizationWritePort } from './ports';

// ============================================================================
// Command
// ============================================================================

export class RemovePageFromCategoryCommand {
  constructor(
    public readonly pageId: string,
    public readonly categoryId: string,
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class RemovePageFromCategoryUseCase {
  constructor(private readonly categorizationRepo: CategorizationWritePort) {}

  async execute(command: RemovePageFromCategoryCommand): Promise<void> {
    const deleted = await this.categorizationRepo.deleteCategorizationByPageAndCategory(command.pageId, command.categoryId);
    if (!deleted) {
      throw new CategorizationNotFoundError();
    }

    eventBus.emit('content.page.uncategorized', {
      pageId: command.pageId,
      categoryId: command.categoryId,
    });
  }
}
