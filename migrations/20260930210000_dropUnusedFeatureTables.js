/**
 * Drop feature tables whose repositories were deleted as dead code:
 * no router, web route, GraphQL resolver, or job references them.
 *
 * customerLoyaltyTransaction / notificationCategory / productList /
 * productListItem / productQaVote / fulfillmentRule / fulfillmentNetworkRule
 */
exports.up = async function up(knex) {
  for (const table of [
    'productListItem', // child of productList — drop first
    'productList',
    'productQaVote',
    'customerLoyaltyTransaction',
    'notificationCategory',
    'fulfillmentRule',
    'fulfillmentNetworkRule',
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
};

exports.down = async function down() {
  // Tables are intentionally not recreated — see the original create migrations.
};
