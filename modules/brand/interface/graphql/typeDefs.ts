export const brandTypeDefs = `#graphql
  type Brand {
    brandId: String!
    name: String!
    slug: String!
    description: String
    logoMediaId: String
    coverImageMediaId: String
    website: String
    countryOfOrigin: String
    isActive: Boolean!
    isFeatured: Boolean!
    sortOrder: Int!
    createdAt: String!
    updatedAt: String!
  }

  type GetBrandResult {
    brand: Brand
  }

  type ListBrandsResult {
    brands: [Brand!]!
    total: Int!
    page: Int!
    limit: Int!
  }

  type CreateBrandResult {
    brand: Brand!
  }

  type UpdateBrandResult {
    brand: Brand!
  }

  type DeleteBrandResult {
    success: Boolean!
  }

  input CreateBrandInput {
    name: String!
    slug: String
    description: String
    logoMediaId: String
    coverImageMediaId: String
    website: String
    countryOfOrigin: String
    isActive: Boolean
    isFeatured: Boolean
  }

  input UpdateBrandInput {
    brandId: String!
    name: String
    slug: String
    description: String
    logoMediaId: String
    coverImageMediaId: String
    website: String
    countryOfOrigin: String
    isActive: Boolean
    isFeatured: Boolean
    sortOrder: Int
  }

  type Query {
    brand(brandId: String, slug: String): GetBrandResult!
    brands(isActive: Boolean, isFeatured: Boolean, search: String, page: Int, limit: Int): ListBrandsResult!
  }

  type Mutation {
    createBrand(input: CreateBrandInput!): CreateBrandResult!
    updateBrand(input: UpdateBrandInput!): UpdateBrandResult!
    deleteBrand(brandId: String!): DeleteBrandResult!
  }
`;
