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

export interface FaqPort {
  getArticles(
    filters?: FaqArticleFilters,
    pagination?: { limit?: number; offset?: number },
  ): Promise<{ data: FaqArticleRecord[]; total: number }>;
  saveArticle(article: Partial<FaqArticleRecord> & { title: string; content: string }): Promise<FaqArticleRecord>;
  deleteArticle(faqId: string): Promise<void>;
}


export class ManageFaqUseCase {
  constructor(private readonly faqRepo: FaqPort) {}

  async getArticles(filters?: FaqArticleFilters, pagination?: { limit?: number; offset?: number }) {
    return this.faqRepo.getArticles(filters, pagination);
  }
  async saveArticle(params: Partial<FaqArticleRecord> & { title: string; content: string }) {
    return this.faqRepo.saveArticle(params);
  }
  async deleteArticle(faqId: string) {
    return this.faqRepo.deleteArticle(faqId);
  }
}
