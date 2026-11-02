import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type { ProductAttributeUpdateInput, ProductAttribute, AttributeType } from '../../../domain/repositories/ProductCatalogPorts';

export interface UpdateAttributeCommand {
  attributeId: string;
  name?: string;
  code?: string;
  description?: string;
  groupId?: string;
  type?: string;
  inputType?: string;
  isRequired?: boolean;
  isUnique?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  isVisibleOnFront?: boolean;
  isUsedInProductListing?: boolean;
  useForVariants?: boolean;
  useForConfigurations?: boolean;
  position?: number;
  defaultValue?: string;
  validationRules?: Record<string, unknown>;
}

export interface UpdateAttributeResponse {
  success: boolean;
  data?: ProductAttribute;
  error?: string;
}

export class UpdateAttributeUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: UpdateAttributeCommand): Promise<UpdateAttributeResponse> {
    try {
      // Validate attribute exists
      const existing = await this.attributeRepository.findAttributeById(command.attributeId);
      if (!existing) {
        return {
          success: false,
          error: 'Attribute not found',
        };
      }

      // Check if code is being changed and if new code already exists
      if (command.code && command.code !== existing.code) {
        const codeExists = await this.attributeRepository.findAttributeByCode(command.code);
        if (codeExists) {
          return {
            success: false,
            error: `Attribute with code "${command.code}" already exists`,
          };
        }
      }

      // Prevent updating system attributes
      if (existing.isSystem) {
        return {
          success: false,
          error: 'Cannot update system attributes',
        };
      }

      const updated = await this.attributeRepository.updateAttribute(command.attributeId, this.toUpdateInput(command));

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update attribute',
        };
      }

      return {
        success: true,
        data: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update attribute: ${(error as Error).message}`,
      };
    }
  }

  // Build update input from defined command fields only
  private toUpdateInput(command: UpdateAttributeCommand): ProductAttributeUpdateInput {
    const input: ProductAttributeUpdateInput = {};
    const assign = <K extends keyof ProductAttributeUpdateInput>(key: K, value: ProductAttributeUpdateInput[K] | undefined) => {
      if (value !== undefined) input[key] = value;
    };

    assign('name', command.name);
    assign('code', command.code);
    assign('description', command.description);
    assign('groupId', command.groupId);
    assign('type', command.type as AttributeType | undefined);
    assign('inputType', command.inputType as AttributeType | undefined);
    assign('isRequired', command.isRequired);
    assign('isUnique', command.isUnique);
    assign('isSearchable', command.isSearchable);
    assign('isFilterable', command.isFilterable);
    assign('isComparable', command.isComparable);
    assign('isVisibleOnFront', command.isVisibleOnFront);
    assign('isUsedInProductListing', command.isUsedInProductListing);
    assign('useForVariants', command.useForVariants);
    assign('useForConfigurations', command.useForConfigurations);
    assign('position', command.position);
    assign('defaultValue', command.defaultValue);
    assign('validationRules', command.validationRules);
    return input;
  }
}
