export const configurationTypeDefs = `#graphql
  type ConfigurationValue {
    key: String!
    value: String
    scope: String!
    scopeId: String
    lastUpdated: String
    updatedBy: String
  }

  type GetConfigurationResult {
    found: Boolean!
    configuration: ConfigurationValue
    inheritedFrom: String
  }

  type FeatureFlag {
    key: String!
    name: String!
    description: String
    enabled: Boolean!
    scope: String!
    rolloutPercentage: Float
  }

  type GetFeatureFlagsResult {
    flags: [FeatureFlag!]!
    total: Int!
  }

  type ToggleFeatureFlagResult {
    key: String!
    enabled: Boolean!
    scope: String!
    previousState: Boolean!
    updatedAt: String!
  }

  input GetConfigurationInput {
    key: String!
    scope: String
    scopeId: String
  }

  input GetFeatureFlagsInput {
    scope: String
    scopeId: String
    includeDisabled: Boolean
  }

  input ToggleFeatureFlagInput {
    key: String!
    enabled: Boolean!
    scope: String
    scopeId: String
    rolloutPercentage: Float
    updatedBy: String!
  }

  type Query {
    configuration(input: GetConfigurationInput!): GetConfigurationResult!
    featureFlags(input: GetFeatureFlagsInput!): GetFeatureFlagsResult!
  }

  type Mutation {
    toggleFeatureFlag(input: ToggleFeatureFlagInput!): ToggleFeatureFlagResult!
  }
`;
