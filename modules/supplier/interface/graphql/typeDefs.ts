export const supplierTypeDefs = `#graphql
  type CreateSupplierResult {
    supplierId: String!
    name: String!
    status: String!
    createdAt: String!
  }

  type CreatePurchaseOrderResult {
    purchaseOrderId: String!
    poNumber: String!
    supplierId: String!
    totalAmount: Float!
    status: String!
    createdAt: String!
  }

  type ReceiveGoodsResult {
    receivingId: String!
    purchaseOrderId: String!
    itemsReceived: Int!
    itemsDamaged: Int!
    status: String!
    receivedAt: String!
  }

  input CreateSupplierInput {
    name: String!
    email: String!
    phone: String
    contactPerson: String
    website: String
    description: String
    paymentTermsDays: Int
    leadTimeDays: Int
    minimumOrderValue: Float
    dropshipEnabled: Boolean
  }

  input PurchaseOrderItemInput {
    productId: String!
    variantId: String
    sku: String!
    name: String!
    quantity: Int!
    unitCost: Float!
  }

  input CreatePurchaseOrderInput {
    supplierId: String!
    items: [PurchaseOrderItemInput!]!
    expectedDeliveryDate: String
    notes: String
  }

  input ReceivedItemInput {
    productId: String!
    variantId: String
    quantityReceived: Int!
    quantityDamaged: Int
    notes: String
  }

  input ReceiveGoodsInput {
    purchaseOrderId: String!
    receivedItems: [ReceivedItemInput!]!
    receivedBy: String!
    warehouseId: String!
    notes: String
  }

  type Mutation {
    createSupplier(input: CreateSupplierInput!): CreateSupplierResult!
    createPurchaseOrder(input: CreatePurchaseOrderInput!): CreatePurchaseOrderResult!
    receiveGoods(input: ReceiveGoodsInput!): ReceiveGoodsResult!
  }
`;
