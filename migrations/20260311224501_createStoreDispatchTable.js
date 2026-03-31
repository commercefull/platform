exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('storeDispatch');
  if (hasTable) return;

  await knex.schema.createTable('storeDispatch', table => {
    table.uuid('dispatchId').primary().defaultTo(knex.raw('uuidv7()'));
    table.uuid('fromStoreId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    table.uuid('toStoreId').notNullable().references('storeId').inTable('store').onDelete('CASCADE');
    table.string('dispatchNumber', 50).notNullable().unique();
    table.enum('status', ['draft', 'pending_approval', 'approved', 'dispatched', 'in_transit', 'received', 'cancelled']).notNullable().defaultTo('draft');
    table.uuid('requestedBy').nullable();
    table.uuid('approvedBy').nullable();
    table.uuid('dispatchedBy').nullable();
    table.uuid('receivedBy').nullable();
    table.timestamp('requestedAt').nullable();
    table.timestamp('approvedAt').nullable();
    table.timestamp('dispatchedAt').nullable();
    table.timestamp('receivedAt').nullable();
    table.text('notes').nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());

    table.index(['fromStoreId']);
    table.index(['toStoreId']);
    table.index(['status']);
    table.index(['dispatchNumber']);
    table.index(['requestedBy']);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('storeDispatch');
};
