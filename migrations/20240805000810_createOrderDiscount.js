/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('orderDiscount', t => {
    t.uuid('orderDiscountId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.string('code', 100);
    t.enum('type', ['coupon', 'promotion', 'automatic', 'loyalty', 'referral', 'manual']).notNullable();
    t.string('description', 255).notNullable();
    t.decimal('value', 15, 2).notNullable();
    t.boolean('isPercentage').notNullable().defaultTo(false);
    t.enum('targetType', ['order', 'item', 'shipping']).notNullable();
    t.uuid('targetId');
    
    t.index('orderId');
    t.index('code');
    t.index('type');
    t.index('targetId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('orderDiscount');
};
