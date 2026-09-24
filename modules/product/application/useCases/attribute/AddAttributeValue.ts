import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type {
  ProductAttributeValue,
  AttributeValueCreateInput,
} from '../../../domain/repositories/ProductCatalogPorts';

export interface AddAttributeValueCommand {
  attributeId: string;
  value: string;
  displayValue?: string;
  position?: number;
  isDefault?: boolean;
}

export interface AddAttributeValueResponse {
  success: boolean;
  data?: ProductAttributeValue;
  error?: string;
}

export class AddAttributeValueUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: AddAttributeValueCommand): Promise<AddAttributeValueResponse> {
    try {
      // Validate attribute exists
      const attribute = await this.attributeRepository.findAttributeById(command.attributeId);
      if (!attribute) {
        return {
          success: false,
          error: 'Attribute not found',
        };
      }

      // Check if attribute supports options
      const optionTypes = ['select', 'multiselect', 'radio', 'checkbox', 'color'];
      if (!optionTypes.includes(attribute.type)) {
        return {
          success: false,
          error: `Attribute type "${attribute.type}" does not support predefined values`,
        };
      }

      // Check if value already exists
      const existingValues = await this.attributeRepository.findAttributeValues(command.attributeId);
      const duplicate = existingValues.find(v => v.value === command.value);
      if (duplicate) {
        return {
          success: false,
          error: `Value "${command.value}" already exists for this attribute`,
        };
      }

      // Create the value
      const input: AttributeValueCreateInput = {
        attributeId: command.attributeId,
        value: command.value,
        displayValue: command.displayValue,
        position: command.position ?? existingValues.length,
        isDefault: command.isDefault,
      };

      const value = await this.attributeRepository.createAttributeValue(input);

      return {
        success: true,
        data: value,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add attribute value: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Remove Attribute Value ====================

