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

export class SearchFAQUseCase {
  constructor(private readonly supportRepository: any) {}

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
      results: results.map((faq: any) => ({
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
