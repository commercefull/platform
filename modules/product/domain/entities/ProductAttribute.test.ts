import { ProductAttribute } from './ProductAttribute';

describe('ProductAttribute', () => {
  const baseProps = {
    name: 'Color',
    code: 'color',
    type: 'select' as const,
    inputType: 'select' as const,
    isRequired: false,
    isUnique: false,
    isSystem: false,
    isSearchable: true,
    isFilterable: true,
    isComparable: false,
    isVisibleOnFront: true,
    isUsedInProductListing: false,
    useForVariants: true,
    useForConfigurations: false,
    position: 0,
    isGlobal: true,
  };

  it('should create an attribute (happy path)', () => {
    const attr = ProductAttribute.create(baseProps);
    expect(attr.name).toBe('Color');
    expect(attr.code).toBe('color');
    expect(attr.type).toBe('select');
  });

  it('should detect option-supporting types', () => {
    const select = ProductAttribute.create(baseProps);
    expect(select.hasOptions()).toBe(true);

    const text = ProductAttribute.create({ ...baseProps, type: 'text', inputType: 'text' });
    expect(text.hasOptions()).toBe(false);
  });

  it('should detect numeric type', () => {
    const num = ProductAttribute.create({ ...baseProps, name: 'Weight', code: 'weight', type: 'number', inputType: 'number' });
    expect(num.isNumeric()).toBe(true);
    const textAttr = ProductAttribute.create({ ...baseProps, type: 'text', inputType: 'text' });
    expect(textAttr.isNumeric()).toBe(false);
  });

  it('should detect date type', () => {
    const date = ProductAttribute.create({ ...baseProps, name: 'Date', code: 'date', type: 'date', inputType: 'date' });
    expect(date.isDateType()).toBe(true);
  });

  it('should detect file type', () => {
    const file = ProductAttribute.create({ ...baseProps, name: 'Image', code: 'image', type: 'image', inputType: 'image' });
    expect(file.isFileType()).toBe(true);
  });

  it('should validate required field', () => {
    const attr = ProductAttribute.create({ ...baseProps, isRequired: true });
    const result = attr.validateValue('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('required');
  });

  it('should validate number value', () => {
    const attr = ProductAttribute.create({
      ...baseProps, name: 'Weight', code: 'weight', type: 'number', inputType: 'number',
      validationRules: { minValue: 0, maxValue: 100 },
    });
    expect(attr.validateValue('50').valid).toBe(true);
    expect(attr.validateValue('abc').valid).toBe(false);
    expect(attr.validateValue('-1').valid).toBe(false);
    expect(attr.validateValue('101').valid).toBe(false);
  });

  it('should validate text with pattern', () => {
    const attr = ProductAttribute.create({
      ...baseProps, name: 'Code', code: 'code', type: 'text', inputType: 'text',
      validationRules: { minLength: 2, maxLength: 10, pattern: '^[a-z]+$' },
    });
    expect(attr.validateValue('abc').valid).toBe(true);
    expect(attr.validateValue('a').valid).toBe(false);
    expect(attr.validateValue('abc123').valid).toBe(false);
  });

  it('should validate select against predefined values', () => {
    const attr = ProductAttribute.create(baseProps);
    attr.setValues([
      { productAttributeValueId: '1', attributeId: 'a1', value: 'red', position: 0, isDefault: true },
      { productAttributeValueId: '2', attributeId: 'a1', value: 'blue', position: 1, isDefault: false },
    ]);
    expect(attr.validateValue('red').valid).toBe(true);
    expect(attr.validateValue('green').valid).toBe(false);
  });

  it('should validate boolean value', () => {
    const attr = ProductAttribute.create({ ...baseProps, name: 'Active', code: 'active', type: 'boolean', inputType: 'boolean' });
    expect(attr.validateValue('true').valid).toBe(true);
    expect(attr.validateValue('yes').valid).toBe(true);
    expect(attr.validateValue('maybe').valid).toBe(false);
  });

  it('should validate date value', () => {
    const attr = ProductAttribute.create({ ...baseProps, name: 'Date', code: 'date', type: 'date', inputType: 'date' });
    expect(attr.validateValue('2026-01-01').valid).toBe(true);
    expect(attr.validateValue('not-a-date').valid).toBe(false);
  });

  it('should pass validation for empty non-required value', () => {
    const attr = ProductAttribute.create(baseProps);
    expect(attr.validateValue('').valid).toBe(true);
  });

  it('should serialize to object', () => {
    const attr = ProductAttribute.create(baseProps);
    const obj = attr.toObject();
    expect(obj.name).toBe('Color');
    expect(obj.values).toEqual([]);
  });
});
