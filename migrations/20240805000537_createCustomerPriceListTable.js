exports.up = function (knex) {
  return knex.schema.createTable('customerPriceList', t => {
    t.uuid('customerPriceListId').primary().defaultTo(knex.raw('uuidv7()'));
    t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    t.uuid('priceListId').notNullable().references('priceListId').inTable('priceList').onDelete('CASCADE');
    t.uuid('customerId').references('customerId').inTable('customer').onDelete('CASCADE');
    t.uuid('customerGroupId').references('customerGroupId').inTable('customerGroup').onDelete('CASCADE');

    t.index('customerId');
    t.index('customerGroupId');
    t.index('createdAt');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('customerPriceList');
};
