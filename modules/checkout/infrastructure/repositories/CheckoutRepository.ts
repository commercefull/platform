/**
 * Checkout Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { CheckoutSession as DbCheckoutSession, ShippingMethod as DbShippingMethod, PaymentMethod as DbPaymentMethod } from '../../../../libs/db/types';
import { generateUUID } from '../../../../libs/uuid';
import { CheckoutRepository, ShippingMethodData, PaymentMethodData } from '../../domain/repositories/CheckoutRepository';
import { CheckoutSession, CheckoutStatus, PaymentStatus, FulfillmentType } from '../../domain/entities/CheckoutSession';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../basket/domain/valueObjects/Money';
import { calculateOrderTaxUseCase } from '../../../tax/application/useCases/CalculateOrderTax';

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
    const now = new Date().toISOString();

    const existing = await queryOne<DbCheckoutSession>(
      'SELECT "checkoutSessionId" FROM "checkoutSession" WHERE "checkoutSessionId" = $1',
      [session.id],
    );

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
    metadata.shippingAmount = session.shippingAmount.amount;
    metadata.discountAmount = session.discountAmount.amount;
    metadata.total = session.total.amount;
    metadata.currency = session.subtotal.currency;
    metadata.fulfillmentType = session.fulfillmentType;
    if (session.couponCode) {
      metadata.couponCode = session.couponCode;
    }
    if (session.shippingMethodId) {
      metadata.shippingMethodId = session.shippingMethodId;
      metadata.shippingMethodName = session.shippingMethodName;
    }
    if (session.paymentMethodId) {
      metadata.paymentMethodId = session.paymentMethodId;
    }

    if (existing) {
      await query(
        `UPDATE "checkoutSession" SET
          "customerId" = $1, "email" = $2, "basketId" = $3, status = $4,
          "shippingAddressId" = $5, "billingAddressId" = $6, "sameBillingAsShipping" = $7,
          "selectedShippingMethodId" = $8, "shippingCalculated" = $9, "taxesCalculated" = $10,
          "agreeToTerms" = $11, "agreeToMarketing" = $12, notes = $13, "updatedAt" = $14,
          "lastActivityAt" = $15, "convertedToOrderId" = $16, "expiresAt" = $17,
          "paymentIntentId" = $18, "metadata" = $19
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
        ],
      );
    } else {
      const sessionId = generateUUID();
      await query(
        `INSERT INTO "checkoutSession" (
          "checkoutSessionId", "sessionId", "basketId", "customerId", email,
          status, step, "sameBillingAsShipping", "shippingCalculated", "taxesCalculated",
          "agreeToTerms", "agreeToMarketing", notes, "createdAt", "updatedAt", "lastActivityAt", "expiresAt",
          "paymentIntentId", "metadata"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
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
        ],
      );
    }

    return session;
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
    if (!addr.postalCode) errors.push('Postal code is required');
    if (!addr.country) errors.push('Country is required');
    return { valid: errors.length === 0, errors };
  }

  async calculateTax(subtotal: number, shippingAmount: number, address: unknown): Promise<number> {
    const addr = address as Record<string, unknown>;
    try {
      const result = await calculateOrderTaxUseCase.execute({
        items: [{ productId: '_subtotal', name: 'Subtotal', quantity: 1, unitPrice: subtotal }],
        shippingAddress: {
          country: String(addr.country || ''),
          region: addr.region as string | undefined,
          postalCode: addr.postalCode as string | undefined,
          city: addr.city as string | undefined,
        },
        shippingAmount,
      });
      return result.success ? result.taxAmount : 0;
    } catch {
      // Fall back to simplified query if tax use case fails
      const row = await queryOne<Record<string, unknown>>(
        `SELECT tr.rate FROM "taxRate" tr
         JOIN "taxZone" tz ON tz."taxZoneId" = tr."taxZoneId"
         WHERE tz."countries" @> $1::jsonb AND tr."isActive" = true AND tz."isActive" = true
         ORDER BY tz."isDefault" DESC LIMIT 1`,
        [JSON.stringify([addr.country])],
      );
      if (row) {
        const taxRate = Number(row.rate) / 100;
        return Math.round((subtotal + shippingAmount) * taxRate * 100) / 100;
      }
      return 0;
    }
  }

  private mapToCheckoutSession(row: DbCheckoutSession): CheckoutSession {
    const currency = 'USD';

    const rawMeta = row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : row.metadata) : {};
    const meta = rawMeta as Record<string, unknown>;

    let shippingAddress: Address | undefined = undefined;
    if (meta?.shippingAddress) {
      try {
        shippingAddress = Address.create(meta.shippingAddress as { firstName: string; lastName: string; addressLine1: string; city: string; postalCode: string; country: string; company?: string; addressLine2?: string; region?: string; phone?: string });
      } catch {
        // ignore invalid address
      }
    }

    let billingAddress: Address | undefined = undefined;
    if (meta?.billingAddress) {
      try {
        billingAddress = Address.create(meta.billingAddress as { firstName: string; lastName: string; addressLine1: string; city: string; postalCode: string; country: string; company?: string; addressLine2?: string; region?: string; phone?: string });
      } catch {
        // ignore invalid address
      }
    }

    // orderId is stored in convertedToOrderId column or in metadata JSONB
    const orderId: string | undefined = (row.convertedToOrderId ?? (meta?.orderId as string | undefined)) ?? undefined;

    return CheckoutSession.reconstitute({
      id: row.checkoutSessionId,
      customerId: row.customerId ?? undefined,
      guestEmail: row.email || undefined,
      basketId: row.basketId,
      status: row.status as CheckoutStatus,
      paymentStatus: 'pending' as PaymentStatus,
      shippingAddress,
      billingAddress,
      sameAsShipping: Boolean(row.sameBillingAsShipping),
      shippingMethodId: (meta?.shippingMethodId as string) ?? row.selectedShippingMethodId ?? undefined,
      shippingMethodName: meta?.shippingMethodName as string | undefined,
      paymentMethodId: meta?.paymentMethodId as string | undefined,
      paymentIntentId: row.paymentIntentId ?? undefined,
      orderId,
      subtotal: Money.create(Number(meta?.subtotal ?? 0), currency),
      taxAmount: Money.create(Number(meta?.taxAmount ?? 0), currency),
      shippingAmount: Money.create(Number(meta?.shippingAmount ?? 0), currency),
      discountAmount: Money.create(Number(meta?.discountAmount ?? 0), currency),
      total: Money.create(Number(meta?.total ?? 0), currency),
      couponCode: meta?.couponCode as string | undefined,
      fulfillmentType: (meta?.fulfillmentType as FulfillmentType) ?? 'shipping',
      notes: row.notes ?? undefined,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata as string) : row.metadata as Record<string, unknown>) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.convertedToOrderId ? new Date(row.updatedAt) : undefined,
      expiresAt: new Date(row.expiresAt as string | Date ?? new Date()),
    });
  }
}

export default new CheckoutRepo();
