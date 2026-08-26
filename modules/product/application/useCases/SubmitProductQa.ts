/**
 * Submit Product Q&A Use Case
 * Creates a Q&A question for a product, validates product exists
 */

import type { ProductQa, ProductQaPort, ProductLookupPort } from '../../domain/repositories/ProductCatalogPorts';
import { ProductNotFoundError, ProductValidationError } from '../../domain/errors/ProductErrors';

// ============================================================================
// Command
// ============================================================================

export class SubmitProductQaCommand {
  constructor(
    public readonly productId: string,
    public readonly question: string,
    public readonly customerId?: string,
    public readonly askerName?: string,
    public readonly askerEmail?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SubmitProductQaResponse {
  productQaId: string;
  productId: string;
  question: string;
  status: string;
  customerId?: string | null;
  askerName?: string | null;
  askerEmail?: string | null;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SubmitProductQaUseCase {
  constructor(
    private readonly productRepo: ProductLookupPort,
    private readonly productQaRepo: ProductQaPort,
  ) {}

  async execute(command: SubmitProductQaCommand): Promise<SubmitProductQaResponse> {
    if (!command.productId) {
      throw new ProductValidationError('productId is required');
    }
    if (!command.question?.trim()) {
      throw new ProductValidationError('question is required');
    }

    // Validate product exists
    const product = await this.productRepo.findById(command.productId);
    if (!product) {
      throw new ProductNotFoundError(command.productId);
    }

    const qa: ProductQa = await this.productQaRepo.create({
      productId: command.productId,
      question: command.question.trim(),
      status: 'pending',
      customerId: command.customerId || null,
      askerName: command.askerName || null,
      askerEmail: command.askerEmail || null,
    });

    return {
      productQaId: qa.productQaId,
      productId: qa.productId,
      question: qa.question,
      status: qa.status,
      customerId: qa.customerId,
      askerName: qa.askerName,
      askerEmail: qa.askerEmail,
      createdAt: qa.createdAt,
    };
  }
}
