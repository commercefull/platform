export interface FaqArticleRecord {
  faqArticleId: string;
  faqCategoryId?: string;
  title: string;
  slug?: string;
  content: string;
  contentHtml?: string;
  excerpt?: string;
  keywords?: string[];
  relatedArticleIds?: string[];
  views: number;
  uniqueViews: number;
  helpfulYes: number;
  helpfulNo: number;
  helpfulScore: number;
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
  isPinned: boolean;
  publishedAt?: Date;
  authorId?: string;
  authorName?: string;
  lastEditedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqArticleFilters {
  faqCategoryId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface FaqCategoryRecord {
  faqCategoryId: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentId?: string;
  metadata?: Record<string, unknown>;
}

export interface FaqPort {
  getArticles(
    filters?: FaqArticleFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: FaqArticleRecord[]; total: number }>;
  getArticle(faqArticleId: string): Promise<FaqArticleRecord | null>;
  saveArticle(article: Partial<FaqArticleRecord> & { title: string; content: string }): Promise<FaqArticleRecord>;
  publishArticle(faqArticleId: string): Promise<void>;
  unpublishArticle(faqArticleId: string): Promise<void>;
  deleteArticle(faqId: string): Promise<void>;
  getCategories(activeOnly?: boolean): Promise<FaqCategoryRecord[]>;
  getFeaturedCategories(): Promise<FaqCategoryRecord[]>;
  getCategoryBySlug(slug: string): Promise<FaqCategoryRecord | null>;
  getArticleBySlug(slug: string): Promise<FaqArticleRecord | null>;
  searchArticles(searchQuery: string, limit?: number): Promise<FaqArticleRecord[]>;
  getPopularArticles(limit?: number): Promise<FaqArticleRecord[]>;
  getRelatedArticles(faqArticleId: string, limit?: number): Promise<FaqArticleRecord[]>;
  incrementViews(faqArticleId: string, isUnique?: boolean): Promise<void>;
  submitHelpfulVote(faqArticleId: string, isHelpful: boolean): Promise<void>;
  getCategory(faqCategoryId: string): Promise<FaqCategoryRecord | null>;
  saveCategory(category: Partial<FaqCategoryRecord> & { name: string }): Promise<FaqCategoryRecord>;
  deleteCategory(faqCategoryId: string): Promise<void>;
}


export class ManageFaqUseCase {
  constructor(private readonly faqRepo: FaqPort) {}

  async getArticles(filters?: FaqArticleFilters, pagination?: { limit?: number; offset?: number }) {
    return this.faqRepo.getArticles(filters, pagination);
  }
  async getArticle(faqArticleId: string) {
    return this.faqRepo.getArticle(faqArticleId);
  }
  async saveArticle(params: Partial<FaqArticleRecord> & { title: string; content: string }) {
    return this.faqRepo.saveArticle(params);
  }
  async publishArticle(faqArticleId: string) {
    return this.faqRepo.publishArticle(faqArticleId);
  }
  async unpublishArticle(faqArticleId: string) {
    return this.faqRepo.unpublishArticle(faqArticleId);
  }
  async deleteArticle(faqId: string) {
    return this.faqRepo.deleteArticle(faqId);
  }
  async getCategories(activeOnly?: boolean) {
    return this.faqRepo.getCategories(activeOnly);
  }
  async getFeaturedCategories() {
    return this.faqRepo.getFeaturedCategories();
  }
  async getCategoryBySlug(slug: string) {
    return this.faqRepo.getCategoryBySlug(slug);
  }
  async getArticleBySlug(slug: string) {
    return this.faqRepo.getArticleBySlug(slug);
  }
  async searchArticles(searchQuery: string, limit?: number) {
    return this.faqRepo.searchArticles(searchQuery, limit);
  }
  async getPopularArticles(limit?: number) {
    return this.faqRepo.getPopularArticles(limit);
  }
  async getRelatedArticles(faqArticleId: string, limit?: number) {
    return this.faqRepo.getRelatedArticles(faqArticleId, limit);
  }
  async incrementViews(faqArticleId: string, isUnique?: boolean) {
    return this.faqRepo.incrementViews(faqArticleId, isUnique);
  }
  async submitHelpfulVote(faqArticleId: string, isHelpful: boolean) {
    return this.faqRepo.submitHelpfulVote(faqArticleId, isHelpful);
  }
  async getCategory(faqCategoryId: string) {
    return this.faqRepo.getCategory(faqCategoryId);
  }
  async saveCategory(params: Partial<FaqCategoryRecord> & { name: string }) {
    return this.faqRepo.saveCategory(params);
  }
  async deleteCategory(faqCategoryId: string) {
    return this.faqRepo.deleteCategory(faqCategoryId);
  }
}
