exports.up = function (knex) {
  return knex.schema.createTable('pricingRule', t => {
    t.uuid('pricingRuleId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.string('name', 255).notNullable();
    t.text('description');
    t.enum('ruleType', ['percentage', 'fixed']).notNullable();
    t.enum('scope', ['global', 'product', 'category', 'customer', 'customer_group']).notNullable();
    t.specificType('product_ids', 'uuid[]');
    t.specificType('category_ids', 'uuid[]');
    t.specificType('customer_ids', 'uuid[]');
    t.specificType('customer_group_ids', 'uuid[]');
    t.integer('minimum_quantity');
    t.integer('maximum_quantity');
    t.decimal('minimum_order_amount', 10, 2);
    t.timestamp('startDate');
    t.timestamp('endDate');
    t.integer('priority').defaultTo(0);
    t.boolean('isActive').notNullable().defaultTo(true);

    t.index(['ruleType', 'scope']);
    t.index('isActive');
    t.index(['startDate', 'endDate']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('pricingRule');
};
