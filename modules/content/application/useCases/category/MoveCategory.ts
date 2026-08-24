/**
 * Move Category Use Case
 * Moves a category to a new parent in the hierarchy
 */

import type { ContentCategoryRepo } from '../../../infrastructure/repositories/contentCategoryRepo';
import { eventBus } from '../../../../../libs/events/eventBus';
import { CategoryNotFoundError, ContentValidationError } from '../../../domain/errors/ContentErrors';

export class MoveCategoryCommand {
  constructor(
    public readonly categoryId: string,
    public readonly newParentId: string | null,
    public readonly movedBy?: string,
  ) {}
}

export interface MoveCategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  path?: string;
  depth: number;
}

export class MoveCategoryUseCase {
  constructor(private readonly categoryRepo: ContentCategoryRepo) {}

  async execute(command: MoveCategoryCommand): Promise<MoveCategoryResponse> {
    if (!command.categoryId) {
      throw new ContentValidationError('Category ID is required');
    }

    // Verify category exists
    const category = await this.categoryRepo.findCategoryById(command.categoryId);
    if (!category) {
      throw new CategoryNotFoundError(command.categoryId);
    }

    // Verify new parent exists if provided
    if (command.newParentId) {
      const newParent = await this.categoryRepo.findCategoryById(command.newParentId);
      if (!newParent) {
        throw new CategoryNotFoundError(command.newParentId);
      }

      // Prevent circular reference
      if (command.newParentId === command.categoryId) {
        throw new ContentValidationError('Cannot move category to itself');
      }

      // Check if new parent is a descendant of the category
      if (newParent.path && category.path && newParent.path.startsWith(category.path)) {
        throw new ContentValidationError('Cannot move category to its own descendant');
      }
    }

    const updatedCategory = await this.categoryRepo.moveCategory(command.categoryId, command.newParentId);

    eventBus.emit('content.category.updated', {
      categoryId: updatedCategory.contentCategoryId,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
    });

    return {
      id: updatedCategory.contentCategoryId,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      parentId: updatedCategory.parentId ?? undefined,
      path: updatedCategory.path ?? undefined,
      depth: updatedCategory.depth,
    };
  }
}
