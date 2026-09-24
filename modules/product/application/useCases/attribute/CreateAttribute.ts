import type { DynamicAttributePort } from '../../../domain/repositories/ProductCatalogPorts';
import type {
  ProductAttributeCreateInput,
  ProductAttribute,
  AttributeType,
} from '../../../domain/repositories/ProductCatalogPorts';

export interface CreateAttributeCommand {
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type?:
    | 'text'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'date'
    | 'datetime'
    | 'time'
    | 'file'
    | 'image'
    | 'video'
    | 'document'
    | 'color'
    | 'boolean';
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
  options?: Array<{ value: string; displayValue?: string; position?: number; isDefault?: boolean }>;
  organizationId?: string;
  isGlobal?: boolean;
}

export interface CreateAttributeResponse {
  success: boolean;
  data?: ProductAttribute;
  error?: string;
}

export class CreateAttributeUseCase {
  constructor(private readonly attributeRepository: DynamicAttributePort) {}
  async execute(command: CreateAttributeCommand): Promise<CreateAttributeResponse> {
    try {
      // Validate required fields
      if (!command.name || !command.code) {
        return {
          success: false,
          error: 'Name and code are required',
        };
      }

      // Check if attribute code already exists
      const existing = await this.attributeRepository.findAttributeByCode(command.code);
      if (existing) {
        return {
          success: false,
          error: `Attribute with code "${command.code}" already exists`,
        };
      }

      // Create the attribute
      const input: ProductAttributeCreateInput = {
        name: command.name,
        code: command.code,
        description: command.description,
        groupId: command.groupId,
        type: (command.type || 'text') as AttributeType,
        inputType: (command.inputType || command.type || 'text') as AttributeType,
        isRequired: command.isRequired,
        isUnique: command.isUnique,
        isSearchable: command.isSearchable,
        isFilterable: command.isFilterable,
        isComparable: command.isComparable,
        isVisibleOnFront: command.isVisibleOnFront,
        isUsedInProductListing: command.isUsedInProductListing,
        useForVariants: command.useForVariants,
        useForConfigurations: command.useForConfigurations,
        position: command.position,
        defaultValue: command.defaultValue,
        validationRules: command.validationRules,
        organizationId: command.organizationId,
        isGlobal: command.isGlobal,
      };

      const attribute = await this.attributeRepository.createAttribute(input);

      // Create predefined options if provided
      if (command.options && command.options.length > 0) {
        for (const option of command.options) {
          await this.attributeRepository.createAttributeValue({
            attributeId: attribute.productAttributeId,
            value: option.value,
            displayValue: option.displayValue,
            position: option.position,
            isDefault: option.isDefault,
          });
        }
      }

      return {
        success: true,
        data: attribute,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create attribute: ${(error as Error).message}`,
      };
    }
  }
}

