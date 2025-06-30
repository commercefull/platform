/**
 * Migration file for pricing feature core tables
 */
exports.up = function(pgm) {
  // Create pricing_rule table
  pgm.createTable('pricing_rule', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    rule_type: { 
      type: 'varchar(50)', 
      notNull: true,
      comment: 'Types: percentage_discount, fixed_discount, override_price'
    },
    scope: { 
      type: 'varchar(50)', 
      notNull: true,
      comment: 'Scopes: product, category, customer, customer_group, cart, store'
    },
    product_ids: { type: 'uuid[]' },
    category_ids: { type: 'uuid[]' },
    customer_ids: { type: 'uuid[]' },
    customer_group_ids: { type: 'uuid[]' },
    minimum_quantity: { type: 'integer' },
    maximum_quantity: { type: 'integer' },
    minimum_order_amount: { type: 'decimal(10,2)' },
    start_date: { type: 'timestamp' },
    end_date: { type: 'timestamp' },
    priority: { type: 'integer', default: 0 },
    is_active: { type: 'boolean', default: true, notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create rule_adjustment table for storing the adjustments associated with rules
  pgm.createTable('rule_adjustment', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    rule_id: {
      type: 'uuid',
      notNull: true,
      references: 'pricing_rule',
      onDelete: 'CASCADE'
    },
    type: { 
      type: 'varchar(50)', 
      notNull: true,
      comment: 'Types: percentage, fixed, override'
    },
    value: { type: 'decimal(10,2)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create rule_condition table for custom conditions
  pgm.createTable('rule_condition', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    rule_id: {
      type: 'uuid',
      notNull: true,
      references: 'pricing_rule',
      onDelete: 'CASCADE'
    },
    type: { type: 'varchar(50)', notNull: true },
    parameters: { type: 'jsonb', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create tier_price table for quantity-based pricing
  pgm.createTable('tier_price', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'product',
      onDelete: 'CASCADE'
    },
    variant_id: {
      type: 'uuid',
      references: 'product_variant',
      onDelete: 'CASCADE'
    },
    customer_group_id: {
      type: 'uuid',
      references: 'customer_group',
      onDelete: 'SET NULL'
    },
    quantity_min: { type: 'integer', notNull: true },
    price: { type: 'decimal(10,2)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create price_list table for organizing customer-specific prices
  pgm.createTable('price_list', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    priority: { type: 'integer', default: 0 },
    is_active: { type: 'boolean', default: true, notNull: true },
    start_date: { type: 'timestamp' },
    end_date: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create customer_price_list table for associating customers with price lists
  pgm.createTable('customer_price_list', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    price_list_id: {
      type: 'uuid',
      notNull: true,
      references: 'price_list',
      onDelete: 'CASCADE'
    },
    customer_id: {
      type: 'uuid',
      references: 'customer',
      onDelete: 'CASCADE'
    },
    customer_group_id: {
      type: 'uuid',
      references: 'customer_group',
      onDelete: 'CASCADE'
    },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create check constraint to ensure either customer_id or customer_group_id is set
  pgm.createConstraint('customer_price_list', 'customer_price_list_customer_check',
    'CHECK ((customer_id IS NOT NULL AND customer_group_id IS NULL) OR (customer_id IS NULL AND customer_group_id IS NOT NULL))');

  // Create customer_price table for product-specific pricing
  pgm.createTable('customer_price', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    price_list_id: {
      type: 'uuid',
      notNull: true,
      references: 'price_list',
      onDelete: 'CASCADE'
    },
    product_id: {
      type: 'uuid',
      notNull: true,
      references: 'product',
      onDelete: 'CASCADE'
    },
    variant_id: {
      type: 'uuid',
      references: 'product_variant',
      onDelete: 'CASCADE'
    },
    adjustment_type: { 
      type: 'varchar(50)', 
      notNull: true,
      comment: 'Types: percentage, fixed, override'
    },
    adjustment_value: { type: 'decimal(10,2)', notNull: true },
    priority: { type: 'integer', default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('CURRENT_TIMESTAMP') }
  });

  // Create indexes for better query performance
  pgm.createIndex('pricing_rule', ['rule_type', 'scope']);
  pgm.createIndex('pricing_rule', ['is_active']);
  pgm.createIndex('pricing_rule', ['start_date', 'end_date']);
  pgm.createIndex('tier_price', ['product_id', 'variant_id', 'quantity_min']);
  pgm.createIndex('customer_price', ['price_list_id', 'product_id', 'variant_id']);
  pgm.createIndex('customer_price_list', ['customer_id']);
  pgm.createIndex('customer_price_list', ['customer_group_id']);
};

exports.down = function(pgm) {
  // Drop tables in reverse order to respect foreign key constraints
  pgm.dropTable('customer_price');
  pgm.dropTable('customer_price_list');
  pgm.dropTable('price_list');
  pgm.dropTable('tier_price');
  pgm.dropTable('rule_condition');
  pgm.dropTable('rule_adjustment');
  pgm.dropTable('pricing_rule');
};
