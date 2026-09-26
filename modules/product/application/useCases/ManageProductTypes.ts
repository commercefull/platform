import type { ProductTypeCreateInput, ProductTypePort, ProductTypeUpdateInput } from '../../domain/repositories/ProductCatalogPorts';
import {
  ProductTypeNotFoundError,
  ProductTypeSlugAlreadyExistsError,
  ProductValidationError,
} from '../../domain/errors/ProductErrors';

interface AttributeSetLookupPort {
  findByProductType(productTypeId: string): Promise<unknown[]>;
  getAttributesForProductType(productTypeId: string): Promise<unknown[]>;
}

export class ManageProductTypesUseCase {
  constructor(
    private readonly productTypeRepo: ProductTypePort & { findActive(): Promise<unknown[]> },
    private readonly attributeSetRepo: AttributeSetLookupPort,
  ) {}

  async list(activeOnly?: boolean) {
    if (activeOnly) {
      return this.productTypeRepo.findActive();
    }
    return this.productTypeRepo.findAll();
  }

  async getById(id: string) {
    const productType = await this.productTypeRepo.findById(id);
    if (!productType) {
      throw new ProductTypeNotFoundError(id);
    }
    return productType;
  }

  async getByIdWithAttributeSets(id: string) {
    const productType = await this.getById(id);
    const attributeSets = await this.attributeSetRepo.findByProductType(id);
    return { ...productType, attributeSets };
  }

  async getBySlug(slug: string) {
    const productType = await this.productTypeRepo.findBySlug(slug);
    if (!productType) {
      throw new ProductTypeNotFoundError(slug);
    }
    return productType;
  }

  async create(input: { name?: string; slug?: string } & Omit<ProductTypeCreateInput, 'name' | 'slug'>) {
    if (!input.name) {
      throw new ProductValidationError('Name is required');
    }
    const checkSlug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await this.productTypeRepo.findBySlug(checkSlug);
    if (existing) {
      throw new ProductTypeSlugAlreadyExistsError(checkSlug);
    }
    return this.productTypeRepo.create({ ...input, name: input.name });
  }

  async update(id: string, input: ProductTypeUpdateInput) {
    const existing = await this.getById(id);
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await this.productTypeRepo.findBySlug(input.slug);
      if (slugExists) {
        throw new ProductTypeSlugAlreadyExistsError(input.slug);
      }
    }
    return this.productTypeRepo.update(id, input);
  }

  async delete(id: string) {
    await this.getById(id);
    await this.productTypeRepo.delete(id);
  }

  async getAttributes(id: string) {
    await this.getById(id);
    return this.attributeSetRepo.getAttributesForProductType(id);
  }
}
