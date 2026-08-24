import categoryRepo from '../../infrastructure/repositories/categoryRepo';
import type { Category, CategoryCreateProps, CategoryUpdateProps } from '../../infrastructure/repositories/categoryRepo';

export class ManageCategoriesUseCase {
  async findOne(id: string): Promise<Category | null> {
    return categoryRepo.findOne(id);
  }
  async findBySlug(slug: string): Promise<Category | null> {
    return categoryRepo.findBySlug(slug);
  }
  async findAll(): Promise<Category[]> {
    return categoryRepo.findAll();
  }
  async findActive(): Promise<Category[]> {
    return categoryRepo.findActive();
  }
  async findChildren(parentId: string): Promise<Category[]> {
    return categoryRepo.findChildren(parentId);
  }
  async findForMenu(): Promise<Category[]> {
    return categoryRepo.findForMenu();
  }
  async create(props: CategoryCreateProps): Promise<Category> {
    return categoryRepo.create(props);
  }
  async update(id: string, props: CategoryUpdateProps): Promise<Category | null> {
    return categoryRepo.update(id, props);
  }
  async delete(id: string): Promise<void> {
    await categoryRepo.delete(id);
  }
  async reorder(categories: Array<{ categoryId: string; position: number }>): Promise<void> {
    for (const cat of categories) {
      await categoryRepo.update(cat.categoryId, { position: cat.position });
    }
  }
}
