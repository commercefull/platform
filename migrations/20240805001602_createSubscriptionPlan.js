/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('subscriptionPlan', function (table) {
    table.uuid('subscriptionPlanId').primary().defaultTo(knex.raw('uuidv7()'));
    table
      .uuid('subscriptionProductId')
      .notNullable()
      .references('subscriptionProductId')
      .inTable('subscriptionProduct')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('slug');
    table.text('description');
    table.string('billingInterval').notNullable().defaultTo('month'); // day, week, month, year
    table.integer('billingIntervalCount').defaultTo(1);
    table.bigInteger('priceCents').notNullable();
    table.bigInteger('compareAtPriceCents');
    table.string('currency', 3).defaultTo('USD');
    table.bigInteger('setupFeeCents').defaultTo(0);
    table.integer('trialDays');
    table.integer('contractLength'); // Number of billing cycles
    table.boolean('isContractRequired').defaultTo(false);
    table.decimal('discountPercent', 5, 2).defaultTo(0);
    table.bigInteger('discountAmountCents').defaultTo(0);
    table.bigInteger('freeShippingThresholdCents');
    table.boolean('includesFreeShipping').defaultTo(false);
    table.jsonb('includedProducts'); // For bundle subscriptions
    table.jsonb('features'); // Feature list for display
    table.jsonb('metadata');
    table.integer('sortOrder').defaultTo(0);
    table.boolean('isPopular').defaultTo(false);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());

    table.index('subscriptionProductId');
    table.index('isActive');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('subscriptionPlan');
};
