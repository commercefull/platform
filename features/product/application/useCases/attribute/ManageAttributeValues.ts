import dynamicAttributeRepository, { 
  ProductAttributeValue,
  AttributeValueCreateInput 
} from '../../../infrastructure/repositories/DynamicAttributeRepository';

// ==================== Add Attribute Value ====================

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
  async execute(command: AddAttributeValueCommand): Promise<AddAttributeValueResponse> {
    try {
      // Validate attribute exists
      const attribute = await dynamicAttributeRepository.findAttributeById(command.attributeId);
      if (!attribute) {
        return {
          success: false,
          error: 'Attribute not found'
        };
      }

      // Check if attribute supports options
      const optionTypes = ['select', 'multiselect', 'radio', 'checkbox', 'color'];
      if (!optionTypes.includes(attribute.type)) {
        return {
          success: false,
          error: `Attribute type "${attribute.type}" does not support predefined values`
        };
      }

      // Check if value already exists
      const existingValues = await dynamicAttributeRepository.findAttributeValues(command.attributeId);
      const duplicate = existingValues.find(v => v.value === command.value);
      if (duplicate) {
        return {
          success: false,
          error: `Value "${command.value}" already exists for this attribute`
        };
      }

      // Create the value
      const input: AttributeValueCreateInput = {
        attributeId: command.attributeId,
        value: command.value,
        displayValue: command.displayValue,
        position: command.position ?? existingValues.length,
        isDefault: command.isDefault
      };

      const value = await dynamicAttributeRepository.createAttributeValue(input);

      return {
        success: true,
        data: value
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add attribute value: ${(error as Error).message}`
      };
    }
  }
}

// ==================== Remove Attribute Value ====================

export interface RemoveAttributeValueCommand {
  attributeValueId: string;
}

export interface RemoveAttributeValueResponse {
  success: boolean;
  error?: string;
}

export class RemoveAttributeValueUseCase {
  async execute(command: RemoveAttributeValueCommand): Promise<RemoveAttributeValueResponse> {
    try {
      const deleted = await dynamicAttributeRepository.deleteAttributeValue(command.attributeValueId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete attribute value'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove attribute value: ${(error as Error).message}`
      };
    }
  }
}

// ==================== Get Attribute Values ====================

export interface GetAttributeValuesQuery {
  attributeId: string;
}

export interface GetAttributeValuesResponse {
  success: boolean;
  data?: ProductAttributeValue[];
  error?: string;
}

export class GetAttributeValuesUseCase {
  async execute(query: GetAttributeValuesQuery): Promise<GetAttributeValuesResponse> {
    try {
      const values = await dynamicAttributeRepository.findAttributeValues(query.attributeId);

      return {
        success: true,
        data: values
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get attribute values: ${(error as Error).message}`
      };
    }
  }
}

export const addAttributeValueUseCase = new AddAttributeValueUseCase();
export const removeAttributeValueUseCase = new RemoveAttributeValueUseCase();
export const getAttributeValuesUseCase = new GetAttributeValuesUseCase();
