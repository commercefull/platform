export const mediaTypeDefs = `#graphql
  type MediaItem {
    mediaId: String!
    fileName: String!
    mimeType: String!
    fileSize: Float!
    url: String!
    thumbnailUrl: String
    altText: String
    mediaType: String!
    createdAt: String!
  }

  type ListMediaResult {
    items: [MediaItem!]!
    total: Int!
    page: Int!
    limit: Int!
    hasMore: Boolean!
  }

  type UploadMediaResult {
    mediaId: String!
    fileName: String!
    mimeType: String!
    fileSize: Float!
    url: String!
    thumbnailUrl: String
    createdAt: String!
  }

  type DeleteMediaResult {
    deleted: Boolean!
    mediaId: String!
    deletedAt: String!
  }

  input UploadMediaInput {
    fileName: String!
    mimeType: String!
    fileSize: Float!
    filePath: String!
    url: String!
    altText: String
    caption: String
    folderId: String
    uploadedBy: String
    tags: [String!]
  }

  input ListMediaInput {
    folderId: String
    mediaType: String
    tags: [String!]
    search: String
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  type Query {
    media(input: ListMediaInput!): ListMediaResult!
  }

  type Mutation {
    uploadMedia(input: UploadMediaInput!): UploadMediaResult!
    deleteMedia(mediaId: String!, deletedBy: String, force: Boolean): DeleteMediaResult!
  }
`;
