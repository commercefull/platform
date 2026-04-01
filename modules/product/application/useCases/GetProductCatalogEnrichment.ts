/**
 * Get Product Catalog Enrichment Use Case
 * Returns a product with its brand, categories, tags, and Q&A
 */

import productRepo from '../../infrastructure/repositories/productRepo';
import productBrandRepo from '../../infrastructure/repositories/productBrandRepo';
import productToCategoryRepo from '../../infrastructure/repositories/productToCategoryRepo';
import productCategoryRepo from '../../infrastructure/repositories/productCategoryRepo';
import productTagRepo from '../../infrastructure/repositories/productTagRepo';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import productQaAnswerRepo from '../../infrastructure/repositories/productQaAnswerRepo';
import type { Product } from '../../infrastructure/repositories/productRepo';
import type { ProductBrand } from '../../infrastructure/repositories/productBrandRepo';
import type { ProductCategory } from '../../infrastructure/repositories/productCategoryRepo';
import type { ProductTag } from '../../infrastructure/repositories/productTagRepo';
import type { ProductQa } from '../../infrastructure/repositories/productQaRepo';
import type { ProductQaAnswer } from '../../infrastructure/repositories/productQaAnswerRepo';

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

export interface QaWithAnswers extends ProductQa {
  answers: ProductQaAnswer[];
}

export interface ProductCatalogEnrichmentResponse {
  product: Product;
  brands: ProductBrand[];
  categories: ProductCategory[];
  tags: ProductTag[];
  qa: QaWithAnswers[];
}

// ============================================================================
// Use Case
// ============================================================================

export class GetProductCatalogEnrichmentUseCase {
  async execute(command: GetProductCatalogEnrichmentCommand): Promise<ProductCatalogEnrichmentResponse> {
    if (!command.productId) {
      throw new Error('productId is required');
    }

    const product = await productRepo.findById(command.productId);
    if (!product) {
      throw new Error(`Product not found: ${command.productId}`);
    }

    // Fetch brands linked to this product
    const brands = await productBrandRepo.findByProduct(command.productId);

    // Fetch category mappings and resolve full category objects
    const categoryMappings = await productToCategoryRepo.findByProduct(command.productId);
    const categories: ProductCategory[] = [];
    for (const mapping of categoryMappings) {
      const category = await productCategoryRepo.findById(mapping.productCategoryId);
      if (category) {
        categories.push(category);
      }
    }

    // Fetch all active tags — product-level tag associations are stored on the
    // DDD Product entity; the legacy repo does not expose them directly.
    const tags = await productTagRepo.findAll();

    // Fetch Q&A questions with their answers
    const qaStatus = command.approvedQaOnly ? 'approved' : undefined;
    const questions = await productQaRepo.findByProduct(command.productId, qaStatus as any);

    const qa: QaWithAnswers[] = [];
    for (const question of questions) {
      const answers = await productQaAnswerRepo.findByQuestion(question.productQaId, command.approvedQaOnly ? 'approved' : undefined);
      qa.push({ ...question, answers });
    }

    return { product, brands, categories, tags, qa };
  }
}
