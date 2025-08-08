/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipDiscountCode', t => {
    t.uuid('membershipDiscountCodeId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('planId').notNullable().references('planId').inTable('membershipPlan').onDelete('CASCADE');
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enum('discountType', ['percentage', 'fixedAmount', 'freePeriod'], { useNative: true, enumName: 'membership_discount_code_type' }).notNullable();
    t.decimal('discountValue', 10, 2).notNullable();
    t.timestamp('validFrom');
    t.timestamp('validTo');
    t.integer('maxUses');
    t.integer('usesRemaining');
    t.integer('usesPerCustomer').defaultTo(1);
    t.boolean('firstTimeOnly').notNullable().defaultTo(false);
    
    t.uuid('createdBy');
    t.index('planId');
    t.index('code');
    t.index('isActive');
    t.index('discountType');
    t.index('validFrom');
    t.index('validTo');
    t.index('firstTimeOnly');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipDiscountCode');
};
