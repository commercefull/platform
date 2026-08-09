export const identityTypeDefs = `#graphql
  type AuthResponse {
    userId: String!
    email: String!
    userType: String!
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
  }

  input LoginInput {
    email: String!
    password: String!
    ip: String
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  type Query {
    refreshToken(input: RefreshTokenInput!): AuthResponse!
  }

  type Mutation {
    login(input: LoginInput!): AuthResponse!
    logout(userId: String!): Boolean!
  }
`;
