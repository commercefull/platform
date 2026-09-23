import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type {
  ProductAttributeData,
  ProductAttribute,
} from '../../../domain/repositories/ProductCatalogPorts';

export interface SetProductAttributeCommand {
  productId: string;
  attributeId?: string;
  attributeCode?: string;
  value: string;
}

export interface SetProductAttributeResponse {
  success: boolean;
  data?: ProductAttributeData;
  error?: string;
}

export class SetProductAttributeUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: SetProductAttributeCommand): Promise<SetProductAttributeResponse> {
    try {
      // Get attribute by ID or code
      let attribute: ProductAttribute | null = null;

      if (command.attributeId) {
        attribute = await this.attributeRepository.findAttributeById(command.attributeId);
      } else if (command.attributeCode) {
        attribute = await this.attributeRepository.findAttributeByCode(command.attributeCode);
      }

      if (!attribute) {
        return {
          success: false,
          error: 'Attribute not found',
        };
      }

      // Validate value for select/radio types
      const optionTypes = ['select', 'radio'];
      if (optionTypes.includes(attribute.type)) {
        const values = await this.attributeRepository.findAttributeValues(attribute.productAttributeId);
        const validValue = values.find(v => v.value === command.value);
        if (!validValue && values.length > 0) {
          return {
            success: false,
            error: `Invalid value "${command.value}" for attribute "${attribute.name}"`,
          };
        }
      }

      // Set the attribute value
      const result = await this.attributeRepository.setProductAttribute({
        productId: command.productId,
        attributeId: attribute.productAttributeId,
        value: command.value,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to set product attribute: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Set Multiple Product Attributes ====================

