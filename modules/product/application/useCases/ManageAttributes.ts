import type {
  DynamicAttributePort,
  ProductAttribute,
  ProductAttributeValue,
} from '../../domain/repositories/ProductCatalogPorts';

export class ManageAttributesUseCase {
  constructor(private readonly attributes: DynamicAttributePort) {}

  async list(options?: { groupId?: string; searchable?: boolean; filterable?: boolean; variant?: boolean }): Promise<ProductAttribute[]> {
    if (options?.groupId) {
      return this.attributes.findAttributesByGroup(options.groupId);
    }
    if (options?.searchable) {
      return this.attributes.findSearchableAttributes();
    }
    if (options?.filterable) {
      return this.attributes.findFilterableAttributes();
    }
    if (options?.variant) {
      return this.attributes.findVariantAttributes();
    }
    return this.attributes.findAllAttributes();
  }

  async findById(id: string): Promise<ProductAttribute | null> {
    return this.attributes.findAttributeById(id);
  }

  async findByCode(code: string): Promise<ProductAttribute | null> {
    return this.attributes.findAttributeByCode(code);
  }

  async findValues(attributeId: string): Promise<ProductAttributeValue[]> {
    return this.attributes.findAttributeValues(attributeId);
  }

  async delete(id: string): Promise<boolean> {
    return this.attributes.deleteAttribute(id);
  }
}
