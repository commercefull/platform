/**
 * Get Product Catalog Enrichment Use Case
 * Returns a product with its categories, tags, and Q&A
 */

import type {
  ProductQa,
  ProductQaAnswer,
  ProductQaStatus,
  ProductQaPort,
  ProductQaAnswerPort,
  ProductLookupPort,
  ProductToCategoryPort,
  ProductCategoryPort,
  ProductCategoryRow,
  ProductTag,
  ProductTagPort,
} from '../../domain/repositories/ProductCatalogPorts';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Command
// ============================================================================

export class GetProductCatalogEnrichmentCommand {
  constructor(
    public readonly productId: string,
    /** Only return approved Q&A entries (default: true) */
    public readonly approvedQaOnly: boolean = true,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

interface QaWithAnswers extends ProductQa {
  answers: ProductQaAnswer[];
}

export interface ProductCatalogEnrichmentResponse {
  product: { productId: string; name: string; status: string };
  categories: ProductCategoryRow[];
  tags: ProductTag[];
  qa: QaWithAnswers[];
}
export interface GetProductCatalogEnrichmentUseCaseDeps {
  productRepo: ProductLookupPort;
  productToCategoryRepo: ProductToCategoryPort;
  productCategoryRepo: ProductCategoryPort;
  productTagRepo: ProductTagPort;
  productQaRepo: ProductQaPort;
  productQaAnswerRepo: ProductQaAnswerPort;
}

// ============================================================================
// Use Case
// ============================================================================

export class GetProductCatalogEnrichmentUseCase {
  constructor(private readonly deps: GetProductCatalogEnrichmentUseCaseDeps) {}

  async execute(command: GetProductCatalogEnrichmentCommand): Promise<ProductCatalogEnrichmentResponse> {
    if (!command.productId) {
      throw new ProductValidationError('productId is required');
    }

    const product = await this.deps.productRepo.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    // Fetch category mappings and resolve full category objects
    const categoryMappings = await this.deps.productToCategoryRepo.findByProduct(command.productId);
    const categories: ProductCategoryRow[] = [];
    for (const mapping of categoryMappings) {
      const category = await this.deps.productCategoryRepo.findById(mapping.productCategoryId);
      if (category) {
        categories.push(category);
      }
    }

    // Fetch all active tags — product-level tag associations are stored on the
    // DDD Product entity; the legacy repo does not expose them directly.
    const tags = await this.deps.productTagRepo.findAll();

    // Fetch Q&A questions with their answers
    const qaStatus: ProductQaStatus | undefined = command.approvedQaOnly ? 'answered' : undefined;
    const questions = await this.deps.productQaRepo.findByProduct(command.productId, qaStatus);

    const qa: QaWithAnswers[] = [];
    for (const question of questions) {
      const answers = await this.deps.productQaAnswerRepo.findByQuestion(
        question.productQaId,
        command.approvedQaOnly ? 'answered' : undefined,
      );
      qa.push({ ...question, answers });
    }

    return { product, categories, tags, qa };
  }
}
