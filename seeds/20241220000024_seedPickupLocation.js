/**
 * Test Pickup Location (BOPIS) — attached to "Active Test Store".
 * Runs after 20241220000022_seedStoreTestData.js since
 * storePickupLocation.storeId references store.
 */
exports.seed = async function (knex) {
  const TEST_PICKUP_LOCATION_ID = '00000000-0000-0000-0000-000000003010';
  const ACTIVE_STORE_ID = '20000000-0000-0000-0000-000000000001';

  await knex('storePickupLocation')
    .insert({
      pickupLocationId: TEST_PICKUP_LOCATION_ID,
      storeId: ACTIVE_STORE_ID,
      name: 'Downtown Pickup Counter',
      addressLine1: '500 Commerce St',
      addressLine2: 'Suite 10',
      city: 'Portland',
      state: 'OR',
      postalCode: '97201',
      country: 'US',
      latitude: 45.5152,
      longitude: -122.6784,
      operatingHours: JSON.stringify({
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '16:00' },
        sunday: { open: '10:00', close: '16:00' },
      }),
      contactPhone: '555-900-0001',
      contactEmail: 'pickup@example.com',
      instructions: 'Bring order confirmation and ID',
      maxOrdersPerSlot: 10,
      prepareTimeMinutes: 60,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflict('pickupLocationId')
    .ignore();
};
