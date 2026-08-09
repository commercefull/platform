export const inventoryTypeDefs = `#graphql
  type InventoryItemDetails {
    inventoryItemId: String!
    productId: String!
    variantId: String
    warehouseId: String!
    warehouseName: String
    sku: String!
    quantity: Int!
    reservedQuantity: Int!
    availableQuantity: Int!
    reorderPoint: Int!
    reorderQuantity: Int!
    binLocation: String
    costPrice: Float
    isLowStock: Boolean!
    isOutOfStock: Boolean!
    lastUpdated: String
  }

  type InventoryItemSummary {
    inventoryItemId: String!
    productId: String!
    variantId: String
    warehouseId: String!
    sku: String!
    quantity: Int!
    reservedQuantity: Int!
    availableQuantity: Int!
    isLowStock: Boolean!
    isOutOfStock: Boolean!
  }

  type InventoryListResult {
    items: [InventoryItemSummary!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
    summary: InventorySummary!
  }

  type InventorySummary {
    totalItems: Int!
    lowStockCount: Int!
    outOfStockCount: Int!
    totalValue: Float
  }

  type GetInventoryItemResult {
    found: Boolean!
    item: InventoryItemDetails
  }

  type LowStockItemsResult {
    items: [InventoryItemSummary!]!
    total: Int!
    criticalCount: Int!
  }

  type OutOfStockItemsResult {
    items: [InventoryItemSummary!]!
    total: Int!
    hasReservedStock: Int!
  }

  type ReservationResultItem {
    productId: String!
    variantId: String
    sku: String
    requestedQuantity: Int!
    reservedQuantity: Int!
    availableQuantity: Int!
    isFullyReserved: Boolean!
    locationId: String
  }

  type ReserveStockResult {
    reservationId: String!
    orderId: String!
    results: [ReservationResultItem!]!
    allReserved: Boolean!
    expiresAt: String!
  }

  input ReserveStockItemInput {
    productId: String!
    variantId: String
    sku: String
    quantity: Int!
    locationId: String
  }

  input ListInventoryInput {
    warehouseId: String
    productId: String
    lowStockOnly: Boolean
    outOfStockOnly: Boolean
    search: String
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  type Query {
    inventoryItem(inventoryItemId: String, sku: String, productId: String, variantId: String, warehouseId: String): GetInventoryItemResult!
    inventoryItems(input: ListInventoryInput): InventoryListResult!
    lowStockItems(warehouseId: String, threshold: Int, page: Int, limit: Int): LowStockItemsResult!
    outOfStockItems(warehouseId: String, includeReserved: Boolean, page: Int, limit: Int): OutOfStockItemsResult!
  }

  type Mutation {
    reserveStock(
      orderId: String!
      items: [ReserveStockItemInput!]!
      expiresAt: String
      channelId: String
      storeId: String
    ): ReserveStockResult!
  }
`;
