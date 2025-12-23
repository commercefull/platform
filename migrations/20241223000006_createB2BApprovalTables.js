/**
 * Migration: Create B2B Approval Workflow Tables
 */

exports.up = async function(knex) {
  // Create b2b_approval_workflow table
  await knex.schema.createTable('b2bApprovalWorkflow', (table) => {
    table.string('workflowId').primary();
    table.string('companyId').notNullable();
    table.string('name').notNullable();
    table.string('triggerType').notNullable(); // order, quote, purchase_order, credit_request
    table.jsonb('conditions').defaultTo('[]');
    table.jsonb('steps').notNullable();
    table.integer('escalationTimeoutHours').defaultTo(48);
    table.string('escalationAction').defaultTo('notify_manager'); // notify_manager, auto_approve, auto_reject
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['companyId']);
    table.index(['triggerType']);
    table.index(['isActive']);
  });

  // Create b2b_approval_request table
  await knex.schema.createTable('b2bApprovalRequest', (table) => {
    table.string('requestId').primary();
    table.string('workflowId').notNullable().references('workflowId').inTable('b2bApprovalWorkflow');
    table.string('companyId').notNullable();
    table.string('requestType').notNullable(); // order, quote, purchase_order, credit_request
    table.string('referenceId').notNullable(); // orderId, quoteId, etc.
    table.string('requestedById').notNullable();
    table.decimal('amount', 12, 2);
    table.string('currency').defaultTo('USD');
    table.integer('currentStep').defaultTo(0);
    table.string('status').defaultTo('pending'); // pending, approved, rejected, escalated, cancelled
    table.text('notes');
    table.timestamp('submittedAt').defaultTo(knex.fn.now());
    table.timestamp('completedAt');
    table.timestamp('escalatedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['companyId']);
    table.index(['status']);
    table.index(['requestType', 'referenceId']);
    table.index(['requestedById']);
  });

  // Create b2b_approval_action table (approval history)
  await knex.schema.createTable('b2bApprovalAction', (table) => {
    table.string('actionId').primary();
    table.string('requestId').notNullable().references('requestId').inTable('b2bApprovalRequest').onDelete('CASCADE');
    table.integer('stepNumber').notNullable();
    table.string('actionType').notNullable(); // approve, reject, escalate, comment
    table.string('actionById').notNullable();
    table.string('actionByRole');
    table.text('comments');
    table.timestamp('actionAt').defaultTo(knex.fn.now());
    
    table.index(['requestId']);
    table.index(['actionById']);
  });

  // Create b2b_price_list table
  await knex.schema.createTable('b2bPriceList', (table) => {
    table.string('priceListId').primary();
    table.string('name').notNullable();
    table.text('description');
    table.jsonb('companyIds').defaultTo('[]');
    table.jsonb('companyTiers').defaultTo('[]');
    table.decimal('baseDiscountPercent', 5, 2);
    table.jsonb('categoryDiscounts');
    table.jsonb('volumeTiers');
    table.string('contractId');
    table.timestamp('validFrom').notNullable();
    table.timestamp('validTo').notNullable();
    table.integer('paymentTermsDays').defaultTo(30);
    table.decimal('minOrderValue', 12, 2);
    table.decimal('freeShippingThreshold', 12, 2);
    table.boolean('isActive').defaultTo(true);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['isActive']);
    table.index(['validFrom', 'validTo']);
  });

  // Create b2b_price_list_item table
  await knex.schema.createTable('b2bPriceListItem', (table) => {
    table.string('priceListItemId').primary();
    table.string('priceListId').notNullable().references('priceListId').inTable('b2bPriceList').onDelete('CASCADE');
    table.string('productId').notNullable();
    table.string('variantId');
    table.decimal('price', 12, 2).notNullable();
    table.decimal('minQuantity', 12, 2).defaultTo(1);
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.unique(['priceListId', 'productId', 'variantId']);
    table.index(['productId']);
  });

  // Create b2b_purchase_order table
  await knex.schema.createTable('b2bPurchaseOrder', (table) => {
    table.string('purchaseOrderId').primary();
    table.string('companyId').notNullable();
    table.string('buyerId').notNullable();
    table.string('poNumber').notNullable();
    table.string('status').defaultTo('draft'); // draft, pending_approval, approved, submitted, acknowledged, fulfilled, invoiced, paid, cancelled
    table.decimal('subtotal', 12, 2).notNullable();
    table.decimal('tax', 12, 2).defaultTo(0);
    table.decimal('shipping', 12, 2).defaultTo(0);
    table.decimal('total', 12, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.jsonb('shippingAddress').notNullable();
    table.jsonb('billingAddress').notNullable();
    table.string('paymentTerms');
    table.timestamp('requestedDeliveryDate');
    table.timestamp('actualDeliveryDate');
    table.string('approvalRequestId');
    table.text('notes');
    table.timestamp('submittedAt');
    table.timestamp('acknowledgedAt');
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    table.timestamp('updatedAt').defaultTo(knex.fn.now());
    
    table.index(['companyId']);
    table.index(['buyerId']);
    table.index(['status']);
    table.index(['poNumber']);
  });

  // Create b2b_purchase_order_item table
  await knex.schema.createTable('b2bPurchaseOrderItem', (table) => {
    table.string('purchaseOrderItemId').primary();
    table.string('purchaseOrderId').notNullable().references('purchaseOrderId').inTable('b2bPurchaseOrder').onDelete('CASCADE');
    table.string('productId').notNullable();
    table.string('variantId');
    table.string('sku').notNullable();
    table.string('name').notNullable();
    table.integer('quantity').notNullable();
    table.decimal('unitPrice', 12, 2).notNullable();
    table.decimal('discount', 12, 2).defaultTo(0);
    table.decimal('total', 12, 2).notNullable();
    table.timestamp('createdAt').defaultTo(knex.fn.now());
    
    table.index(['purchaseOrderId']);
    table.index(['productId']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('b2bPurchaseOrderItem');
  await knex.schema.dropTableIfExists('b2bPurchaseOrder');
  await knex.schema.dropTableIfExists('b2bPriceListItem');
  await knex.schema.dropTableIfExists('b2bPriceList');
  await knex.schema.dropTableIfExists('b2bApprovalAction');
  await knex.schema.dropTableIfExists('b2bApprovalRequest');
  await knex.schema.dropTableIfExists('b2bApprovalWorkflow');
};
