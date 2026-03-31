exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeDispatchItem');
  if (hasTable) return;

  await knex.schema.createTable('storeDispatchItem', table => {
    table.uuid('dispatchItemId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('dispatchId').notNullable().references('dispatchId').inTable('storeDispatch').onDelete('CASCADE');
    table.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
    table.uuid('variantId').nullable().references('variantId').inTable('productVariant').onDelete('SET NULL');
    table.string('sku', 100).nullable();
    table.string('productName', 255).nullable();
    table.integer('requestedQuantity').notNullable();
    table.integer('dispatchedQuantity').notNullable().defaultTo(0);
    table.integer('receivedQuantity').notNullable().defaultTo(0);
    table.text('notes').nullable();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['dispatchId']);
    table.index(['productId']);
    table.index(['variantId']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeDispatchItem');
};
