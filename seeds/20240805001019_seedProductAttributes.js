/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert product attributes
  const attributes = await knex('productAttribute').insert([
    {
      name: 'Color',
      code: 'color',
      description: 'Product color',
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: true,
      useForConfigurations: false,
      position: 10
    },
    {
      name: 'Size',
      code: 'size',
      description: 'Product size',
      type: 'select',
      inputType: 'select',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: true,
      useForConfigurations: false,
      position: 20
    },
    {
      name: 'Material',
      code: 'material',
      description: 'Product material',
      type: 'text',
      inputType: 'text',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: true,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 30
    },
    {
      name: 'Weight',
      code: 'weight',
      description: 'Product weight in grams',
      type: 'number',
      inputType: 'number',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: true,
      isComparable: true,
      isVisibleOnFront: true,
      isUsedInProductListing: true,
      useForVariants: false,
      useForConfigurations: false,
      position: 40
    }
  ]).returning(['productAttributeId', 'code']);

  // Insert product attribute groups
  const groups = await knex('productAttributeGroup').insert([
    {
      name: 'Basic Attributes',
      code: 'basic',
      description: 'Basic product attributes',
      position: 10,
      isVisible: true,
      isComparable: true,
      isGlobal: true
    },
    {
      name: 'Physical Properties',
      code: 'physical',
      description: 'Physical properties of the product',
      position: 20,
      isVisible: true,
      isComparable: true,
      isGlobal: true
    }
  ]).returning(['productAttributeGroupId', 'code']);

  const attrMap = attributes.reduce((acc, attr) => ({ ...acc, [attr.code]: attr.productAttributeId }), {});
  const groupMap = groups.reduce((acc, group) => ({ ...acc, [group.code]: group.productAttributeGroupId }), {});

  // Link attributes to groups
  await knex('productAttributeToGroup').insert([
    { attributeId: attrMap.color, groupId: groupMap.basic, position: 10 },
    { attributeId: attrMap.size, groupId: groupMap.basic, position: 20 },
    { attributeId: attrMap.material, groupId: groupMap.physical, position: 10 },
    { attributeId: attrMap.weight, groupId: groupMap.physical, position: 20 }
  ]);

  // Insert attribute values
  return knex('productAttributeValue').insert([
    // Colors
    { attributeId: attrMap.color, value: 'red', displayValue: 'Red', position: 10 },
    { attributeId: attrMap.color, value: 'blue', displayValue: 'Blue', position: 20 },
    { attributeId: attrMap.color, value: 'black', displayValue: 'Black', position: 30 },
    { attributeId: attrMap.color, value: 'white', displayValue: 'White', position: 40 },
    // Sizes
    { attributeId: attrMap.size, value: 'xs', displayValue: 'XS', position: 10 },
    { attributeId: attrMap.size, value: 's', displayValue: 'S', position: 20 },
    { attributeId: attrMap.size, value: 'm', displayValue: 'M', position: 30 },
    { attributeId: attrMap.size, value: 'l', displayValue: 'L', position: 40 },
    { attributeId: attrMap.size, value: 'xl', displayValue: 'XL', position: 50 }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('productAttributeValue').whereIn('value', ['red', 'blue', 'black', 'white', 'xs', 's', 'm', 'l', 'xl']).delete();
  await knex('productAttributeToGroup').delete(); // Simple delete since we're deleting all groups/attributes
  await knex('productAttributeGroup').whereIn('code', ['basic', 'physical']).delete();
  await knex('productAttribute').whereIn('code', ['color', 'size', 'material', 'weight']).delete();
};

exports.seed = async function (knex) {
  await exports.down(knex);
  return exports.up(knex);
};
