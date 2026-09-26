/**
 * Shared ports for Page Translation use cases
 * Narrow write port — the concrete implementation is ContentPageTranslationRepo
 */

export interface PageTranslationRecord {
  contentPageTranslationId: string;
  contentPageId: string;
  localeId: string;
  title: string;
}

export interface PageTranslationCreateParams {
  contentPageId: string;
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
  publishedAt?: string;
}

export interface PageTranslationUpdateParams {
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
  publishedAt?: Date;
}

export interface PageTranslationWritePort {
  findTranslationById(id: string): Promise<PageTranslationRecord | null>;
  createTranslation(params: PageTranslationCreateParams): Promise<PageTranslationRecord>;
  updateTranslation(id: string, params: PageTranslationUpdateParams): Promise<PageTranslationRecord>;
  deleteTranslation(id: string): Promise<boolean>;
}
