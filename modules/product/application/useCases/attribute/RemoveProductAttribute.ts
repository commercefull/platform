import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';

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
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: RemoveProductAttributeCommand): Promise<RemoveProductAttributeResponse> {
    try {
      let attributeId = command.attributeId;

      if (!attributeId && command.attributeCode) {
        const attribute = await this.attributeRepository.findAttributeByCode(command.attributeCode);
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

      await this.attributeRepository.removeProductAttribute(command.productId, attributeId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove product attribute: ${(error as Error).message}`,
      };
    }
  }
}


