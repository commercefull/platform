// ============================================================================
// Request Body Interfaces
// ============================================================================

export interface CreateContentTypeBody {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  allowedBlocks?: string[];
  defaultTemplate?: string;
  requiredFields?: string[];
  metaFields?: Record<string, unknown>;
  isSystem?: boolean;
  isActive?: boolean;
}

export interface UpdateContentTypeBody {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  requiredFields?: string[];
  metaFields?: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreatePageBody {
  title: string;
  slug: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  publishedAt?: string;
  layout?: string;
  contentTypeId: string;
  visibility?: string;
}

export interface UpdatePageBody {
  title?: string;
  slug?: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  publishedAt?: string;
  layout?: string;
}

export interface CreateBlockBody {
  contentPageId: string;
  blockTypeId: string;
  title?: string;
  area?: string;
  sortOrder: number;
  content: Record<string, unknown>;
  isVisible?: boolean;
}

export interface UpdateBlockBody {
  blockTypeId?: string;
  title?: string;
  area?: string;
  sortOrder?: number;
  content?: Record<string, unknown>;
  isVisible?: boolean;
}

export interface ReorderBlocksBody {
  blockOrders: Array<{ id: string; order: number }>;
}

export interface CreateTemplateBody {
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  htmlStructure?: string;
  cssStyles?: string;
  jsScripts?: string;
  areas?: Record<string, unknown>;
  defaultBlocks?: Record<string, unknown>;
  compatibleContentTypes?: string[];
  isSystem?: boolean;
  isActive?: boolean;
}

export interface UpdateTemplateBody {
  name?: string;
  slug?: string;
  description?: string;
  htmlStructure?: string;
  areas?: Record<string, unknown>;
  isActive?: boolean;
}

export interface DuplicateTemplateBody {
  name: string;
  slug: string;
}

export interface SchedulePageBody {
  scheduledAt: string;
}

export interface DuplicatePageBody {
  title: string;
  slug: string;
}

export interface CreateCategoryBody {
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryBody {
  name?: string;
  slug?: string;
  description?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface MoveCategoryBody {
  newParentId: string | null;
}

export interface CreateNavigationBody {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

export interface UpdateNavigationBody {
  name?: string;
  slug?: string;
  description?: string;
  location?: string;
  isActive?: boolean;
}

export interface AddNavigationItemBody {
  parentId?: string;
  title: string;
  type: string;
  url?: string;
  contentPageId?: string;
  targetId?: string;
  targetSlug?: string;
  icon?: string;
  cssClasses?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  conditions?: Record<string, unknown>;
}

export interface UpdateNavigationItemBody {
  title?: string;
  type?: string;
  url?: string;
  contentPageId?: string;
  icon?: string;
  openInNewTab?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ReorderNavigationItemsBody {
  itemOrders: Array<{ id: string; order: number }>;
}

export interface UploadMediaBody {
  title: string;
  fileName: string;
  filePath?: string;
  fileType?: string;
  fileSize?: number;
  url: string;
  width?: number;
  height?: number;
  duration?: number;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  thumbnailUrl?: string;
  tags?: string[];
  isExternal?: boolean;
  externalService?: string;
  externalId?: string;
}

export interface UpdateMediaBody {
  title?: string;
  altText?: string;
  caption?: string;
  description?: string;
  folderId?: string;
  tags?: string[];
  sortOrder?: number;
}

export interface MoveMediaToFolderBody {
  mediaIds: string[];
  folderId?: string;
}

export interface CreateMediaFolderBody {
  name: string;
  parentId?: string;
}

export interface UpdateMediaFolderBody {
  name?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface CreateRedirectBody {
  sourceUrl: string;
  targetUrl: string;
  statusCode?: number | string;
  isRegex?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateRedirectBody {
  sourceUrl?: string;
  targetUrl?: string;
  statusCode?: string;
  isRegex?: boolean;
  isActive?: boolean;
  notes?: string;
}

export interface CreatePageVersionBody {
  comment?: string;
}

export interface CreatePageTranslationBody {
  localeId: string;
  title: string;
  slug?: string;
  summary?: string;
  content?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  featuredImage?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
  isApproved?: boolean;
  isPublished?: boolean;
}

export interface UpdatePageTranslationBody {
  title?: string;
  slug?: string;
  summary?: string;
  content?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  openGraphTitle?: string;
  openGraphDescription?: string;
  featuredImage?: string;
  isAutoTranslated?: boolean;
  translationSource?: string;
  isApproved?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
}

export interface AssignCategoryBody {
  categoryId: string;
  isPrimary?: boolean;
}

export interface SetPrimaryCategoryBody {
  categorizationId: string;
}

export interface TrackMediaUsageBody {
  mediaId: string;
  entityType: 'contentPage' | 'contentBlock' | 'product' | 'category' | 'organization' | 'blog';
  entityId: string;
  field?: string;
  sortOrder?: number;
}
