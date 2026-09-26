/**
 * Shared ports for Page Categorization use cases
 * Narrow write port — the concrete implementation is ContentCategorizationRepo
 */

export interface CategorizationRecord {
  contentCategorizationId: string;
  contentPageId: string;
  categoryId: string;
  isPrimary: boolean;
}

export interface CategorizationWritePort {
  createCategorization(params: {
    contentPageId: string;
    categoryId: string;
    isPrimary?: boolean;
  }): Promise<CategorizationRecord>;
  deleteCategorizationByPageAndCategory(pageId: string, categoryId: string): Promise<boolean>;
  setPrimaryCategory(pageId: string, categorizationId: string): Promise<CategorizationRecord>;
}
