/**
 * Submit Product Q&A Use Case
 * Creates a Q&A question for a product, validates product exists
 */

import productRepo from '../../infrastructure/repositories/productRepo';
import productQaRepo from '../../infrastructure/repositories/productQaRepo';
import type { ProductQa } from '../../infrastructure/repositories/productQaRepo';

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
  async execute(command: SubmitProductQaCommand): Promise<SubmitProductQaResponse> {
    if (!command.productId) {
      throw new Error('productId is required');
    }
    if (!command.question?.trim()) {
      throw new Error('question is required');
    }

    // Validate product exists
    const product = await productRepo.findById(command.productId);
    if (!product) {
      throw new Error(`Product not found: ${command.productId}`);
    }

    const qa: ProductQa = await productQaRepo.create({
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
