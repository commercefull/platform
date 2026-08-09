export const customerTypeDefs = `#graphql
  type CustomerAddress {
    addressId: String!
    addressLine1: String!
    addressLine2: String
    city: String!
    state: String!
    postalCode: String!
    country: String!
    addressType: String!
    isDefault: Boolean!
    phone: String
  }

  type CustomerDetail {
    customerId: String!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    phone: String
    dateOfBirth: String
    status: String!
    isActive: Boolean!
    isVerified: Boolean!
    addresses: [CustomerAddress!]!
    defaultShippingAddressId: String
    defaultBillingAddressId: String
    groupIds: [String!]!
    preferredCurrency: String
    preferredLanguage: String
    taxExempt: Boolean!
    tags: [String!]!
    lastLoginAt: String
    loginCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type RegisterCustomerResult {
    customerId: String!
    email: String!
    firstName: String!
    lastName: String!
    isVerified: Boolean!
    createdAt: String!
  }

  type Query {
    customer(customerId: String, email: String): CustomerDetail
    myProfile: CustomerDetail
  }

  type Mutation {
    registerCustomer(
      email: String!
      firstName: String!
      lastName: String!
      password: String!
      phone: String
      dateOfBirth: String
      preferredCurrency: String
      preferredLanguage: String
    ): RegisterCustomerResult!
  }
`;
