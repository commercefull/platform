export const reportingTypeDefs = `#graphql
  type ReportData {
    reportType: String!
    generatedAt: String!
    data: String!
    summary: String
  }

  type ReportSchedule {
    scheduleId: String!
    name: String!
    reportType: String!
    frequency: String!
    format: String
    recipients: [String!]
    isActive: Boolean!
    createdAt: String!
  }

  type GenerateReportResult {
    reportType: String!
    generatedAt: String!
    data: String!
    summary: String
  }

  type CreateReportScheduleResult {
    scheduleId: String!
    name: String!
    reportType: String!
    frequency: String!
    format: String
    isActive: Boolean!
    createdAt: String!
  }

  type ListReportSchedulesResult {
    schedules: [ReportSchedule!]!
  }

  input GenerateReportInput {
    reportType: String!
    parameters: String!
  }

  input CreateReportScheduleInput {
    merchantId: String
    name: String!
    reportType: String!
    frequency: String!
    parameters: String
    recipients: [String!]
    format: String
  }

  type Query {
    reportSchedules(merchantId: String): ListReportSchedulesResult!
  }

  type Mutation {
    generateReport(input: GenerateReportInput!): GenerateReportResult!
    createReportSchedule(input: CreateReportScheduleInput!): CreateReportScheduleResult!
  }
`;
