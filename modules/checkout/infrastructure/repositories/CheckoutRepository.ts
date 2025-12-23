/**
 * Checkout Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { CheckoutRepository, ShippingMethodData, PaymentMethodData } from '../../domain/repositories/CheckoutRepository';
import { CheckoutSession, CheckoutStatus, PaymentStatus } from '../../domain/entities/CheckoutSession';
import { Address } from '../../domain/valueObjects/Address';
import { Money } from '../../../basket/domain/valueObjects/Money';

export class CheckoutRepo implements CheckoutRepository {
  async findById(id: string): Promise<CheckoutSession | null> {
    const row = await queryOne<Record<string, any>>('SELECT * FROM "checkoutSession" WHERE "checkoutSessionId" = $1', [id]);
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async findByBasketId(basketId: string): Promise<CheckoutSession | null> {
    const row = await queryOne<Record<string, any>>(
      `SELECT * FROM "checkoutSession" 
       WHERE "basketId" = $1 AND status IN ('active', 'pending_payment')
       ORDER BY "updatedAt" DESC LIMIT 1`,
      [basketId],
    );
    if (!row) return null;
    return this.mapToCheckoutSession(row);
  }

  async findActiveByCustomerId(customerId: string): Promise<CheckoutSession | null> {
    const row = await queryOne<Record<string, any>>(
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

    const existing = await queryOne<Record<string, any>>(
      'SELECT "checkoutSessionId" FROM "checkoutSession" WHERE "checkoutSessionId" = $1',
      [session.id],
    );

    if (existing) {
      await query(
        `UPDATE "checkoutSession" SET
          "customerId" = $1, "email" = $2, "basketId" = $3, status = $4,
          "shippingAddressId" = $5, "billingAddressId" = $6, "sameBillingAsShipping" = $7,
          "selectedShippingMethodId" = $8, "shippingCalculated" = $9, "taxesCalculated" = $10,
          "agreeToTerms" = $11, "agreeToMarketing" = $12, notes = $13, "updatedAt" = $14,
          "lastActivityAt" = $15, "convertedToOrderId" = $16, "expiresAt" = $17
        WHERE "checkoutSessionId" = $18`,
        [
          session.customerId || null,
          session.guestEmail || null,
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
          null,
          session.expiresAt.toISOString(),
          session.id,
        ],
      );
    } else {
      const sessionId = generateUUID();
      await query(
        `INSERT INTO "checkoutSession" (
          "checkoutSessionId", "sessionId", "basketId", "customerId", email,
          status, step, "sameBillingAsShipping", "shippingCalculated", "taxesCalculated",
          "agreeToTerms", "agreeToMarketing", notes, "createdAt", "updatedAt", "lastActivityAt", "expiresAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
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
        ],
      );
    }

    return session;
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM "checkoutSession" WHERE "checkoutSessionId" = $1', [id]);
  }

  async findExpiredSessions(): Promise<CheckoutSession[]> {
    const now = new Date().toISOString();
    const rows = await query<Record<string, any>[]>(
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

  async getAvailableShippingMethods(country: string, _postalCode: string): Promise<ShippingMethodData[]> {
    const rows = await query<Record<string, any>[]>(
      `SELECT sm.* FROM "shippingMethod" sm
       JOIN "shippingZone" sz ON sz."shippingZoneId" = sm."shippingZoneId"
       WHERE sm."isActive" = true
       ORDER BY sm."baseRate" ASC`,
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
      description: row.description,
      price: Number(row.baseRate),
      currency: row.currency || 'USD',
      estimatedDeliveryDays: row.estimatedDeliveryDays,
      carrier: row.carrierName,
    }));
  }

  async getAvailablePaymentMethods(): Promise<PaymentMethodData[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "paymentMethod" WHERE "isEnabled" = true ORDER BY "isDefault" DESC, name ASC',
    );

    if (!rows || rows.length === 0) {
      return [
        { id: 'card', name: 'Credit/Debit Card', type: 'credit_card', isDefault: true },
        { id: 'paypal', name: 'PayPal', type: 'paypal', isDefault: false },
      ];
    }

    return rows.map(row => ({
      id: row.paymentMethodId,
      name: row.name,
      type: row.type,
      isDefault: Boolean(row.isDefault),
      processorId: row.processorId,
    }));
  }

  async validateShippingAddress(address: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!address.firstName) errors.push('First name is required');
    if (!address.lastName) errors.push('Last name is required');
    if (!address.addressLine1) errors.push('Address line 1 is required');
    if (!address.city) errors.push('City is required');
    if (!address.postalCode) errors.push('Postal code is required');
    if (!address.country) errors.push('Country is required');
    return { valid: errors.length === 0, errors };
  }

  async calculateTax(subtotal: number, shippingAmount: number, address: any): Promise<number> {
    const row = await queryOne<Record<string, any>>(
      `SELECT tr.rate FROM "taxRate" tr
       JOIN "taxZone" tz ON tz."taxZoneId" = tr."taxZoneId"
       WHERE tz.country = $1 AND tr."isActive" = true
       ORDER BY tz.state DESC NULLS LAST LIMIT 1`,
      [address.country],
    );

    if (row) {
      const taxRate = Number(row.rate) / 100;
      return Math.round((subtotal + shippingAmount) * taxRate * 100) / 100;
    }
    return 0;
  }

  private mapToCheckoutSession(row: Record<string, any>): CheckoutSession {
    const currency = 'USD';

    let shippingAddress: Address | undefined;
    let billingAddress: Address | undefined;

    return CheckoutSession.reconstitute({
      id: row.checkoutSessionId,
      customerId: row.customerId || undefined,
      guestEmail: row.email || undefined,
      basketId: row.basketId,
      status: row.status as CheckoutStatus,
      paymentStatus: 'pending' as PaymentStatus,
      shippingAddress,
      billingAddress,
      sameAsShipping: Boolean(row.sameBillingAsShipping),
      shippingMethodId: row.selectedShippingMethodId || undefined,
      shippingMethodName: undefined,
      paymentMethodId: undefined,
      paymentIntentId: undefined,
      subtotal: Money.create(0, currency),
      taxAmount: Money.create(0, currency),
      shippingAmount: Money.create(0, currency),
      discountAmount: Money.create(0, currency),
      total: Money.create(0, currency),
      couponCode: undefined,
      notes: row.notes || undefined,
      metadata: undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      completedAt: row.convertedToOrderId ? new Date(row.updatedAt) : undefined,
      expiresAt: new Date(row.expiresAt),
    });
  }
}

export default new CheckoutRepo();
