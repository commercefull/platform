/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex('shipping_carrier').insert([
    { name: 'UPS', code: 'UPS', description: 'United Parcel Service', tracking_url: 'https://www.ups.com/track?tracknum={tracking_number}', is_active: true },
    { name: 'FedEx', code: 'FEDEX', description: 'Federal Express', tracking_url: 'https://www.fedex.com/apps/fedextrack/?tracknumbers={tracking_number}', is_active: true },
    { name: 'USPS', code: 'USPS', description: 'United States Postal Service', tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}', is_active: true },
    { name: 'DHL', code: 'DHL', description: 'DHL Express', tracking_url: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}', is_active: true },
    { name: 'Custom', code: 'CUSTOM', description: 'Custom or manual shipping methods', tracking_url: '', is_active: true }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex('shipping_carrier').whereIn('code', ['UPS', 'FEDEX', 'USPS', 'DHL', 'CUSTOM']).delete();
};
