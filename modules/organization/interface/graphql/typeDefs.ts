export const organizationTypeDefs = `#graphql
  type CreateOrganizationResult {
    organizationId: String!
    name: String!
    status: String!
    createdAt: String!
  }

  input CreateOrganizationInput {
    name: String!
    email: String!
    phone: String
    businessType: String
    taxId: String
    website: String
    description: String
    logo: String
    password: String
  }

  type Mutation {
    createOrganization(input: CreateOrganizationInput!): CreateOrganizationResult!
  }
`;
