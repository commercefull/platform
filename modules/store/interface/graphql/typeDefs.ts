export const storeTypeDefs = `#graphql
  type Store {
    storeId: String!
    name: String!
    slug: String!
    description: String
    storeType: String!
    merchantId: String
    businessId: String
    storeUrl: String
    storeEmail: String
    storePhone: String
    logo: String
    banner: String
    primaryColor: String
    secondaryColor: String
    isActive: Boolean!
    isVerified: Boolean!
    isFeatured: Boolean!
    storeRating: Float
    reviewCount: Int
    productCount: Int
    defaultCurrency: String
    supportedCurrencies: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type StoreListItem {
    storeId: String!
    name: String!
    slug: String!
    storeType: String!
    merchantId: String
    businessId: String
    isHeadquarters: Boolean!
    parentStoreId: String
    storeUrl: String
    logo: String
    isActive: Boolean!
    isVerified: Boolean!
    isFeatured: Boolean!
    storeRating: Float
    productCount: Int
    createdAt: String!
  }

  type GetStoreResult {
    store: Store
  }

  type ListStoresResult {
    stores: [StoreListItem!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
  }

  type CreateStoreResult {
    storeId: String!
    name: String!
    slug: String!
    storeType: String!
  }

  input StoreFilterInput {
    storeType: String
    merchantId: String
    businessId: String
    isHeadquarters: Boolean
    parentStoreId: String
    isActive: Boolean
    isVerified: Boolean
    isFeatured: Boolean
    search: String
  }

  input StorePaginationInput {
    page: Int
    limit: Int
  }

  input CreateStoreInput {
    name: String!
    slug: String
    description: String
    storeType: String!
    merchantId: String
    businessId: String
    isHeadquarters: Boolean
    parentStoreId: String
    storeUrl: String
    storeEmail: String
    storePhone: String
    logo: String
    banner: String
    primaryColor: String
    secondaryColor: String
    isActive: Boolean
    defaultCurrency: String
    supportedCurrencies: [String!]
  }

  type Query {
    store(storeId: String, slug: String, storeUrl: String): GetStoreResult!
    stores(filters: StoreFilterInput, pagination: StorePaginationInput): ListStoresResult!
  }

  type Mutation {
    createStore(input: CreateStoreInput!): CreateStoreResult!
  }
`;
