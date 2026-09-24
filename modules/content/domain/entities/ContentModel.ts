/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type ContentBlockRecord = {
  contentBlockId: string;
  contentPageId: string;
  blockTypeId: string;
  title: string | null;
  area: string;
  sortOrder: number;
  content: Record<string, unknown>;
  settings: Record<string, unknown> | null;
  isVisible: boolean;
  cssClasses: string | null;
  conditions: unknown | null;
  parentBlockId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentBlockType = {
  contentBlockTypeId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  category: string | null;
  defaultConfig: unknown | null;
  schema: unknown | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentPageRecord = {
  contentPageId: string;
  title: string;
  slug: string;
  contentTypeId: string;
  templateId: string | null;
  status: string;
  visibility: string;
  accessPassword: string | null;
  summary: string | null;
  featuredImage: string | null;
  parentId: string | null;
  sortOrder: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  openGraphImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean | null;
  customFields: unknown | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  expiresAt: Date | null;
  isHomePage: boolean | null;
  path: string | null;
  depth: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  publishedBy: string | null;
}

export type ContentTemplate = {
  contentTemplateId: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  htmlStructure: string | null;
  cssStyles: string | null;
  jsScripts: string | null;
  areas: unknown | null;
  defaultBlocks: unknown | null;
  compatibleContentTypes: string[] | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentTypeRecord = {
  contentTypeId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  allowedBlocks: string[] | null;
  defaultTemplate: string | null;
  requiredFields: unknown | null;
  metaFields: unknown | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentCategory = {
  contentCategoryId: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  featuredImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  isActive: boolean;
  path: string | null;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentNavigation = {
  contentNavigationId: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentNavigationItem = {
  contentNavigationItemId: string;
  navigationId: string;
  parentId: string | null;
  title: string;
  type: string;
  url: string | null;
  contentPageId: string | null;
  targetId: string | null;
  targetSlug: string | null;
  icon: string | null;
  cssClasses: string | null;
  openInNewTab: boolean;
  isActive: boolean;
  sortOrder: number;
  conditions: unknown | null;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ContentMedia = {
  contentMediaId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  caption: string | null;
  description: string | null;
  contentMediaFolderId: string | null;
  url: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  tags: string[] | null;
  isExternal: boolean;
  externalService: string | null;
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentMediaFolder = {
  contentMediaFolderId: string;
  name: string;
  parentId: string | null;
  path: string | null;
  depth: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

export type ContentRedirect = {
  contentRedirectId: string;
  sourceUrl: string;
  targetUrl: string;
  statusCode: string;
  isRegex: boolean;
  isActive: boolean;
  hits: number;
  lastUsed: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

