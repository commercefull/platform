/**
 * ProductAttribute Entity
 * Represents a dynamic attribute that can be assigned to products
 */
export interface ProductAttributeProps {
  productAttributeId: string;
  name: string;
  code: string;
  description?: string;
  groupId?: string;
  type: AttributeType;
  inputType: AttributeInputType;
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
  position: number;
  defaultValue?: string;
  validationRules?: ValidationRules;
  organizationId?: string;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AttributeType =
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

export type AttributeInputType = AttributeType;

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  allowedExtensions?: string[];
  maxFileSize?: number;
  required?: boolean;
  unique?: boolean;
}

export interface AttributeValue {
  productAttributeValueId: string;
  attributeId: string;
  value: string;
  displayValue?: string;
  position: number;
  isDefault: boolean;
  metadata?: Record<string, unknown>;
}

export class ProductAttribute {
  private readonly props: ProductAttributeProps;
  private values: AttributeValue[] = [];

  constructor(props: ProductAttributeProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.productAttributeId;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get description(): string | undefined {
    return this.props.description;
  }
  get groupId(): string | undefined {
    return this.props.groupId;
  }
  get type(): AttributeType {
    return this.props.type;
  }
  get inputType(): AttributeInputType {
    return this.props.inputType;
  }
  get isRequired(): boolean {
    return this.props.isRequired;
  }
  get isUnique(): boolean {
    return this.props.isUnique;
  }
  get isSystem(): boolean {
    return this.props.isSystem;
  }
  get isSearchable(): boolean {
    return this.props.isSearchable;
  }
  get isFilterable(): boolean {
    return this.props.isFilterable;
  }
  get isComparable(): boolean {
    return this.props.isComparable;
  }
  get isVisibleOnFront(): boolean {
    return this.props.isVisibleOnFront;
  }
  get isUsedInProductListing(): boolean {
    return this.props.isUsedInProductListing;
  }
  get useForVariants(): boolean {
    return this.props.useForVariants;
  }
  get useForConfigurations(): boolean {
    return this.props.useForConfigurations;
  }
  get position(): number {
    return this.props.position;
  }
  get defaultValue(): string | undefined {
    return this.props.defaultValue;
  }
  get validationRules(): ValidationRules | undefined {
    return this.props.validationRules;
  }
  get organizationId(): string | undefined {
    return this.props.organizationId;
  }
  get isGlobal(): boolean {
    return this.props.isGlobal;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if this attribute supports predefined values (select, multiselect, radio, checkbox)
   */
  hasOptions(): boolean {
    return ['select', 'multiselect', 'radio', 'checkbox', 'color'].includes(this.type);
  }

  /**
   * Check if this attribute is numeric
   */
  isNumeric(): boolean {
    return this.type === 'number';
  }

  /**
   * Check if this attribute is a date type
   */
  isDateType(): boolean {
    return ['date', 'datetime', 'time'].includes(this.type);
  }

  /**
   * Check if this attribute is a file type
   */
  isFileType(): boolean {
    return ['file', 'image', 'video', 'document'].includes(this.type);
  }

  /**
   * Set the predefined values for this attribute
   */
  setValues(values: AttributeValue[]): void {
    this.values = values;
  }

  /**
   * Get the predefined values for this attribute
   */
  getValues(): AttributeValue[] {
    return this.values;
  }

  /**
   * Validate a value against this attribute's rules
   */
  validateValue(value: string): { valid: boolean; errors: string[] } {
    // Required check
    if (this.isRequired && (!value || value.trim() === '')) {
      return { valid: false, errors: [`${this.name} is required`] };
    }

    // Skip further validation if empty and not required
    if (!value || value.trim() === '') {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    ProductAttribute.TYPE_VALUE_VALIDATORS[this.type]?.(this, value, errors);
    return { valid: errors.length === 0, errors };
  }

  // Type-specific validators — keyed dispatch instead of a switch keeps each
  // check isolated and self-contained.
  private static readonly TYPE_VALUE_VALIDATORS: Partial<
    Record<AttributeType, (attr: ProductAttribute, value: string, errors: string[]) => void>
  > = {
    number: (attr, value, errors) => attr.validateNumberValue(value, errors),
    text: (attr, value, errors) => attr.validateTextValue(value, errors),
    select: (attr, value, errors) => attr.validateSelectValue(value, errors),
    radio: (attr, value, errors) => attr.validateSelectValue(value, errors),
    multiselect: (attr, value, errors) => attr.validateMultiValue(value, errors),
    checkbox: (attr, value, errors) => attr.validateMultiValue(value, errors),
    date: (attr, value, errors) => attr.validateDateValue(value, errors),
    datetime: (attr, value, errors) => attr.validateDateValue(value, errors),
    boolean: (attr, value, errors) => attr.validateBooleanValue(value, errors),
  };

  private validateNumberValue(value: string, errors: string[]): void {
    const rules = this.validationRules || {};
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      errors.push(`${this.name} must be a valid number`);
      return;
    }
    if (rules.minValue !== undefined && numValue < rules.minValue) {
      errors.push(`${this.name} must be at least ${rules.minValue}`);
    }
    if (rules.maxValue !== undefined && numValue > rules.maxValue) {
      errors.push(`${this.name} must be at most ${rules.maxValue}`);
    }
  }

  private validateTextValue(value: string, errors: string[]): void {
    const rules = this.validationRules || {};
    if (rules.minLength !== undefined && value.length < rules.minLength) {
      errors.push(`${this.name} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength !== undefined && value.length > rules.maxLength) {
      errors.push(`${this.name} must be at most ${rules.maxLength} characters`);
    }
    if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
      errors.push(`${this.name} format is invalid`);
    }
  }

  // Validate against predefined values
  private validateSelectValue(value: string, errors: string[]): void {
    if (this.values.length === 0) return;
    const validValues = this.values.map(v => v.value);
    if (!validValues.includes(value)) {
      errors.push(`${this.name} must be one of: ${validValues.join(', ')}`);
    }
  }

  // Value should be comma-separated list of valid values
  private validateMultiValue(value: string, errors: string[]): void {
    if (this.values.length === 0) return;
    const validValues = this.values.map(v => v.value);
    for (const selected of value.split(',').map(v => v.trim())) {
      if (!validValues.includes(selected)) {
        errors.push(`Invalid value "${selected}" for ${this.name}`);
      }
    }
  }

  private validateDateValue(value: string, errors: string[]): void {
    if (isNaN(new Date(value).getTime())) {
      errors.push(`${this.name} must be a valid date`);
    }
  }

  private validateBooleanValue(value: string, errors: string[]): void {
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(value.toLowerCase())) {
      errors.push(`${this.name} must be a boolean value`);
    }
  }

  /**
   * Convert to plain object
   */
  toObject(): ProductAttributeProps & { values: AttributeValue[] } {
    return {
      ...this.props,
      values: this.values,
    };
  }

  /**
   * Create a new ProductAttribute instance
   */
  static create(
    props: Omit<ProductAttributeProps, 'productAttributeId' | 'createdAt' | 'updatedAt'> & { productAttributeId?: string },
  ): ProductAttribute {
    return new ProductAttribute({
      ...props,
      productAttributeId: props.productAttributeId || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
