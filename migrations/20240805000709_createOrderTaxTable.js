exports.up = function (knex) {
  return knex.schema.createTable('orderTax', t => {
    t.uuid('orderTaxId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('orderId').notNullable().references('orderId').inTable('order').onDelete('CASCADE');
    t.uuid('orderItemId').references('orderItemId').inTable('orderItem').onDelete('CASCADE');
    t.string('taxType', 50).notNullable();
    t.string('name', 255).notNullable();
    t.decimal('rate', 6, 4).notNullable();
    t.decimal('amount', 15, 2).notNullable();
    t.string('jurisdiction', 255);
    t.string('taxProvider', 255);
    t.string('providerTaxId', 255);
    t.boolean('isIncludedInPrice').notNullable().defaultTo(false);

    t.index('orderId');
    t.index('orderItemId');
    t.index('taxType');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('orderTax');
};
