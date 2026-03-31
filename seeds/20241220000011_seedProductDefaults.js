/**
 * Seed: Default product types, attribute groups, and core attributes
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Product types
  const productTypes = [
    { name: 'Simple Product', slug: 'simple' },
    { name: 'Configurable Product', slug: 'configurable' },
    { name: 'Virtual Product', slug: 'virtual' },
    { name: 'Downloadable Product', slug: 'downloadable' },
    { name: 'Bundle Product', slug: 'bundle' },
    { name: 'Grouped Product', slug: 'grouped' },
    { name: 'Subscription Product', slug: 'subscription' },
  ];

  for (const pt of productTypes) {
    const existing = await knex('productType').where({ slug: pt.slug }).first();
    if (!existing) {
      await knex('productType').insert(pt);
    }
  }

  // Attribute groups
  const groups = [
    { code: 'general', name: 'General', description: 'General product attributes', position: 1, isComparable: true, isGlobal: true },
    { code: 'technical', name: 'Technical', description: 'Technical specifications', position: 2, isComparable: true, isGlobal: true },
    { code: 'physical', name: 'Physical', description: 'Physical characteristics like size, weight', position: 3, isComparable: true, isGlobal: true },
    { code: 'visual', name: 'Visual', description: 'Visual properties like color', position: 4, isComparable: true, isGlobal: true },
  ];

  for (const group of groups) {
    const existing = await knex('productAttributeGroup').where({ code: group.code }).first();
    if (!existing) {
      await knex('productAttributeGroup').insert(group);
    }
  }

  // Core attributes
  const generalGroup = await knex('productAttributeGroup').where('code', 'general').first();
  const technicalGroup = await knex('productAttributeGroup').where('code', 'technical').first();
  const physicalGroup = await knex('productAttributeGroup').where('code', 'physical').first();
  const visualGroup = await knex('productAttributeGroup').where('code', 'visual').first();

  const attributes = [
    { code: 'brand', name: 'Brand', groupId: generalGroup.productAttributeGroupId, description: 'Product brand or manufacturer', type: 'text', inputType: 'text', isRequired: false, isUnique: false, isSystem: false, isSearchable: true, isFilterable: true, isComparable: true, isVisibleOnFront: true, isUsedInProductListing: true, useForVariants: false, useForConfigurations: false, position: 1 },
    { code: 'color', name: 'Color', groupId: visualGroup.productAttributeGroupId, description: 'Product color', type: 'select', inputType: 'select', isRequired: false, isUnique: false, isSystem: false, isSearchable: true, isFilterable: true, isComparable: true, isVisibleOnFront: true, isUsedInProductListing: true, useForVariants: true, useForConfigurations: false, position: 2 },
    { code: 'size', name: 'Size', groupId: physicalGroup.productAttributeGroupId, description: 'Product size', type: 'select', inputType: 'select', isRequired: false, isUnique: false, isSystem: false, isSearchable: true, isFilterable: true, isComparable: true, isVisibleOnFront: true, isUsedInProductListing: true, useForVariants: true, useForConfigurations: false, position: 3 },
    { code: 'material', name: 'Material', groupId: technicalGroup.productAttributeGroupId, description: 'Product material', type: 'text', inputType: 'text', isRequired: false, isUnique: false, isSystem: false, isSearchable: true, isFilterable: true, isComparable: false, isVisibleOnFront: true, isUsedInProductListing: false, useForVariants: false, useForConfigurations: false, position: 4 },
    { code: 'weight', name: 'Weight', groupId: technicalGroup.productAttributeGroupId, description: 'Product weight in grams', type: 'number', inputType: 'number', isRequired: false, isUnique: false, isSystem: false, isSearchable: false, isFilterable: false, isComparable: false, isVisibleOnFront: false, isUsedInProductListing: false, useForVariants: false, useForConfigurations: false, position: 5 },
  ];

  for (const attr of attributes) {
    const existing = await knex('productAttribute').where({ code: attr.code }).first();
    if (!existing) {
      await knex('productAttribute').insert(attr);
    }
  }
};
