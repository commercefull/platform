export const webhookTypeDefs = `#graphql
  type WebhookEndpoint {
    webhookEndpointId: String!
    name: String!
    url: String!
    events: [String!]!
    isActive: Boolean!
    organizationId: String
    createdAt: String!
  }

  type RegisterWebhookResult {
    webhookEndpointId: String!
    secret: String!
    endpoint: WebhookEndpoint!
  }

  type UnregisterWebhookResult {
    deleted: Boolean!
  }

  input RegisterWebhookInput {
    name: String!
    url: String!
    events: [String!]!
    organizationId: String
    headers: String
  }

  type Query {
    webhooks(organizationId: String, limit: Int, offset: Int): [WebhookEndpoint!]!
  }

  type Mutation {
    registerWebhook(input: RegisterWebhookInput!): RegisterWebhookResult!
    unregisterWebhook(webhookEndpointId: String!): UnregisterWebhookResult!
  }
`;
