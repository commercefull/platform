/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('productAttributeValueMap', t => {
    t.uuid('productAttributeValueMapId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
    t.uuid('attributeId').notNullable().references('attributeId').inTable('productAttribute').onDelete('CASCADE');
    t.text('value').notNullable();
    t.string('displayValue', 255);
    t.integer('position').defaultTo(0);
    t.boolean('isVariantOption').notNullable().defaultTo(false);
    t.index('productId');
    t.index('productVariantId');
    t.index('attributeId');
    t.index('value');
    t.index('isVariantOption');
    t.unique(['productId', 'productVariantId', 'attributeId'], { nullsNotDistinct: true });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('productAttributeValueMap');
};
