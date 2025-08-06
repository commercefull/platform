/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Insert product attributes
  const attributes = await knex('product_attribute').insert([
    {
      name: 'Color', code: 'color', description: 'Product color', type: 'color', is_active: true, is_variant: true, is_searchable: true, is_filterable: true, is_visible_on_product: true, position: 10
    },
    {
      name: 'Size', code: 'size', description: 'Product size', type: 'select', is_active: true, is_variant: true, is_searchable: true, is_filterable: true, is_visible_on_product: true, position: 20
    },
    {
      name: 'Material', code: 'material', description: 'Product material', type: 'text', is_active: true, is_variant: false, is_searchable: true, is_filterable: true, is_visible_on_product: true, position: 30
    },
    {
      name: 'Weight', code: 'weight', description: 'Product weight in grams', type: 'number', is_active: true, is_variant: false, is_searchable: false, is_filterable: true, is_visible_on_product: true, position: 40
    }
  ]).returning(['id', 'code']);

  // Insert product attribute groups
  const groups = await knex('product_attribute_group').insert([
    {
      name: 'Basic Attributes', code: 'basic', description: 'Basic product attributes', is_active: true, position: 10
    },
    {
      name: 'Physical Properties', code: 'physical', description: 'Physical properties of the product', is_active: true, position: 20
    }
  ]).returning(['id', 'code']);

  const attrMap = attributes.reduce((acc, attr) => ({ ...acc, [attr.code]: attr.id }), {});
  const groupMap = groups.reduce((acc, group) => ({ ...acc, [group.code]: group.id }), {});

  // Link attributes to groups
  await knex('product_attribute_to_group').insert([
    { attribute_id: attrMap.color, group_id: groupMap.basic, position: 10 },
    { attribute_id: attrMap.size, group_id: groupMap.basic, position: 20 },
    { attribute_id: attrMap.material, group_id: groupMap.physical, position: 10 },
    { attribute_id: attrMap.weight, group_id: groupMap.physical, position: 20 }
  ]);

  // Insert attribute values
  return knex('product_attribute_value').insert([
    // Colors
    { attribute_id: attrMap.color, value: 'red', display_value: 'Red', position: 10 },
    { attribute_id: attrMap.color, value: 'blue', display_value: 'Blue', position: 20 },
    { attribute_id: attrMap.color, value: 'black', display_value: 'Black', position: 30 },
    { attribute_id: attrMap.color, value: 'white', display_value: 'White', position: 40 },
    // Sizes
    { attribute_id: attrMap.size, value: 'xs', display_value: 'XS', position: 10 },
    { attribute_id: attrMap.size, value: 's', display_value: 'S', position: 20 },
    { attribute_id: attrMap.size, value: 'm', display_value: 'M', position: 30 },
    { attribute_id: attrMap.size, value: 'l', display_value: 'L', position: 40 },
    { attribute_id: attrMap.size, value: 'xl', display_value: 'XL', position: 50 }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex('product_attribute_value').whereIn('value', ['red', 'blue', 'black', 'white', 'xs', 's', 'm', 'l', 'xl']).delete();
  await knex('product_attribute_to_group').delete(); // Simple delete since we're deleting all groups/attributes
  await knex('product_attribute_group').whereIn('code', ['basic', 'physical']).delete();
  await knex('product_attribute').whereIn('code', ['color', 'size', 'material', 'weight']).delete();
};
