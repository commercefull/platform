/**
 * SearchFAQ Use Case
 */

export interface SearchFAQInput {
  query: string;
  categoryId?: string;
  limit?: number;
}

export interface FAQItem {
  faqId: string;
  question: string;
  answer: string;
  categoryName?: string;
  helpfulness?: number;
}

export interface SearchFAQOutput {
  results: FAQItem[];
  total: number;
}

interface FaqRecord {
  faqId: string;
  question: string;
  answer: string;
  categoryName?: string;
  helpfulness?: number;
}

interface SupportRepository {
  searchFAQ(params: { query: string; categoryId?: string; limit: number }): Promise<FaqRecord[]>;
}

export class SearchFAQUseCase {
  constructor(private readonly supportRepository: SupportRepository) {}

  async execute(input: SearchFAQInput): Promise<SearchFAQOutput> {
    if (!input.query || input.query.trim().length < 2) {
      return { results: [], total: 0 };
    }

    const limit = input.limit || 10;

    const results = await this.supportRepository.searchFAQ({
      query: input.query.trim(),
      categoryId: input.categoryId,
      limit,
    });

    return {
      results: results.map((faq: FaqRecord) => ({
        faqId: faq.faqId,
        question: faq.question,
        answer: faq.answer,
        categoryName: faq.categoryName,
        helpfulness: faq.helpfulness,
      })),
      total: results.length,
    };
  }
}
