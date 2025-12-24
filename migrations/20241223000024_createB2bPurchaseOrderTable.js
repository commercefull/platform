/**
 * Migration: Create B2B Purchase Order Table
 */

exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('b2bPurchaseOrder');
  if (hasTable) return;

  await knex.schema.createTable('b2bPurchaseOrder', table => {
    table.uuid('purchaseOrderId').primary().defaultTo(knex.raw('uuidv7()'));
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
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('b2bPurchaseOrder');
};
