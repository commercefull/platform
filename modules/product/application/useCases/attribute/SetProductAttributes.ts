import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type { ProductAttribute } from '../../../domain/repositories/ProductCatalogPorts';

export interface SetProductAttributesCommand {
  productId: string;
  attributes: Array<{
    attributeId?: string;
    attributeCode?: string;
    value: string;
  }>;
  clearExisting?: boolean;
}

export interface SetProductAttributesResponse {
  success: boolean;
  data?: {
    set: number;
    failed: Array<{ attribute: string; error: string }>;
  };
  error?: string;
}

export class SetProductAttributesUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: SetProductAttributesCommand): Promise<SetProductAttributesResponse> {
    try {
      // Clear existing attributes if requested
      if (command.clearExisting) {
        await this.attributeRepository.clearProductAttributes(command.productId);
      }

      const results = {
        set: 0,
        failed: [] as Array<{ attribute: string; error: string }>,
      };

      // Set each attribute
      for (const attr of command.attributes) {
        let attribute: ProductAttribute | null = null;

        if (attr.attributeId) {
          attribute = await this.attributeRepository.findAttributeById(attr.attributeId);
        } else if (attr.attributeCode) {
          attribute = await this.attributeRepository.findAttributeByCode(attr.attributeCode);
        }

        if (!attribute) {
          results.failed.push({
            attribute: attr.attributeId || attr.attributeCode || 'unknown',
            error: 'Attribute not found',
          });
          continue;
        }

        try {
          await this.attributeRepository.setProductAttribute({
            productId: command.productId,
            attributeId: attribute.productAttributeId,
            value: attr.value,
          });
          results.set++;
        } catch (error) {
          results.failed.push({
            attribute: attribute.code,
            error: (error as Error).message,
          });
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set product attributes: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Get Product Attributes ====================

