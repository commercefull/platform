/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membership_subscription', t => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('customer_id').notNullable().references('id').inTable('customer').onDelete('CASCADE');
    t.uuid('plan_id').notNullable().references('id').inTable('membership_plan').onDelete('RESTRICT');
    t.enu('status', ['active', 'cancelled', 'expired', 'paused', 'trial', 'pending', 'past_due'], { useNative: true, enumName: 'membership_subscription_status' }).notNullable().defaultTo('active');
    t.string('membership_number', 100);
    t.timestamp('start_date').notNullable().defaultTo(knex.fn.now());
    t.timestamp('end_date');
    t.timestamp('trial_end_date');
    t.timestamp('next_billing_date');
    t.timestamp('last_billing_date');
    t.timestamp('cancelled_at');
    t.text('cancel_reason');
    t.boolean('is_auto_renew').notNullable().defaultTo(true);
    t.decimal('price_override', 10, 2);
    t.string('billing_cycle_override', 20);
    t.uuid('payment_method_id');
    t.text('notes');
    t.jsonb('metadata');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.uuid('created_by');
    t.index('customer_id');
    t.index('plan_id');
    t.index('status');
    t.index('start_date');
    t.index('end_date');
    t.index('trial_end_date');
    t.index('next_billing_date');
    t.index('is_auto_renew');
    t.index('created_at');
  }).then(() => {
    return knex.raw('CREATE UNIQUE INDEX membership_subscription_membership_number_unique ON membership_subscription (membership_number) WHERE membership_number IS NOT NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membership_subscription')
    .then(() => knex.schema.raw('DROP TYPE IF EXISTS membership_subscription_status'));
};
