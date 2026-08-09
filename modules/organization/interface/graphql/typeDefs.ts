export const organizationTypeDefs = `#graphql
  type Organization {
    organizationId: String!
    name: String!
    slug: String!
    type: String!
    settings: String
    createdAt: String!
    updatedAt: String!
  }

  type ListOrganizationsResult {
    organizations: [Organization!]!
    total: Int!
  }

  type CreateOrganizationResult {
    organizationId: String!
    name: String!
    slug: String!
    type: String!
  }

  input CreateOrganizationInput {
    name: String!
    slug: String!
    type: String
  }

  type Query {
    organization(organizationId: String, slug: String): Organization!
    organizations(limit: Int, offset: Int): ListOrganizationsResult!
  }

  type Mutation {
    createOrganization(input: CreateOrganizationInput!): CreateOrganizationResult!
  }
`;
