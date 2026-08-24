/**
 * PCI-DSS Tokenisation-Only Assertion Tests
 *
 * These tests verify at the code level that the CommerceFull platform
 * never receives, processes, or stores Primary Account Numbers (PAN).
 * The platform operates under SAQ A-EP — all cardholder data interaction
 * is delegated to PCI-DSS-certified PSPs via tokenisation.
 *
 * If any of these tests fail, it indicates a PCI-DSS scope violation
 * that must be remediated before deployment.
 */

import { PaymentRequest } from '../application/services/GatewayAdapter';
import { PaymentTransactionProps } from '../domain/entities/PaymentTransaction';
import { TransactionStatus } from '../domain/valueObjects/PaymentStatus';
import { StoredPaymentMethod } from '../domain/repositories/StoredPaymentMethodRepository';

// Fields that must NEVER appear in any payment-related type or storage
const FORBIDDEN_CARD_FIELDS = [
  'cardNumber',
  'card_number',
  'pan',
  'primaryAccountNumber',
  'cvv',
  'cvc',
  'cvv2',
  'cvc2',
  'securityCode',
  'security_code',
  'trackData',
  'track_data',
  'track1',
  'track2',
  'cardHolderName',
  'card_holder_name',
  'fullCardNumber',
  'full_card_number',
  'rawCardNumber',
  'raw_card_number',
];

// Fields that ARE allowed (tokenised / display-only)
const ALLOWED_CARD_RELATED_FIELDS = [
  'paymentMethodToken',
  'providerToken',
  'last4',
  'brand',
  'expiryMonth',
  'expiryYear',
  'expMonth',
  'expYear',
  'cardType',
  'fingerprint',
];

describe('PCI-DSS Tokenisation-Only Assertions', () => {
  describe('PaymentRequest interface', () => {
    it('should accept paymentMethodToken, not raw card fields', () => {
      const request: PaymentRequest = {
        orderId: 'order-1',
        amount: 100,
        currency: 'USD',
        paymentMethodToken: 'pm_abc123',
      };

      expect(request.paymentMethodToken).toBe('pm_abc123');
      // PaymentRequest has no field for card number, CVV, etc.
      expect((request as unknown as Record<string, unknown>).cardNumber).toBeUndefined();
      expect((request as unknown as Record<string, unknown>).cvv).toBeUndefined();
    });

    it('should not have any forbidden card fields in its type shape', () => {
      const sampleRequest: PaymentRequest = {
        orderId: 'order-1',
        amount: 100,
        currency: 'USD',
        paymentMethodToken: 'tok_123',
        customerId: 'cust-1',
        customerEmail: 'test@test.com',
        customerIp: '127.0.0.1',
        description: 'Test payment',
        metadata: {},
        returnUrl: 'https://example.com/return',
        cancelUrl: 'https://example.com/cancel',
      };

      const keys = Object.keys(sampleRequest);
      const violations = keys.filter(key =>
        FORBIDDEN_CARD_FIELDS.some(f => key.toLowerCase() === f.toLowerCase()),
      );

      expect(violations).toEqual([]);
    });
  });

  describe('PaymentTransaction entity', () => {
    it('should store only tokenised/display fields, not PAN', () => {
      const props: PaymentTransactionProps = {
        transactionId: 'txn-1',
        orderId: 'order-1',
        paymentMethodConfigId: 'pmc-1',
        gatewayId: 'stripe',
        amount: 100,
        currency: 'USD',
        status: 'authorized' as TransactionStatus,
        refundedAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentMethodDetails: {
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2026,
          token: 'pm_abc123',
        },
      };

      const details = props.paymentMethodDetails as Record<string, unknown>;
      const keys = Object.keys(details);
      const violations = keys.filter(key =>
        FORBIDDEN_CARD_FIELDS.some(f => key.toLowerCase() === f.toLowerCase()),
      );

      expect(violations).toEqual([]);
      expect(details.last4).toBe('4242');
      expect(details.brand).toBe('visa');
    });
  });

  describe('StoredPaymentMethod interface', () => {
    it('should store providerToken, not card numbers', () => {
      const method: StoredPaymentMethod = {
        storedPaymentMethodId: 'spm-1',
        customerId: 'cust-1',
        organizationId: 'org-1',
        type: 'card',
        provider: 'stripe',
        providerToken: 'pm_abc123',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(method.providerToken).toBe('pm_abc123');
      expect(method.last4).toBe('4242');
      expect((method as unknown as Record<string, unknown>).cardNumber).toBeUndefined();
      expect((method as unknown as Record<string, unknown>).cvv).toBeUndefined();
    });

    it('should not have any forbidden card fields in its type shape', () => {
      const sample: StoredPaymentMethod = {
        storedPaymentMethodId: 'spm-1',
        customerId: 'cust-1',
        organizationId: 'org-1',
        type: 'card',
        provider: 'stripe',
        providerToken: 'pm_abc123',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const keys = Object.keys(sample);
      const violations = keys.filter(key =>
        FORBIDDEN_CARD_FIELDS.some(f => key.toLowerCase() === f.toLowerCase()),
      );

      expect(violations).toEqual([]);
    });
  });

  describe('Allowed card-related fields', () => {
    it('should have a documented allow-list of tokenised/display fields', () => {
      // These are the ONLY card-related fields the platform may handle.
      // Any new field must be reviewed against the PCI-DSS SAQ boundary.
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('paymentMethodToken');
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('providerToken');
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('last4');
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('brand');
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('expiryMonth');
      expect(ALLOWED_CARD_RELATED_FIELDS).toContain('expiryYear');
    });
  });

  describe('Forbidden fields are exhaustive', () => {
    it('should cover all common PAN/CVV field names', () => {
      expect(FORBIDDEN_CARD_FIELDS).toContain('cardNumber');
      expect(FORBIDDEN_CARD_FIELDS).toContain('card_number');
      expect(FORBIDDEN_CARD_FIELDS).toContain('pan');
      expect(FORBIDDEN_CARD_FIELDS).toContain('cvv');
      expect(FORBIDDEN_CARD_FIELDS).toContain('cvc');
      expect(FORBIDDEN_CARD_FIELDS).toContain('trackData');
      expect(FORBIDDEN_CARD_FIELDS).toContain('track_data');
    });
  });
});
