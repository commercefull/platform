/**
 * SubmitVerificationDocument Use Case
 *
 * Creates a KYC verification document record with `pending` status.
 *
 * Validates: Requirements 3.17
 */

import merchantVerificationDocumentRepo, {
  MerchantVerificationDocument,
} from '../../infrastructure/repositories/merchantVerificationDocumentRepo';

// ============================================================================
// Command
// ============================================================================

export class SubmitVerificationDocumentCommand {
  constructor(
    public readonly merchantId: string,
    public readonly documentType: string,
    public readonly fileUrl: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SubmitVerificationDocumentResponse {
  merchantVerificationDocumentId: string;
  merchantId: string;
  documentType: string;
  fileUrl: string;
  status: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SubmitVerificationDocumentUseCase {
  constructor(
    private readonly repo: typeof merchantVerificationDocumentRepo = merchantVerificationDocumentRepo,
  ) {}

  async execute(command: SubmitVerificationDocumentCommand): Promise<SubmitVerificationDocumentResponse> {
    const doc = await this.repo.create({
      merchantId: command.merchantId,
      documentType: command.documentType,
      fileUrl: command.fileUrl,
      status: 'pending',
    });

    if (!doc) {
      throw new Error('Failed to create verification document');
    }

    return this.mapToResponse(doc);
  }

  private mapToResponse(d: MerchantVerificationDocument): SubmitVerificationDocumentResponse {
    return {
      merchantVerificationDocumentId: d.merchantVerificationDocumentId,
      merchantId: d.merchantId,
      documentType: d.documentType,
      fileUrl: d.fileUrl,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    };
  }
}
