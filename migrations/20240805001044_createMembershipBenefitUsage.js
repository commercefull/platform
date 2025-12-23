/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('membershipBenefitUsage', t => {
    t.uuid('membershipBenefitUsageId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('subscriptionId').notNullable().references('membershipSubscriptionId').inTable('membershipSubscription').onDelete('CASCADE');
    t.uuid('customerId').notNullable().references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('benefitId').notNullable().references('membershipBenefitId').inTable('membershipBenefit').onDelete('CASCADE');
    t.timestamp('usageDate').notNullable().defaultTo(knex.fn.now());
    t.decimal('usageValue', 10, 2).notNullable().defaultTo(1);
    t.enum('usageType', [
      'discountApplied',
      'freeShipping',
      'contentAccess',
      'giftRedeemed',
      'pointsMultiplier',
      'earlyAccess',
    ]).notNullable();
    t.string('relatedEntityType', 50);
    t.uuid('relatedEntityId');
    t.jsonb('details');
    t.text('notes');

    t.index('subscriptionId');
    t.index('customerId');
    t.index('benefitId');
    t.index('usageDate');
    t.index('usageType');
    t.index('relatedEntityType');
    t.index('relatedEntityId');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('membershipBenefitUsage');
};
