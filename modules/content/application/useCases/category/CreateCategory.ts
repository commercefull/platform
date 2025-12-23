/**
 * Create Category Use Case
 * Creates a new content category with hierarchy support
 */

import { ContentCategoryRepo } from '../../../repos/contentCategoryRepo';
import { eventBus } from '../../../../../libs/events/eventBus';

export class CreateCategoryCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly parentId?: string,
    public readonly description?: string,
    public readonly featuredImage?: string,
    public readonly metaTitle?: string,
    public readonly metaDescription?: string,
    public readonly sortOrder?: number,
    public readonly isActive?: boolean,
  ) {}
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  path?: string;
  depth: number;
  isActive: boolean;
  createdAt: string;
}

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepo: ContentCategoryRepo) {}

  async execute(command: CreateCategoryCommand): Promise<CategoryResponse> {
    if (!command.name || !command.slug) {
      throw new Error('Name and slug are required');
    }

    // Verify parent exists if provided
    if (command.parentId) {
      const parent = await this.categoryRepo.findCategoryById(command.parentId);
      if (!parent) {
        throw new Error(`Parent category with ID ${command.parentId} not found`);
      }
    }

    const category = await this.categoryRepo.createCategory({
      name: command.name,
      slug: command.slug,
      parentId: command.parentId ?? null,
      description: command.description ?? null,
      featuredImage: command.featuredImage ?? null,
      metaTitle: command.metaTitle ?? null,
      metaDescription: command.metaDescription ?? null,
      sortOrder: command.sortOrder || 0,
      isActive: command.isActive !== undefined ? command.isActive : true,
      depth: 0,
      path: command.slug,
    });

    eventBus.emit('content.category.created', {
      categoryId: category.contentCategoryId,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
    });

    return {
      id: category.contentCategoryId,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? undefined,
      path: category.path ?? undefined,
      depth: category.depth,
      isActive: category.isActive,
      createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : String(category.createdAt),
    };
  }
}
