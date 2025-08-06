/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productAttributeValueMap', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('productId').notNullable().references('id').inTable('product').onDelete('CASCADE');
    t.uuid('variantId').references('id').inTable('productVariant').onDelete('CASCADE');
    t.uuid('attributeId').notNullable().references('id').inTable('productAttribute').onDelete('CASCADE');
    t.text('value').notNullable();
    t.string('displayValue', 255);
    t.integer('position').defaultTo(0);
    t.boolean('isVariantOption').notNullable().defaultTo(false);
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.index('productId');
    t.index('variantId');
    t.index('attributeId');
    t.index('value');
    t.index('isVariantOption');
    t.unique(['productId', 'variantId', 'attributeId'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productAttributeValueMap');
};
