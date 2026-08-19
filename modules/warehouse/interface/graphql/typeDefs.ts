export const warehouseTypeDefs = `#graphql
  type WarehouseDetails {
    warehouseId: String!
    name: String!
    code: String!
    type: String!
    organizationId: String
    timezone: String!
    cutoffTime: String
    processingTime: Int!
    isActive: Boolean!
    isDefault: Boolean!
    capabilities: [String!]!
    supportedCarriers: [String!]!
    maxCapacity: Int
    currentCapacity: Int
    createdAt: String!
    updatedAt: String!
  }

  type WarehouseSummary {
    warehouseId: String!
    name: String!
    code: String!
    type: String!
    city: String!
    countryCode: String!
    isActive: Boolean!
    isDefault: Boolean!
    currentCapacity: Int
    maxCapacity: Int
  }

  type GetWarehouseResult {
    warehouse: WarehouseDetails
  }

  type ListWarehousesResult {
    warehouses: [WarehouseSummary!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type CreateWarehouseResult {
    warehouseId: String!
    name: String!
    code: String!
    type: String!
    isActive: Boolean!
    createdAt: String!
  }

  input GetWarehouseInput {
    warehouseId: String
    code: String
  }

  input ListWarehousesInput {
    type: String
    organizationId: String
    isActive: Boolean
    page: Int
    limit: Int
  }

  input CreateWarehouseInput {
    name: String!
    code: String!
    type: String!
    organizationId: String
    timezone: String
    cutoffTime: String
    processingTime: Int
    isActive: Boolean
    isDefault: Boolean
    capabilities: [String!]
    supportedCarriers: [String!]
    maxCapacity: Int
  }

  type Query {
    warehouse(input: GetWarehouseInput!): GetWarehouseResult!
    warehouses(input: ListWarehousesInput): ListWarehousesResult!
  }

  type Mutation {
    createWarehouse(input: CreateWarehouseInput!): CreateWarehouseResult!
  }
`;
