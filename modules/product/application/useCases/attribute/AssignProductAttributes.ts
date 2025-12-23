import dynamicAttributeRepository, {
  ProductAttributeData,
  ProductAttribute,
} from '../../../infrastructure/repositories/DynamicAttributeRepository';

// ==================== Set Product Attribute ====================

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
  async execute(command: SetProductAttributeCommand): Promise<SetProductAttributeResponse> {
    try {
      // Get attribute by ID or code
      let attribute: ProductAttribute | null = null;

      if (command.attributeId) {
        attribute = await dynamicAttributeRepository.findAttributeById(command.attributeId);
      } else if (command.attributeCode) {
        attribute = await dynamicAttributeRepository.findAttributeByCode(command.attributeCode);
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
        const values = await dynamicAttributeRepository.findAttributeValues(attribute.productAttributeId);
        const validValue = values.find(v => v.value === command.value);
        if (!validValue && values.length > 0) {
          return {
            success: false,
            error: `Invalid value "${command.value}" for attribute "${attribute.name}"`,
          };
        }
      }

      // Set the attribute value
      const result = await dynamicAttributeRepository.setProductAttribute({
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
  async execute(command: SetProductAttributesCommand): Promise<SetProductAttributesResponse> {
    try {
      // Clear existing attributes if requested
      if (command.clearExisting) {
        await dynamicAttributeRepository.clearProductAttributes(command.productId);
      }

      const results = {
        set: 0,
        failed: [] as Array<{ attribute: string; error: string }>,
      };

      // Set each attribute
      for (const attr of command.attributes) {
        let attribute: ProductAttribute | null = null;

        if (attr.attributeId) {
          attribute = await dynamicAttributeRepository.findAttributeById(attr.attributeId);
        } else if (attr.attributeCode) {
          attribute = await dynamicAttributeRepository.findAttributeByCode(attr.attributeCode);
        }

        if (!attribute) {
          results.failed.push({
            attribute: attr.attributeId || attr.attributeCode || 'unknown',
            error: 'Attribute not found',
          });
          continue;
        }

        try {
          await dynamicAttributeRepository.setProductAttribute({
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
  async execute(query: GetProductAttributesQuery): Promise<GetProductAttributesResponse> {
    try {
      const attributes = await dynamicAttributeRepository.getProductAttributes(query.productId);

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

export interface RemoveProductAttributeCommand {
  productId: string;
  attributeId?: string;
  attributeCode?: string;
}

export interface RemoveProductAttributeResponse {
  success: boolean;
  error?: string;
}

export class RemoveProductAttributeUseCase {
  async execute(command: RemoveProductAttributeCommand): Promise<RemoveProductAttributeResponse> {
    try {
      let attributeId = command.attributeId;

      if (!attributeId && command.attributeCode) {
        const attribute = await dynamicAttributeRepository.findAttributeByCode(command.attributeCode);
        if (!attribute) {
          return {
            success: false,
            error: 'Attribute not found',
          };
        }
        attributeId = attribute.productAttributeId;
      }

      if (!attributeId) {
        return {
          success: false,
          error: 'Attribute ID or code is required',
        };
      }

      await dynamicAttributeRepository.removeProductAttribute(command.productId, attributeId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove product attribute: ${(error as Error).message}`,
      };
    }
  }
}

export const setProductAttributeUseCase = new SetProductAttributeUseCase();
export const setProductAttributesUseCase = new SetProductAttributesUseCase();
export const getProductAttributesUseCase = new GetProductAttributesUseCase();
export const removeProductAttributeUseCase = new RemoveProductAttributeUseCase();
