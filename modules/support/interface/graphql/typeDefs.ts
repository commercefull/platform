export const supportTypeDefs = `#graphql
  type TicketSummary {
    ticketId: String!
    ticketNumber: String!
    subject: String!
    type: String!
    priority: String!
    status: String!
    createdAt: String!
    lastActivityAt: String
    commentCount: Int!
  }

  type GetCustomerTicketsResult {
    tickets: [TicketSummary!]!
    total: Int!
    openCount: Int!
    page: Int!
    limit: Int!
  }

  type CreateTicketResult {
    ticketId: String!
    ticketNumber: String!
    subject: String!
    type: String!
    priority: String!
    status: String!
    createdAt: String!
  }

  type UpdateTicketResult {
    ticketId: String!
    status: String!
    priority: String!
    assignedTo: String
    updatedAt: String!
  }

  type AddTicketCommentResult {
    commentId: String!
    ticketId: String!
    authorType: String!
    isInternal: Boolean!
    createdAt: String!
  }

  type FAQItem {
    faqId: String!
    question: String!
    answer: String!
    categoryName: String
    helpfulness: Float
  }

  type SearchFAQResult {
    results: [FAQItem!]!
    total: Int!
  }

  input CreateTicketInput {
    customerId: String!
    subject: String!
    description: String!
    type: String!
    priority: String
    orderId: String
    attachments: [String!]
    tags: [String!]
  }

  input UpdateTicketInput {
    ticketId: String!
    status: String
    priority: String
    assignedTo: String
    tags: [String!]
    internalNotes: String
    updatedBy: String!
  }

  input AddTicketCommentInput {
    ticketId: String!
    authorId: String!
    authorType: String!
    content: String!
    isInternal: Boolean
    attachments: [String!]
  }

  input SearchFAQInput {
    query: String!
    categoryId: String
    limit: Int
  }

  type Query {
    customerTickets(customerId: String!, status: String, type: String, page: Int, limit: Int): GetCustomerTicketsResult!
    searchFAQ(input: SearchFAQInput!): SearchFAQResult!
  }

  type Mutation {
    createTicket(input: CreateTicketInput!): CreateTicketResult!
    updateTicket(input: UpdateTicketInput!): UpdateTicketResult!
    addTicketComment(input: AddTicketCommentInput!): AddTicketCommentResult!
  }
`;
