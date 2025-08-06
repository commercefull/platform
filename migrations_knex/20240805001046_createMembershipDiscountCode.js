/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_discount_code', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('planId').notNullable().references('id').inTable('membership_plan').onDelete('CASCADE');
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.boolean('isActive').notNullable().defaultTo(true);
    t.enu('discountType', ['percentage', 'fixedAmount', 'freePeriod'], { useNative: true, enumName: 'membership_discount_code_type' }).notNullable();
    t.decimal('discountValue', 10, 2).notNullable();
    t.timestamp('validFrom');
    t.timestamp('validTo');
    t.integer('maxUses');
    t.integer('usesRemaining');
    t.integer('usesPerCustomer').defaultTo(1);
    t.boolean('firstTimeOnly').notNullable().defaultTo(false);
    t.jsonb('metadata');
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
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
  return knex.schema.dropTable('membership_discount_code')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_discount_code_type'));
};
