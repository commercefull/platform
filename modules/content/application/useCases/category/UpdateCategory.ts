/**
 * Update Category Use Case
 * Updates a content category and emits an update event
 */

import type { IContentCategoryRepository } from '../../../domain/repositories/ContentCategoryRepository';
import type { ContentCategory } from '../../../domain/entities/ContentModel';
import { eventBus } from '../../../../../libs/events/eventBus';
import { CategoryNotFoundError } from '../../../domain/errors/ContentErrors';

// ============================================================================
// Command
// ============================================================================

export class UpdateCategoryCommand {
  constructor(
    public readonly categoryId: string,
    public readonly updates: {
      name?: string;
      slug?: string;
      description?: string;
      featuredImage?: string;
      metaTitle?: string;
      metaDescription?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {}
}

// ============================================================================
// Use Case
// ============================================================================

export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepo: IContentCategoryRepository) {}

  async execute(command: UpdateCategoryCommand): Promise<ContentCategory> {
    const existing = await this.categoryRepo.findCategoryById(command.categoryId);
    if (!existing) {
      throw new CategoryNotFoundError(command.categoryId);
    }

    const updated = await this.categoryRepo.updateCategory(command.categoryId, command.updates);

    eventBus.emit('content.category.updated', {
      categoryId: command.categoryId,
      name: updated.name,
      slug: updated.slug,
    });

    return updated;
  }
}
