/**
 * Checkout Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import {
  CheckoutSession as DbCheckoutSession,
  ShippingMethod as DbShippingMethod,
  PaymentMethod as DbPaymentMethod,
} from '../../../../libs/db/types';
import { generateUUID } from '../../../../libs/uuid';
import { CheckoutRepository, ShippingMethodData, PaymentMethodData } from '../../domain/repositories/CheckoutRepository';
import { CheckoutSession, CheckoutStatus, PaymentStatus, FulfillmentType } from '../../domain/entities/CheckoutSession';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../../libs/money';
import { getCountryAddressMetadata } from '../../../../libs/address';

export class CheckoutRepo implements CheckoutRepository {
  async findById(id: string): Promise<CheckoutSession | null> {
    const row = await queryOne<DbCheckoutSession>('SELECT * FROM "checkoutSession" WHERE "checkoutSessionId" = $1', [id]);
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async findByBasketId(basketId: string): Promise<CheckoutSession | null> {
    const row = await queryOne<DbCheckoutSession>(
      `SELECT * FROM "checkoutSession" 
       WHERE "basketId" = $1 AND status IN ('active', 'pending_payment')
       ORDER BY "updatedAt" DESC LIMIT 1`,
      [basketId],
    );
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async findActiveByCustomerId(customerId: string): Promise<CheckoutSession | null> {
    const row = await queryOne<DbCheckoutSession>(
      `SELECT * FROM "checkoutSession" 
       WHERE "customerId" = $1 AND status IN ('active', 'pending_payment')
       ORDER BY "updatedAt" DESC LIMIT 1`,
      [customerId],
    );
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async save(session: CheckoutSession): Promise<CheckoutSession> {
    const existing = await queryOne<DbCheckoutSession>('SELECT "checkoutSessionId" FROM "checkoutSession" WHERE "checkoutSessionId" = $1', [
      session.id,
    ]);

    const metadata = this.buildSessionMetadata(session);

    if (existing) {
      await this.updateSession(session, metadata);
    } else {
      await this.insertSession(session, metadata);
    }

    return session;
  }

  // Session fields persisted inside the metadata JSONB blob — addresses,
  // monetary snapshot, coupon/loyalty/VAT markers.
  private buildSessionMetadata(session: CheckoutSession): Record<string, unknown> {
    const metadata: Record<string, unknown> = { ...(session.metadata || {}) };
    if (session.shippingAddress) {
      metadata.shippingAddress = session.shippingAddress.toJSON();
    }
    if (session.billingAddress) {
      metadata.billingAddress = session.billingAddress.toJSON();
    }
    if (session.orderId) {
      metadata.orderId = session.orderId;
    }
    metadata.subtotal = session.subtotal.amount;
    metadata.taxAmount = session.taxAmount.amount;
    metadata.taxIncludedInSubtotal = session.taxIncludedInSubtotal;
    metadata.taxAddedAmount = session.taxAddedAmount.amount;
    metadata.shippingAmount = session.shippingAmount.amount;
    metadata.discountAmount = session.discountAmount.amount;
    metadata.total = session.total.amount;
    metadata.currency = session.subtotal.currency;
    metadata.fulfillmentType = session.fulfillmentType;
    if (session.couponCode) {
      metadata.couponCode = session.couponCode;
    }
    if (session.loyaltyRewardId) {
      metadata.loyaltyRewardId = session.loyaltyRewardId;
      metadata.loyaltyPointsRedeemed = session.loyaltyPointsRedeemed;
      metadata.loyaltyDiscountAmount = session.loyaltyDiscountAmount.amount;
    } else {
      delete metadata.loyaltyRewardId;
      delete metadata.loyaltyPointsRedeemed;
      delete metadata.loyaltyDiscountAmount;
    }
    if (session.vatNumber) {
      metadata.vatNumber = session.vatNumber;
    } else {
      delete metadata.vatNumber;
    }
    if (session.reverseChargeApplied) {
      metadata.reverseChargeApplied = true;
    } else {
      delete metadata.reverseChargeApplied;
    }
    if (session.shippingMethodId) {
      metadata.shippingMethodId = session.shippingMethodId;
      metadata.shippingMethodName = session.shippingMethodName;
    }
    if (session.paymentMethodId) {
      metadata.paymentMethodId = session.paymentMethodId;
    }
    return metadata;
  }

  private async updateSession(session: CheckoutSession, metadata: Record<string, unknown>): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `UPDATE "checkoutSession" SET
          "customerId" = $1, "email" = $2, "basketId" = $3, status = $4,
          "shippingAddressId" = $5, "billingAddressId" = $6, "sameBillingAsShipping" = $7,
          "selectedShippingMethodId" = $8, "shippingCalculated" = $9, "taxesCalculated" = $10,
          "agreeToTerms" = $11, "agreeToMarketing" = $12, notes = $13, "updatedAt" = $14,
          "lastActivityAt" = $15, "convertedToOrderId" = $16, "expiresAt" = $17,
          "paymentIntentId" = $18, "metadata" = $19,
          "marketId" = $21, "storeId" = $22, "channelId" = $23, "localeCode" = $24,
          "appliedPromotions" = $25, "promotionDiscountCents" = $26
        WHERE "checkoutSessionId" = $20`,
      [
        session.customerId || null,
        session.guestEmail || '',
        session.basketId,
        session.status,
        null,
        null,
        session.sameAsShipping,
        session.shippingMethodId || null,
        true,
        true,
        true,
        false,
        session.notes || null,
        now,
        now,
        session.orderId || null,
        session.expiresAt.toISOString(),
        session.paymentIntentId || null,
        JSON.stringify(metadata),
        session.id,
        session.marketId || null,
        session.storeId || null,
        session.channelId || null,
        session.localeCode || null,
        JSON.stringify(session.appliedPromotions),
        session.promotionDiscountAmount.cents,
      ],
    );
  }

  private async insertSession(session: CheckoutSession, metadata: Record<string, unknown>): Promise<void> {
    const now = new Date().toISOString();
    const sessionId = generateUUID();
    await query(
      `INSERT INTO "checkoutSession" (
          "checkoutSessionId", "sessionId", "basketId", "customerId", email,
          status, step, "sameBillingAsShipping", "shippingCalculated", "taxesCalculated",
          "agreeToTerms", "agreeToMarketing", notes, "createdAt", "updatedAt", "lastActivityAt", "expiresAt",
          "paymentIntentId", "metadata",
          "marketId", "storeId", "channelId", "localeCode", "appliedPromotions", "promotionDiscountCents"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)`,
      [
        session.id,
        sessionId,
        session.basketId,
        session.customerId || null,
        session.guestEmail || '',
        session.status,
        'shipping',
        session.sameAsShipping,
        false,
        false,
        false,
        false,
        session.notes || null,
        now,
        now,
        now,
        session.expiresAt.toISOString(),
        session.paymentIntentId || null,
        JSON.stringify(metadata),
        session.marketId || null,
        session.storeId || null,
        session.channelId || null,
        session.localeCode || null,
        JSON.stringify(session.appliedPromotions),
        session.promotionDiscountAmount.cents,
      ],
    );
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<CheckoutSession | null> {
    const row = await queryOne<DbCheckoutSession>('SELECT * FROM "checkoutSession" WHERE "paymentIntentId" = $1', [paymentIntentId]);
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM "checkoutSession" WHERE "checkoutSessionId" = $1', [id]);
  }

  async findExpiredSessions(): Promise<CheckoutSession[]> {
    const now = new Date().toISOString();
    const rows = await query<DbCheckoutSession[]>(
      `SELECT * FROM "checkoutSession" 
       WHERE status IN ('active', 'pending_payment') AND "expiresAt" < $1`,
      [now],
    );
    return (rows || []).map(row => this.mapToCheckoutSession(row));
  }

  async markAsAbandoned(id: string): Promise<void> {
    await query('UPDATE "checkoutSession" SET status = $1, "updatedAt" = $2 WHERE "checkoutSessionId" = $3', [
      'abandoned',
      new Date().toISOString(),
      id,
    ]);
  }

  async getAvailableShippingMethods(_country: string, _postalCode: string): Promise<ShippingMethodData[]> {
    const rows = await query<DbShippingMethod[]>(
      `SELECT sm.* FROM "shippingMethod" sm
       WHERE sm."isActive" = true
       ORDER BY sm."priority" ASC NULLS LAST, sm."isDefault" DESC`,
    );

    if (!rows || rows.length === 0) {
      return [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: '5-7 business days',
          price: 9.99,
          currency: 'USD',
          estimatedDeliveryDays: 7,
          carrier: 'USPS',
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: '2-3 business days',
          price: 19.99,
          currency: 'USD',
          estimatedDeliveryDays: 3,
          carrier: 'UPS',
        },
        {
          id: 'overnight',
          name: 'Overnight Shipping',
          description: 'Next business day',
          price: 29.99,
          currency: 'USD',
          estimatedDeliveryDays: 1,
          carrier: 'FedEx',
        },
      ];
    }

    return rows.map(row => ({
      id: row.shippingMethodId,
      name: row.name,
      description: row.description ?? undefined,
      price: 0,
      currency: 'USD',
      estimatedDeliveryDays: (row.estimatedDeliveryDays as number | null) ?? row.handlingDays ?? undefined,
      carrier: row.shippingCarrierId ?? undefined,
    }));
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodData[]> {
    let rows: Pick<DbPaymentMethod, 'paymentMethodId' | 'provider' | 'type' | 'isDefault'>[] | null = null;
    try {
      rows = await query<Pick<DbPaymentMethod, 'paymentMethodId' | 'provider' | 'type' | 'isDefault'>[]>(
        'SELECT * FROM "paymentMethod" WHERE "isDefault" = true LIMIT 5',
      );
    } catch {
      // Table may not have expected columns; fall back to defaults
    }

    if (!rows || rows.length === 0) {
      return [
        { id: 'card', name: 'Credit/Debit Card', type: 'credit_card', isDefault: true },
        { id: 'paypal', name: 'PayPal', type: 'paypal', isDefault: false },
      ];
    }

    return rows.map(row => ({
      id: row.paymentMethodId,
      name: row.provider || row.type || 'Payment Method',
      type: row.type as PaymentMethodData['type'],
      isDefault: Boolean(row.isDefault),
      processorId: row.provider ?? undefined,
    }));
  }

  async validateShippingAddress(address: unknown): Promise<{ valid: boolean; errors: string[] }> {
    const addr = address as Record<string, unknown>;
    const errors: string[] = [];
    if (!addr.firstName) errors.push('First name is required');
    if (!addr.lastName) errors.push('Last name is required');
    if (!addr.addressLine1) errors.push('Address line 1 is required');
    if (!addr.city) errors.push('City is required');
    if (!addr.country) errors.push('Country is required');
    // Postal-code optionality is country metadata driven (AE/HK have no postal
    // system); administrative-area checks live in the Address value object.
    if (addr.country && getCountryAddressMetadata(addr.country as string).requiredFields.includes('postalCode') && !addr.postalCode) {
      errors.push('Postal code is required');
    }
    return { valid: errors.length === 0, errors };
  }

  private mapToCheckoutSession(row: DbCheckoutSession): CheckoutSession {
    const meta = this.parseSessionMetadata(row);
    const currency = (meta.currency as string) || 'USD';

    // orderId is stored in convertedToOrderId column or in metadata JSONB
    const orderId: string | undefined = row.convertedToOrderId ?? (meta.orderId as string | undefined) ?? undefined;

    return CheckoutSession.reconstitute({
      ...this.sessionCoreFromRow(row),
      ...this.sessionMetaFieldsFromRow(row, meta),
      ...this.sessionMoneyFromMeta(meta, currency),
      promotionDiscountAmount:
        row.promotionDiscountCents != null ? Money.fromCents(Number(row.promotionDiscountCents), currency) : undefined,
      shippingAddress: this.parseMetaAddress(meta.shippingAddress),
      billingAddress: this.parseMetaAddress(meta.billingAddress),
      orderId,
      expiresAt: this.resolveExpiresAt(row),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.convertedToOrderId ? new Date(row.updatedAt) : undefined,
    });
  }

  private parseSessionMetadata(row: DbCheckoutSession): Record<string, unknown> {
    const raw = row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : row.metadata) : {};
    return raw as Record<string, unknown>;
  }

  private parseMetaAddress(value: unknown): Address | undefined {
    if (!value) return undefined;
    try {
      return Address.create(
        value as {
          firstName: string;
          lastName: string;
          addressLine1: string;
          city: string;
          postalCode: string;
          country: string;
          company?: string;
          addressLine2?: string;
          region?: string;
          phone?: string;
        },
      );
    } catch {
      // ignore invalid address
      return undefined;
    }
  }

  // If the session has expired but is still marked active/pending, gently
  // extend its expiration
  private resolveExpiresAt(row: DbCheckoutSession): Date {
    const now = new Date();
    const originalExpiresAt = new Date((row.expiresAt as string | Date) ?? now);
    return originalExpiresAt < now && (row.status === 'active' || row.status === 'pending_payment')
      ? new Date(now.getTime() + 30 * 60 * 1000)
      : originalExpiresAt;
  }

  private sessionCoreFromRow(row: DbCheckoutSession) {
    return {
      id: row.checkoutSessionId,
      customerId: row.customerId ?? undefined,
      guestEmail: row.email || undefined,
      basketId: row.basketId,
      status: row.status as CheckoutStatus,
      paymentStatus: 'pending' as PaymentStatus,
      sameAsShipping: Boolean(row.sameBillingAsShipping),
      paymentIntentId: row.paymentIntentId ?? undefined,
      marketId: row.marketId ?? undefined,
      storeId: row.storeId ?? undefined,
      channelId: row.channelId ?? undefined,
      localeCode: row.localeCode ?? undefined,
      notes: row.notes ?? undefined,
      metadata: row.metadata
        ? typeof row.metadata === 'string'
          ? JSON.parse(row.metadata as string)
          : (row.metadata as Record<string, unknown>)
        : undefined,
    };
  }

  // Fields stored inside the metadata JSONB blob
  private sessionMetaFieldsFromRow(row: DbCheckoutSession, meta: Record<string, unknown>) {
    return {
      shippingMethodId: (meta.shippingMethodId as string) ?? row.selectedShippingMethodId ?? undefined,
      shippingMethodName: meta.shippingMethodName as string | undefined,
      paymentMethodId: meta.paymentMethodId as string | undefined,
      couponCode: meta.couponCode as string | undefined,
      loyaltyRewardId: meta.loyaltyRewardId as string | undefined,
      loyaltyPointsRedeemed: meta.loyaltyPointsRedeemed != null ? Number(meta.loyaltyPointsRedeemed) : undefined,
      vatNumber: meta.vatNumber as string | undefined,
      reverseChargeApplied: meta.reverseChargeApplied === true,
      fulfillmentType: (meta.fulfillmentType as FulfillmentType) ?? 'shipping',
      appliedPromotions: Array.isArray(row.appliedPromotions) ? (row.appliedPromotions as CheckoutSession['appliedPromotions']) : undefined,
    };
  }

  private sessionMoneyFromMeta(meta: Record<string, unknown>, currency: string) {
    const metaMoney = (value: unknown): Money | undefined => (value != null ? Money.create(Number(value), currency) : undefined);
    return {
      subtotal: Money.create(Number(meta.subtotal ?? 0), currency),
      taxAmount: Money.create(Number(meta.taxAmount ?? 0), currency),
      taxIncludedInSubtotal: meta.taxIncludedInSubtotal === true,
      taxAddedAmount: metaMoney(meta.taxAddedAmount),
      shippingAmount: Money.create(Number(meta.shippingAmount ?? 0), currency),
      discountAmount: Money.create(Number(meta.discountAmount ?? 0), currency),
      total: Money.create(Number(meta.total ?? 0), currency),
      loyaltyDiscountAmount: metaMoney(meta.loyaltyDiscountAmount),
    };
  }
}

export default new CheckoutRepo();
