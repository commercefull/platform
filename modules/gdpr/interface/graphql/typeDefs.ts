export const gdprTypeDefs = `#graphql
  type CreateDataRequestResult {
    gdprDataRequestId: String!
    requestType: String!
    status: String!
    deadlineAt: String!
    createdAt: String!
  }

  type ProcessDataRequestResult {
    gdprDataRequestId: String!
    status: String!
    processedAt: String
    downloadUrl: String
    notes: String
  }

  type CookieConsentResult {
    gdprCookieConsentId: String!
    consentedAt: String!
    expiresAt: String
  }

  input CreateDataRequestInput {
    customerId: String!
    requestType: String!
    reason: String
    requestedData: [String!]
    ipAddress: String
    userAgent: String
  }

  input ProcessDataRequestInput {
    gdprDataRequestId: String!
    adminId: String!
    action: String!
    format: String
    notes: String
    reason: String
  }

  input RecordCookieConsentInput {
    sessionId: String!
    preferences: CookiePreferencesInput!
    customerId: String
    ipAddress: String
    userAgent: String
    country: String
    region: String
    consentMethod: String
  }

  input CookiePreferencesInput {
    necessary: Boolean
    functional: Boolean
    analytics: Boolean
    marketing: Boolean
  }

  type Mutation {
    createDataRequest(input: CreateDataRequestInput!): CreateDataRequestResult!
    processDataRequest(input: ProcessDataRequestInput!): ProcessDataRequestResult!
    recordCookieConsent(input: RecordCookieConsentInput!): CookieConsentResult!
  }
`;
