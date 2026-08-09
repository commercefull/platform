export const businessTypeDefs = `#graphql
  type CreateBusinessResult {
    businessId: String!
    name: String!
    slug: String!
    businessType: String!
    domain: String
    isActive: Boolean!
    createdAt: String!
  }

  input CreateBusinessInput {
    name: String!
    slug: String
    description: String
    businessType: String!
    domain: String
    logo: String
    favicon: String
    primaryColor: String
    secondaryColor: String
    theme: String
    isActive: Boolean
  }

  type Mutation {
    createBusiness(input: CreateBusinessInput!): CreateBusinessResult!
  }
`;
