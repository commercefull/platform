/**
 * Delete Category Use Case
 * Deletes a content category and emits a deletion event
 */

import type { IContentCategoryRepository } from '../../../domain/repositories/ContentCategoryRepository';
import { eventBus } from '../../../../../libs/events/eventBus';
import { CategoryNotFoundError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Use Case
// ============================================================================

export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepo: IContentCategoryRepository) {}

  async execute(categoryId: string): Promise<void> {
    const existing = await this.categoryRepo.findCategoryById(categoryId);
    if (!existing) {
      throw new CategoryNotFoundError(categoryId);
    }

    await this.categoryRepo.deleteCategory(categoryId);

    eventBus.emit('content.category.deleted', { categoryId, name: existing.name });
  }
}
