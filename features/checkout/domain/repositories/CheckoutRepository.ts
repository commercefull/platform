/**
 * Checkout Repository Interface
 * Defines the contract for checkout session persistence operations
 */

import { CheckoutSession } from '../entities/CheckoutSession';

export interface ShippingMethodData {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  estimatedDeliveryDays?: number;
  carrier?: string;
}

export interface PaymentMethodData {
  id: string;
  name: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'other';
  isDefault: boolean;
  processorId?: string;
}

export interface CheckoutRepository {
  /**
   * Find checkout session by ID
   */
  findById(id: string): Promise<CheckoutSession | null>;

  /**
   * Find checkout session by basket ID
   */
  findByBasketId(basketId: string): Promise<CheckoutSession | null>;

  /**
   * Find active checkout session for customer
   */
  findActiveByCustomerId(customerId: string): Promise<CheckoutSession | null>;

  /**
   * Save checkout session (create or update)
   */
  save(session: CheckoutSession): Promise<CheckoutSession>;

  /**
   * Delete checkout session
   */
  delete(id: string): Promise<void>;

  /**
   * Find expired checkout sessions
   */
  findExpiredSessions(): Promise<CheckoutSession[]>;

  /**
   * Mark session as abandoned
   */
  markAsAbandoned(id: string): Promise<void>;

  /**
   * Get available shipping methods for address
   */
  getAvailableShippingMethods(country: string, postalCode: string): Promise<ShippingMethodData[]>;

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): Promise<PaymentMethodData[]>;

  /**
   * Validate shipping address
   */
  validateShippingAddress(address: any): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Calculate tax for checkout
   */
  calculateTax(subtotal: number, shippingAmount: number, address: any): Promise<number>;
}
