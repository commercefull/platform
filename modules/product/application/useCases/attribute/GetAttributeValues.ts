import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type { ProductAttributeValue } from '../../../domain/repositories/ProductCatalogPorts';

export interface GetAttributeValuesQuery {
  attributeId: string;
}

export interface GetAttributeValuesResponse {
  success: boolean;
  data?: ProductAttributeValue[];
  error?: string;
}

export class GetAttributeValuesUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(query: GetAttributeValuesQuery): Promise<GetAttributeValuesResponse> {
    try {
      const values = await this.attributeRepository.findAttributeValues(query.attributeId);

      return {
        success: true,
        data: values,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get attribute values: ${(error as Error).message}`,
      };
    }
  }
}


