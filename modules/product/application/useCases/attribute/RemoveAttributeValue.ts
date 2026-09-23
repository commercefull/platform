import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';

export interface RemoveAttributeValueCommand {
  attributeValueId: string;
}

export interface RemoveAttributeValueResponse {
  success: boolean;
  error?: string;
}

export class RemoveAttributeValueUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: RemoveAttributeValueCommand): Promise<RemoveAttributeValueResponse> {
    try {
      const deleted = await this.attributeRepository.deleteAttributeValue(command.attributeValueId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete attribute value',
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove attribute value: ${(error as Error).message}`,
      };
    }
  }
}

// ==================== Get Attribute Values ====================

