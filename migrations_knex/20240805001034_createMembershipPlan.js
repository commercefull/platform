/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipPlan', t => {
    t.uuid('membershipPlanId').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 100).notNullable();
    t.string('code', 50).notNullable().unique();
    t.text('description');
    t.string('short_description', 255);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.boolean('is_public').notNullable().defaultTo(true);
    t.boolean('is_default').notNullable().defaultTo(false);
    t.integer('priority').defaultTo(0);
    t.integer('level').defaultTo(1);
    t.integer('trial_days').defaultTo(0);
    t.decimal('price', 10, 2).notNullable();
    t.decimal('sale_price', 10, 2);
    t.decimal('setup_fee', 10, 2).defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.enu('billing_cycle', ['daily', 'weekly', 'monthly', 'quarterly', 'biannual', 'annual', 'lifetime'], { useNative: true, enumName: 'membership_billing_cycle' }).notNullable().defaultTo('monthly');
    t.integer('billing_period').defaultTo(1);
    t.integer('max_members');
    t.boolean('auto_renew').notNullable().defaultTo(true);
    t.integer('duration');
    t.integer('grace_periods_allowed').defaultTo(0);
    t.integer('grace_period_days').defaultTo(0);
    t.text('membership_image');
    t.jsonb('public_details');
    t.jsonb('private_meta');
    t.jsonb('visibility_rules');
    t.jsonb('availability_rules');
    t.jsonb('custom_fields');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('code');
    t.index('is_active');
    t.index('is_public');
    t.index('priority');
    t.index('level');
    t.index('price');
    t.index('billing_cycle');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX membership_plan_is_default_unique ON membership_plan (is_default) WHERE is_default = true');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_plan')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_billing_cycle'));
};
