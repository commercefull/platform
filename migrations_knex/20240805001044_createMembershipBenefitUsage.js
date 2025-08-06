/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_benefit_usage', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('subscription_id').notNullable().references('id').inTable('membership_subscription').onDelete('CASCADE');
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('benefit_id').notNullable().references('id').inTable('membership_benefit').onDelete('CASCADE');
    t.timestamp('usage_date').notNullable().defaultTo(knex.fn.now());
    t.decimal('usage_value', 10, 2).notNullable().defaultTo(1);
    t.enu('usage_type', ['discount_applied', 'free_shipping', 'content_access', 'gift_redeemed', 'points_multiplier', 'early_access'], { useNative: true, enumName: 'membership_benefit_usage_type' }).notNullable();
    t.string('related_entity_type', 50);
    t.uuid('related_entity_id');
    t.jsonb('details');
    t.text('notes');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('subscription_id');
    t.index('customer_id');
    t.index('benefit_id');
    t.index('usage_date');
    t.index('usage_type');
    t.index('related_entity_type');
    t.index('related_entity_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_benefit_usage')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_benefit_usage_type'));
};
