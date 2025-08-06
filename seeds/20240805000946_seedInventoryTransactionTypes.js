/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('inventory_transaction_type').insert([
    { code: 'RECEIVE', name: 'Receive Stock', description: 'Receiving new inventory', affects_available: true, direction: 'in' },
    { code: 'SHIP', name: 'Ship Order', description: 'Shipping products for orders', affects_available: true, direction: 'out' },
    { code: 'ADJUST_UP', name: 'Adjust Up', description: 'Positive inventory adjustment', affects_available: true, direction: 'adjust' },
    { code: 'ADJUST_DOWN', name: 'Adjust Down', description: 'Negative inventory adjustment', affects_available: true, direction: 'adjust' },
    { code: 'TRANSFER_OUT', name: 'Transfer Out', description: 'Transfer to another warehouse', affects_available: true, direction: 'out' },
    { code: 'TRANSFER_IN', name: 'Transfer In', description: 'Transfer from another warehouse', affects_available: true, direction: 'in' },
    { code: 'RETURN', name: 'Customer Return', description: 'Return from customer', affects_available: true, direction: 'in' },
    { code: 'DAMAGE', name: 'Damage Write-Off', description: 'Inventory lost to damage', affects_available: true, direction: 'out' },
    { code: 'EXPIRE', name: 'Expiry Write-Off', description: 'Inventory expired', affects_available: true, direction: 'out' },
    { code: 'RESERVE', name: 'Reserve Stock', description: 'Reserve inventory for orders', affects_available: false, direction: 'adjust' },
    { code: 'UNRESERVE', name: 'Unreserve Stock', description: 'Release reserved inventory', affects_available: false, direction: 'adjust' },
    { code: 'COUNT', name: 'Inventory Count', description: 'Adjustment from physical count', affects_available: true, direction: 'adjust' }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('inventory_transaction_type').whereIn('code', [
    'RECEIVE', 'SHIP', 'ADJUST_UP', 'ADJUST_DOWN', 'TRANSFER_OUT', 'TRANSFER_IN', 'RETURN', 'DAMAGE', 'EXPIRE', 'RESERVE', 'UNRESERVE', 'COUNT'
  ]).delete();
};
