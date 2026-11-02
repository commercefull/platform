/**
 * Dynamic attribute ports — split out of ProductCatalogPorts.
 */

// ============================================================================
// Dynamic Attributes
// ============================================================================

export type AttributeType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'video'
  | 'document';

export interface ProductAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type: AttributeType;
  inputType: AttributeType;
  isRequired: boolean;
  isUnique: boolean;
  isSystem: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  isVisibleOnFront: boolean;
  isUsedInProductListing: boolean;
  useForVariants: boolean;
  useForConfigurations: boolean;
  defaultValue?: string | null;
  validationRules?: Record<string, unknown> | null;
  options?: Record<string, unknown> | null;
  organizationId?: string | null;
  isGlobal: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeData {
  productAttributeValueMapId: string;
  productId: string;
  productVariantId?: string;
  attributeId: string;
  value?: string;
  valueText?: string;
  valueNumeric?: number;
  valueBoolean?: boolean;
  valueJson?: Record<string, unknown>;
  valueDate?: Date;
}

interface SetProductAttributeInput {
  attributeId: string;
  value: string;
}

interface SetProductAttributeSingleInput {
  productId: string;
  attributeId: string;
  value: string;
  productVariantId?: string;
}

export interface ProductAttributeValue {
  productAttributeValueId: string;
  attributeId: string;
  value: string;
  displayValue?: string;
  position: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductAttributeCreateInput {
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type?: AttributeType;
  inputType?: AttributeType;
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
  options?: Record<string, unknown>;
  organizationId?: string;
  isGlobal?: boolean;
}

export type ProductAttributeUpdateInput = Partial<ProductAttributeCreateInput>;

export interface AttributeValueCreateInput {
  attributeId: string;
  value: string;
  displayValue?: string;
  position?: number;
  isDefault?: boolean;
}

export interface DynamicAttributePort {
  findAttributeById(id: string): Promise<ProductAttribute | null>;
  findAttributeByCode(code: string): Promise<ProductAttribute | null>;
  findAllAttributes(): Promise<ProductAttribute[]>;
  findAttributesByGroup(groupId: string): Promise<ProductAttribute[]>;
  findSearchableAttributes(): Promise<ProductAttribute[]>;
  findFilterableAttributes(): Promise<ProductAttribute[]>;
  findVariantAttributes(): Promise<ProductAttribute[]>;
  deleteAttribute(id: string): Promise<boolean>;
  createAttribute(input: ProductAttributeCreateInput): Promise<ProductAttribute>;
  updateAttribute(id: string, input: ProductAttributeUpdateInput): Promise<ProductAttribute | null>;
  findAttributeValues(attributeId: string): Promise<ProductAttributeValue[]>;
  createAttributeValue(input: AttributeValueCreateInput): Promise<ProductAttributeValue>;
  deleteAttributeValue(id: string): Promise<boolean>;
  getProductAttributes(productId: string): Promise<Array<ProductAttributeData & { attribute: ProductAttribute }>>;
  setProductAttribute(input: SetProductAttributeSingleInput): Promise<ProductAttributeData>;
  setProductAttributes(productId: string, attributes: SetProductAttributeInput[]): Promise<void>;
  removeProductAttribute(productId: string, attributeId: string): Promise<boolean>;
  clearProductAttributes(productId: string): Promise<boolean>;
}

// ============================================================================
// Product Attribute Sets
// ============================================================================

export interface ProductAttributeSetAttribute {
  productAttributeId: string;
  name: string;
  code: string;
  type: string;
  isRequired: boolean;
  defaultValue?: string | null;
  position: number;
}

export interface ProductAttributeSetPort {
  getAttributesForProductType(productTypeId: string): Promise<ProductAttributeSetAttribute[]>;
}

// ============================================================================
// Product lookup (for use cases that need to check product existence)
// ============================================================================

export interface ProductLookupPort {
  findById(productId: string): Promise<{ productId: string; name: string; status: string } | null>;
}
