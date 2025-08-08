/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('packagingType', t => {
    t.uuid('packagingTypeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 100).notNullable();
    t.string('code', 20).notNullable().unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.decimal('weight', 10, 2).notNullable().defaultTo(0);
    t.decimal('length', 10, 2).notNullable();
    t.decimal('width', 10, 2).notNullable();
    t.decimal('height', 10, 2).notNullable();
    t.decimal('volume', 10, 2).notNullable();
    t.decimal('maxWeight', 10, 2);
    t.integer('maxItems');
    t.decimal('cost', 10, 2);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.boolean('recyclable').notNullable().defaultTo(false);
    t.text('imageUrl');
    t.specificType('validCarriers', 'text[]');
    
    t.uuid('createdBy');
    t.index('code');
    t.index('isActive');
    t.index('isDefault');
    t.index('volume');
    t.index('maxWeight');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('packagingType');
};
