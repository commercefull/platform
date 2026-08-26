import type { CategoryRow, CategoryCreateProps, CategoryUpdateProps, CategoryPort } from '../../domain/repositories/ProductCatalogPorts';

export class ManageCategoriesUseCase {
  constructor(private readonly categoryRepo: CategoryPort) {}

  async findOne(id: string): Promise<CategoryRow | null> {
    return this.categoryRepo.findOne(id);
  }
  async findBySlug(slug: string): Promise<CategoryRow | null> {
    return this.categoryRepo.findBySlug(slug);
  }
  async findAll(): Promise<CategoryRow[]> {
    return this.categoryRepo.findAll();
  }
  async findActive(): Promise<CategoryRow[]> {
    return this.categoryRepo.findActive();
  }
  async findChildren(parentId: string): Promise<CategoryRow[]> {
    return this.categoryRepo.findChildren(parentId);
  }
  async findForMenu(): Promise<CategoryRow[]> {
    return this.categoryRepo.findForMenu();
  }
  async create(props: CategoryCreateProps): Promise<CategoryRow> {
    return this.categoryRepo.create(props);
  }
  async update(id: string, props: CategoryUpdateProps): Promise<CategoryRow | null> {
    return this.categoryRepo.update(id, props);
  }
  async delete(id: string): Promise<void> {
    await this.categoryRepo.delete(id);
  }
  async reorder(categories: Array<{ categoryId: string; position: number }>): Promise<void> {
    for (const cat of categories) {
      await this.categoryRepo.update(cat.categoryId, { position: cat.position });
    }
  }
}
