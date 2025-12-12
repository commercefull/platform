/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('basketDiscount', t => {
    t.uuid('basketDiscountId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('basketId').notNullable().references('basketId').inTable('basket').onDelete('CASCADE');
    t.enum('type', ['coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'system']).notNullable();
    t.string('code', 100);
    t.string('description', 255).notNullable();
    t.decimal('value', 15, 2).notNullable();
    t.boolean('isPercentage').notNullable().defaultTo(false);
    t.enum('targetType', ['cart', 'item', 'shipping']).notNullable();
    t.uuid('targetId'); // For item-specific discounts, references basketItem.id
    t.integer('priority').notNullable().defaultTo(0);
    
    t.index('basketId');
    t.index('code');
    t.index('targetId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('basketDiscount');
};
