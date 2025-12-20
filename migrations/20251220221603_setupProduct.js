/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Insert product types
  const productTypes = [
    {
      name: 'Simple Product',
      slug: 'simple'
    },
    {
      name: 'Configurable Product',
      slug: 'configurable'
    },
    {
      name: 'Virtual Product',
      slug: 'virtual'
    },
    {
      name: 'Downloadable Product',
      slug: 'downloadable'
    },
    {
      name: 'Bundle Product',
      slug: 'bundle'
    },
    {
      name: 'Grouped Product',
      slug: 'grouped'
    },
    {
      name: 'Subscription Product',
      slug: 'subscription'
    }
  ];

  for (const productType of productTypes) {
    await knex('productType')
      .insert(productType)
      .onConflict('slug')
      .merge();
  }

  // Insert product attribute groups
  await knex('productAttributeGroup').insert([
    { 
      name: 'General', 
      code: 'general', 
      description: 'General product attributes', 
      position: 1, 
      isComparable: true, 
      isGlobal: true 
    },
    { 
      name: 'Technical', 
      code: 'technical', 
      description: 'Technical specifications', 
      position: 2, 
      isComparable: true, 
      isGlobal: true 
    },
    { 
      name: 'Physical', 
      code: 'physical', 
      description: 'Physical characteristics like size, weight', 
      position: 3, 
      isComparable: true, 
      isGlobal: true 
    },
    { 
      name: 'Visual', 
      code: 'visual', 
      description: 'Visual properties like color', 
      position: 4, 
      isComparable: true, 
      isGlobal: true 
    }
  ]);

  // Get the attribute group IDs
  const generalGroup = await knex('productAttributeGroup').where('code', 'general').first();
  const technicalGroup = await knex('productAttributeGroup').where('code', 'technical').first();
  const physicalGroup = await knex('productAttributeGroup').where('code', 'physical').first();
  const visualGroup = await knex('productAttributeGroup').where('code', 'visual').first();

  // Insert product attributes
  await knex('productAttribute').insert([
    {
      groupId: generalGroup.productAttributeGroupId,
      name: 'Brand',
      code: 'brand',
      description: 'Product brand or manufacturer',
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
      position: 1
    },
    {
      groupId: visualGroup.productAttributeGroupId,
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
      position: 2
    },
    {
      groupId: physicalGroup.productAttributeGroupId,
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
      position: 3
    },
    {
      groupId: technicalGroup.productAttributeGroupId,
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
      isComparable: false,
      isVisibleOnFront: true,
      isUsedInProductListing: false,
      useForVariants: false,
      useForConfigurations: false,
      position: 4
    },
    {
      groupId: technicalGroup.productAttributeGroupId,
      name: 'Weight',
      code: 'weight',
      description: 'Product weight in grams',
      type: 'number',
      inputType: 'number',
      isRequired: false,
      isUnique: false,
      isSystem: false,
      isSearchable: false,
      isFilterable: false,
      isComparable: false,
      isVisibleOnFront: false,
      isUsedInProductListing: false,
      useForVariants: false,
      useForConfigurations: false,
      position: 5
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Delete product attributes first (due to foreign key constraints)
  await knex('productAttribute').whereIn('code', ['brand', 'color', 'size', 'material', 'weight']).del();

  // Delete product attribute groups
  await knex('productAttributeGroup').whereIn('code', ['general', 'technical', 'physical', 'visual']).del();

  // Delete product types
  await knex('productType').whereIn('slug', ['simple', 'configurable', 'virtual', 'downloadable', 'bundle', 'grouped', 'subscription']).del();
};