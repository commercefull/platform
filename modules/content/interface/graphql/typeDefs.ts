export const contentTypeDefs = `#graphql
  type ContentPage {
    contentPageId: String!
    title: String!
    slug: String!
    contentTypeId: String!
    templateId: String
    status: String!
    visibility: String!
    summary: String
    isHomePage: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type CreatePageResult {
    contentPageId: String!
    title: String!
    slug: String!
    contentTypeId: String!
    templateId: String
    status: String!
    visibility: String!
    summary: String
    isHomePage: Boolean
    createdAt: String!
    updatedAt: String!
  }

  type UpdatePageResult {
    contentPageId: String!
    title: String!
    slug: String!
    status: String!
    updatedAt: String!
  }

  type PublishPageResult {
    contentPageId: String!
    title: String!
    slug: String!
    status: String!
    publishedAt: String
  }

  input CreatePageInput {
    title: String!
    slug: String!
    contentTypeId: String!
    templateId: String
    status: String
    visibility: String
    summary: String
    featuredImage: String
    parentId: String
    metaTitle: String
    metaDescription: String
    metaKeywords: String
    publishedAt: String
    scheduledAt: String
    isHomePage: Boolean
    createdBy: String
  }

  input UpdatePageInput {
    pageId: String!
    title: String
    slug: String
    templateId: String
    status: String
    visibility: String
    summary: String
    featuredImage: String
    metaTitle: String
    metaDescription: String
    metaKeywords: String
    publishedAt: String
    scheduledAt: String
    isHomePage: Boolean
    updatedBy: String
  }

  type Mutation {
    createPage(input: CreatePageInput!): CreatePageResult!
    updatePage(input: UpdatePageInput!): UpdatePageResult!
    publishPage(pageId: String!, publishedBy: String): PublishPageResult!
  }
`;
