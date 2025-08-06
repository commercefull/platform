exports.up = function(knex) {
  return knex.schema.alterTable('product_variant', t => {
    t.string('name', 255);
    t.decimal('sale_price', 15, 2);
    t.decimal('cost', 15, 2);
    t.integer('inventory').defaultTo(0);
    t.enu('inventory_policy', null, { useNative: true, existingType: true, enumName: 'inventory_policy' }).defaultTo('deny');
    t.decimal('weight', 10, 2);
    t.jsonb('dimensions');
    t.jsonb('attributes').defaultTo('{}');
    t.specificType('image_ids', 'uuid[]');
    t.boolean('is_default').defaultTo(false);
    t.boolean('is_active').defaultTo(true);
    t.integer('position').defaultTo(0);
    t.jsonb('metadata');
    t.timestamp('deleted_at');

    t.index('is_default');
    t.index('is_active');
    t.index('position');
    t.index(['product_id', 'position']);
    t.index('name');
    t.index('deleted_at');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('product_variant', t => {
    t.dropColumns(
      'name',
      'sale_price',
      'cost',
      'inventory',
      'inventory_policy',
      'weight',
      'dimensions',
      'attributes',
      'image_ids',
      'is_default',
      'is_active',
      'position',
      'metadata',
      'deleted_at'
    );
  });
};
