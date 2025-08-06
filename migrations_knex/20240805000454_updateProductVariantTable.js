exports.up = function(knex) {
  return knex.schema.alterTable('product_variant', t => {
    t.string('name', 255);
    t.string('barcode', 100);
    t.boolean('isDefault').notNullable().defaultTo(false);
    t.boolean('isActive').notNullable().defaultTo(true);
    t.integer('stockQuantity');
    t.integer('lowStockThreshold');
    t.string('backorderStatus', 50).defaultTo('no');
    t.decimal('weight', 10, 2);
    t.jsonb('dimensions');
    t.decimal('cost', 15, 2);
    t.decimal('salePrice', 15, 2);
    t.timestamp('saleStartDate');
    t.timestamp('saleEndDate');
    t.integer('minOrderQuantity').defaultTo(1);
    t.integer('maxOrderQuantity');
    t.jsonb('metadata');
    t.jsonb('attributes');
    t.text('imageUrl');
    t.integer('position').defaultTo(0);
    t.string('externalId', 255);

    t.index('barcode');
    t.index('isDefault');
    t.index('isActive');
    t.index('stockQuantity');
    t.index('salePrice');
    t.index('externalId');
    t.unique(['productId', 'isDefault'], { predicate: knex.raw('"isDefault" = true') });
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('product_variant', t => {
    t.dropColumn('name');
    t.dropColumn('barcode');
    t.dropColumn('isDefault');
    t.dropColumn('isActive');
    t.dropColumn('stockQuantity');
    t.dropColumn('lowStockThreshold');
    t.dropColumn('backorderStatus');
    t.dropColumn('weight');
    t.dropColumn('dimensions');
    t.dropColumn('cost');
    t.dropColumn('salePrice');
    t.dropColumn('saleStartDate');
    t.dropColumn('saleEndDate');
    t.dropColumn('minOrderQuantity');
    t.dropColumn('maxOrderQuantity');
    t.dropColumn('metadata');
    t.dropColumn('attributes');
    t.dropColumn('imageUrl');
    t.dropColumn('position');
    t.dropColumn('externalId');
  });
};
