/**
 * SaveStoredPaymentMethod Use Case
 *
 * Creates a stored payment method for a customer and enforces the
 * single-default invariant: only one method per customer may be default.
 *
 * Validates: Requirements 1.9
 */

import storedPaymentMethodRepo, { StoredPaymentMethod } from '../../infrastructure/repositories/storedPaymentMethodRepo';

// ============================================================================
// Command
// ============================================================================

export class SaveStoredPaymentMethodCommand {
  constructor(
    public readonly customerId: string,
    public readonly merchantId: string,
    public readonly type: string,
    public readonly provider: string,
    public readonly providerToken: string,
    public readonly isDefault: boolean = false,
    public readonly last4?: string,
    public readonly brand?: string,
    public readonly expiryMonth?: number,
    public readonly expiryYear?: number,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SaveStoredPaymentMethodResponse {
  storedPaymentMethodId: string;
  customerId: string;
  merchantId: string;
  type: string;
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SaveStoredPaymentMethodUseCase {
  constructor(private readonly repo: typeof storedPaymentMethodRepo = storedPaymentMethodRepo) {}

  async execute(command: SaveStoredPaymentMethodCommand): Promise<SaveStoredPaymentMethodResponse> {
    const method = await this.repo.create({
      customerId: command.customerId,
      merchantId: command.merchantId,
      type: command.type,
      provider: command.provider,
      providerToken: command.providerToken,
      isDefault: command.isDefault,
      last4: command.last4,
      brand: command.brand,
      expiryMonth: command.expiryMonth,
      expiryYear: command.expiryYear,
    });

    if (!method) {
      throw new Error('Failed to create stored payment method');
    }

    // Enforce single-default invariant: if this method is default, unset all others
    if (command.isDefault) {
      await this.repo.setDefault(method.storedPaymentMethodId, command.customerId);
    }

    const saved = await this.repo.findById(method.storedPaymentMethodId);
    if (!saved) {
      throw new Error('Failed to retrieve saved payment method');
    }

    return this.mapToResponse(saved);
  }

  private mapToResponse(m: StoredPaymentMethod): SaveStoredPaymentMethodResponse {
    return {
      storedPaymentMethodId: m.storedPaymentMethodId,
      customerId: m.customerId,
      merchantId: m.merchantId,
      type: m.type,
      provider: m.provider,
      last4: m.last4,
      brand: m.brand,
      expiryMonth: m.expiryMonth,
      expiryYear: m.expiryYear,
      isDefault: m.isDefault,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
