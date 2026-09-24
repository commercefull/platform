import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';

export interface GetProductAttributesQuery {
  productId: string;
}

export interface ProductAttributeWithValue {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  attributeType: string;
  value?: string;
  displayValue?: string;
  isFilterable: boolean;
  isSearchable: boolean;
}

export interface GetProductAttributesResponse {
  success: boolean;
  data?: ProductAttributeWithValue[];
  error?: string;
}

export class GetProductAttributesUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(query: GetProductAttributesQuery): Promise<GetProductAttributesResponse> {
    try {
      const attributes = await this.attributeRepository.getProductAttributes(query.productId);

      const result: ProductAttributeWithValue[] = attributes.map(attr => ({
        attributeId: attr.attributeId,
        attributeCode: attr.attribute.code,
        attributeName: attr.attribute.name,
        attributeType: attr.attribute.type,
        value: attr.value,
        isFilterable: attr.attribute.isFilterable,
        isSearchable: attr.attribute.isSearchable,
      }));

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product attributes: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Remove Product Attribute ====================

