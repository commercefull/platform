/**
 * SaveStoredPaymentMethod Use Case
 *
 * Creates a stored payment method for a customer and enforces the
 * single-default invariant: only one method per customer may be default.
 *
 * Validates: Requirements 1.9
 */

import { StoredPaymentMethodRepository, StoredPaymentMethod } from '../../domain/repositories/StoredPaymentMethodRepository';

import { FailedToCreateStoredPaymentMethodError, FailedToRetrieveSavedPaymentMethodError } from '../../domain/errors/PaymentErrors';
export interface SaveStoredPaymentMethodCommandProps {
  customerId: string;
  organizationId: string;
  type: string;
  provider: string;
  providerToken: string;
  isDefault?: boolean;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

// ============================================================================
// Command
// ============================================================================

export class SaveStoredPaymentMethodCommand {
  public readonly customerId: string;
  public readonly organizationId: string;
  public readonly type: string;
  public readonly provider: string;
  public readonly providerToken: string;
  public readonly isDefault: boolean;
  public readonly last4?: string;
  public readonly brand?: string;
  public readonly expiryMonth?: number;
  public readonly expiryYear?: number;

  constructor(props: SaveStoredPaymentMethodCommandProps) {
    this.customerId = props.customerId;
    this.organizationId = props.organizationId;
    this.type = props.type;
    this.provider = props.provider;
    this.providerToken = props.providerToken;
    this.isDefault = props.isDefault ?? false;
    this.last4 = props.last4;
    this.brand = props.brand;
    this.expiryMonth = props.expiryMonth;
    this.expiryYear = props.expiryYear;
  }
}

// ============================================================================
// Response
// ============================================================================

export interface SaveStoredPaymentMethodResponse {
  storedPaymentMethodId: string;
  customerId: string;
  organizationId?: string;
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
  constructor(
    private readonly repo: Pick<StoredPaymentMethodRepository, 'createStoredMethod' | 'findStoredMethodById' | 'setDefaultStoredMethod'>,
  ) {}

  async execute(command: SaveStoredPaymentMethodCommand): Promise<SaveStoredPaymentMethodResponse> {
    const method = await this.repo.createStoredMethod({
      customerId: command.customerId,
      organizationId: command.organizationId,
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
      throw new FailedToCreateStoredPaymentMethodError();
    }

    // Enforce single-default invariant: if this method is default, unset all others
    if (command.isDefault) {
      await this.repo.setDefaultStoredMethod(method.storedPaymentMethodId, command.customerId);
    }

    const saved = await this.repo.findStoredMethodById(method.storedPaymentMethodId);
    if (!saved) {
      throw new FailedToRetrieveSavedPaymentMethodError();
    }

    return this.mapToResponse(saved);
  }

  private mapToResponse(m: StoredPaymentMethod): SaveStoredPaymentMethodResponse {
    return {
      storedPaymentMethodId: m.storedPaymentMethodId,
      customerId: m.customerId,
      organizationId: m.organizationId,
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
