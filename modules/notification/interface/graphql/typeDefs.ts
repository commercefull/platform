export const notificationTypeDefs = `#graphql
  type NotificationItem {
    notificationId: String!
    channel: String!
    subject: String
    content: String!
    status: String!
    isRead: Boolean!
    createdAt: String!
    readAt: String
  }

  type NotificationsResult {
    notifications: [NotificationItem!]!
    total: Int!
    unreadCount: Int!
    page: Int!
    limit: Int!
  }

  type SendNotificationResult {
    notificationId: String!
    channel: String!
    status: String!
    sentAt: String
    error: String
  }

  type MarkAsReadResult {
    markedCount: Int!
    markedAt: String!
  }

  input GetNotificationsInput {
    recipientId: String!
    recipientType: String
    channel: String
    status: String
    unreadOnly: Boolean
    page: Int
    limit: Int
  }

  input SendNotificationInput {
    recipientId: String!
    recipientType: String!
    templateId: String
    channel: String!
    subject: String
    content: String!
    priority: String
    scheduledAt: String
  }

  type Query {
    notifications(input: GetNotificationsInput!): NotificationsResult!
  }

  type Mutation {
    sendNotification(input: SendNotificationInput!): SendNotificationResult!
    markNotificationsAsRead(notificationIds: [String!]!, recipientId: String!): MarkAsReadResult!
  }
`;
