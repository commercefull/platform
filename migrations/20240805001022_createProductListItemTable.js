exports.up = function (knex) {
  return knex.schema
    .createTable('productListItem', t => {
      t.uuid('productListItemId').primary().defaultTo(knex.raw('uuidv7()'));
      t.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
      t.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      t.uuid('listId').notNullable().references('productListId').inTable('productList').onDelete('CASCADE');
      t.uuid('productId').notNullable().references('productId').inTable('product').onDelete('CASCADE');
      t.uuid('productVariantId').references('productVariantId').inTable('productVariant').onDelete('CASCADE');
      t.timestamp('addedAt').notNullable().defaultTo(knex.fn.now());
      t.integer('quantity').notNullable().defaultTo(1);
      t.text('notes');
      t.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');

      t.index('listId');
      t.index('productId');
      t.index('productVariantId');
      t.index('addedAt');
      t.index('priority');
    })
    .then(() =>
      Promise.all([
        knex.raw(
          'CREATE UNIQUE INDEX productlistitem_variant_unique ON "productListItem" ("listId", "productId", "productVariantId") WHERE "productVariantId" IS NOT NULL',
        ),
        knex.raw(
          'CREATE UNIQUE INDEX productlistitem_product_unique ON "productListItem" ("listId", "productId") WHERE "productVariantId" IS NULL',
        ),
      ]),
    );
};

exports.down = function (knex) {
  return knex.schema.dropTable('productListItem');
};
