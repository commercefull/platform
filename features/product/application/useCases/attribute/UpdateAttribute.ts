import dynamicAttributeRepository, { 
  ProductAttributeUpdateInput, 
  ProductAttribute 
} from '../../../infrastructure/repositories/DynamicAttributeRepository';

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
  validationRules?: Record<string, any>;
}

export interface UpdateAttributeResponse {
  success: boolean;
  data?: ProductAttribute;
  error?: string;
}

export class UpdateAttributeUseCase {
  async execute(command: UpdateAttributeCommand): Promise<UpdateAttributeResponse> {
    try {
      // Validate attribute exists
      const existing = await dynamicAttributeRepository.findAttributeById(command.attributeId);
      if (!existing) {
        return {
          success: false,
          error: 'Attribute not found'
        };
      }

      // Check if code is being changed and if new code already exists
      if (command.code && command.code !== existing.code) {
        const codeExists = await dynamicAttributeRepository.findAttributeByCode(command.code);
        if (codeExists) {
          return {
            success: false,
            error: `Attribute with code "${command.code}" already exists`
          };
        }
      }

      // Prevent updating system attributes
      if (existing.isSystem) {
        return {
          success: false,
          error: 'Cannot update system attributes'
        };
      }

      // Build update input
      const input: ProductAttributeUpdateInput = {};
      
      if (command.name !== undefined) input.name = command.name;
      if (command.code !== undefined) input.code = command.code;
      if (command.description !== undefined) input.description = command.description;
      if (command.groupId !== undefined) input.groupId = command.groupId;
      if (command.type !== undefined) input.type = command.type as any;
      if (command.inputType !== undefined) input.inputType = command.inputType as any;
      if (command.isRequired !== undefined) input.isRequired = command.isRequired;
      if (command.isUnique !== undefined) input.isUnique = command.isUnique;
      if (command.isSearchable !== undefined) input.isSearchable = command.isSearchable;
      if (command.isFilterable !== undefined) input.isFilterable = command.isFilterable;
      if (command.isComparable !== undefined) input.isComparable = command.isComparable;
      if (command.isVisibleOnFront !== undefined) input.isVisibleOnFront = command.isVisibleOnFront;
      if (command.isUsedInProductListing !== undefined) input.isUsedInProductListing = command.isUsedInProductListing;
      if (command.useForVariants !== undefined) input.useForVariants = command.useForVariants;
      if (command.useForConfigurations !== undefined) input.useForConfigurations = command.useForConfigurations;
      if (command.position !== undefined) input.position = command.position;
      if (command.defaultValue !== undefined) input.defaultValue = command.defaultValue;
      if (command.validationRules !== undefined) input.validationRules = command.validationRules;

      const updated = await dynamicAttributeRepository.updateAttribute(command.attributeId, input);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update attribute'
        };
      }

      return {
        success: true,
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update attribute: ${(error as Error).message}`
      };
    }
  }
}

export default new UpdateAttributeUseCase();
