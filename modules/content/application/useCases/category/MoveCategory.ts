/**
 * Move Category Use Case
 * Moves a category to a new parent in the hierarchy
 */

import { ContentCategoryRepo } from '../../../repos/contentCategoryRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class MoveCategoryCommand {
  constructor(
    public readonly categoryId: string,
    public readonly newParentId: string | null,
    public readonly movedBy?: string
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
      throw new Error('Category ID is required');
    }

    // Verify category exists
    const category = await this.categoryRepo.findCategoryById(command.categoryId);
    if (!category) {
      throw new Error(`Category with ID ${command.categoryId} not found`);
    }

    // Verify new parent exists if provided
    if (command.newParentId) {
      const newParent = await this.categoryRepo.findCategoryById(command.newParentId);
      if (!newParent) {
        throw new Error(`Parent category with ID ${command.newParentId} not found`);
      }

      // Prevent circular reference
      if (command.newParentId === command.categoryId) {
        throw new Error('Cannot move category to itself');
      }

      // Check if new parent is a descendant of the category
      if (newParent.path && category.path && newParent.path.startsWith(category.path)) {
        throw new Error('Cannot move category to its own descendant');
      }
    }

    const updatedCategory = await this.categoryRepo.moveCategory(
      command.categoryId,
      command.newParentId
    );

    eventBus.emit('content.category.updated', {
      categoryId: updatedCategory.contentCategoryId,
      name: updatedCategory.name,
      slug: updatedCategory.slug
    });

    return {
      id: updatedCategory.contentCategoryId,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      parentId: updatedCategory.parentId ?? undefined,
      path: updatedCategory.path ?? undefined,
      depth: updatedCategory.depth
    };
  }
}
