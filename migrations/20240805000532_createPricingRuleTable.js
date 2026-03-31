exports.up = function (knex) {
  return knex.schema.createTable('pricingRule', t => {
    t.uuid('pricingRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('ruleType', ['percentage', 'fixed']).notNullable();
    t.enum('scope', ['global', 'product', 'category', 'customer', 'customer_group']).notNullable();
    t.specificType('productIds', 'uuid[]');
    t.specificType('categoryIds', 'uuid[]');
    t.specificType('customerIds', 'uuid[]');
    t.specificType('customerGroupIds', 'uuid[]');
    t.integer('minimumQuantity');
    t.integer('maximumQuantity');
    t.decimal('minimumOrderAmount', 10, 2);
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.integer('priority').defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.jsonb('metadata').nullable();
    t.string('currencyCode', 3).nullable();
    t.string('regionCode', 10).nullable();

    t.index(['ruleType', 'scope']);
    t.index('isActive');
    t.index(['startDate', 'endDate']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('pricingRule');
};
