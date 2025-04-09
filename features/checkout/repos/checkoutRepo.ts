import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';
import { TaxRepo } from '../../tax/repos/taxRepo';

// Core data models
export interface CheckoutSession {
  id: string;
  customerId?: string;
  guestEmail?: string;
  basketId: string;
  status: 'active' | 'completed' | 'abandoned' | 'expired';
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethodId?: string;
  paymentMethodId?: string;
  paymentIntentId?: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'paypal' | 'bank_transfer' | 'other';
  isDefault: boolean;
  isEnabled: boolean;
  processorId?: string;
  processorConfig?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  price: number;
  estimatedDeliveryTime?: string;
  isDefault: boolean;
  isEnabled: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutError {
  code: string;
  message: string;
  field?: string;
}

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: CheckoutError[];
}

export interface OrderCreationResult {
  success: boolean;
  orderId?: string;
  errors?: CheckoutError[];
}

export class CheckoutRepository {
  // Create a new checkout session
  async createCheckoutSession(
    basketId: string,
    customerId?: string,
    guestEmail?: string
  ): Promise<CheckoutSession> {
    const id = uuidv4();
    const now = unixTimestamp();
    
    // Calculate expiry time (24 hours from now)
    const expiresAt = String(now + 86400);
    
    const newSession: CheckoutSession = {
      id,
      customerId,
      guestEmail,
      basketId,
      status: 'active',
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      total: 0,
      createdAt: String(now),
      updatedAt: String(now),
      expiresAt
    };
    
    await query(
      `INSERT INTO "public"."checkout_session" 
      (id, "customerId", "guestEmail", "basketId", status, subtotal, "taxAmount", 
      "shippingAmount", "discountAmount", total, "createdAt", "updatedAt", "expiresAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        newSession.id,
        newSession.customerId,
        newSession.guestEmail,
        newSession.basketId,
        newSession.status,
        newSession.subtotal,
        newSession.taxAmount,
        newSession.shippingAmount,
        newSession.discountAmount,
        newSession.total,
        newSession.createdAt,
        newSession.updatedAt,
        newSession.expiresAt
      ]
    );
    
    return newSession;
  }
  
  // Find checkout session by ID
  async findCheckoutSessionById(id: string): Promise<CheckoutSession | null> {
    const session = await queryOne<CheckoutSession>(
      `SELECT * FROM "public"."checkout_session" WHERE id = $1`,
      [id]
    );
    
    return session || null;
  }
  
  // Find checkout session by basket ID
  async findCheckoutSessionByBasketId(basketId: string): Promise<CheckoutSession | null> {
    const session = await queryOne<CheckoutSession>(
      `SELECT * FROM "public"."checkout_session" 
      WHERE "basketId" = $1 AND status = 'active'
      ORDER BY "createdAt" DESC LIMIT 1`,
      [basketId]
    );
    
    return session || null;
  }
  
  // Find checkout sessions by customer ID
  async findCheckoutSessionsByCustomerId(customerId: string): Promise<CheckoutSession[]> {
    const sessions = await query<CheckoutSession[]>(
      `SELECT * FROM "public"."checkout_session" 
      WHERE "customerId" = $1
      ORDER BY "createdAt" DESC`,
      [customerId]
    );
    
    return sessions || [];
  }
  
  // Update a checkout session
  async updateCheckoutSession(
    id: string,
    updates: Partial<CheckoutSession>
  ): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(id);
    
    if (!session) {
      return null;
    }
    
    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: String(unixTimestamp())
    };
    
    const updateFields = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt')
      .map(key => `"${key}" = $${Object.keys(updates).indexOf(key) + 2}`);
    
    if (updateFields.length > 0) {
      updateFields.push(`"updatedAt" = $${Object.keys(updates).length + 2}`);
      
      const updateValues = [
        ...Object.keys(updates)
          .filter(key => key !== 'id' && key !== 'createdAt')
          .map(key => (updates as any)[key]),
        updatedSession.updatedAt
      ];
      
      await query(
        `UPDATE "public"."checkout_session" SET ${updateFields.join(', ')} WHERE id = $1`,
        [id, ...updateValues]
      );
    }
    
    return updatedSession;
  }
  
  // Set shipping address for a checkout session
  async setShippingAddress(
    sessionId: string,
    address: Address
  ): Promise<CheckoutSession | null> {
    return this.updateCheckoutSession(sessionId, {
      shippingAddress: address
    });
  }
  
  // Set billing address for a checkout session
  async setBillingAddress(
    sessionId: string,
    address: Address
  ): Promise<CheckoutSession | null> {
    return this.updateCheckoutSession(sessionId, {
      billingAddress: address
    });
  }
  
  // Set shipping method for a checkout session
  async setShippingMethod(
    sessionId: string,
    shippingMethodId: string
  ): Promise<CheckoutSession | null> {
    const shippingMethod = await this.findShippingMethodById(shippingMethodId);
    
    if (!shippingMethod) {
      return null;
    }
    
    return this.updateCheckoutSession(sessionId, {
      shippingMethodId,
      shippingAmount: shippingMethod.price
    });
  }
  
  // Set payment method for a checkout session
  async setPaymentMethod(
    sessionId: string,
    paymentMethodId: string
  ): Promise<CheckoutSession | null> {
    const paymentMethod = await this.findPaymentMethodById(paymentMethodId);
    
    if (!paymentMethod) {
      return null;
    }
    
    return this.updateCheckoutSession(sessionId, {
      paymentMethodId
    });
  }
  
  // Get all available shipping methods
  async findAllShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await query<ShippingMethod[]>(
      `SELECT * FROM "public"."shipping_method" 
      WHERE "isEnabled" = true
      ORDER BY "isDefault" DESC, "name" ASC`,
      []
    );
    
    return methods || [];
  }
  
  // Find shipping method by ID
  async findShippingMethodById(id: string): Promise<ShippingMethod | null> {
    const method = await queryOne<ShippingMethod>(
      `SELECT * FROM "public"."shipping_method" WHERE id = $1 AND "isEnabled" = true`,
      [id]
    );
    
    return method || null;
  }
  
  // Get all available payment methods
  async findAllPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<PaymentMethod[]>(
      `SELECT * FROM "public"."payment_method" 
      WHERE "isEnabled" = true
      ORDER BY "isDefault" DESC, "name" ASC`,
      []
    );
    
    return methods || [];
  }
  
  // Find payment method by ID
  async findPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const method = await queryOne<PaymentMethod>(
      `SELECT * FROM "public"."payment_method" WHERE id = $1 AND "isEnabled" = true`,
      [id]
    );
    
    return method || null;
  }
  
  // Calculate order totals
  async calculateOrderTotals(sessionId: string): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Fetch basket items
    const basketItems = await query<Array<{productId: string; quantity: number; price: number}>>(
      `SELECT bi.*, p.price
      FROM "public"."basket_item" bi
      JOIN "public"."product" p ON bi."productId" = p.id
      WHERE bi."basketId" = $1`,
      [session.basketId]
    ) || [];
    
    // Calculate subtotal
    const subtotal = basketItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Get tax amount (using tax service if available)
    let taxAmount = 0;
    try {
      // This assumes a tax service exists
      
      // Calculate tax for the basket (simplified, would need proper implementation)
      if (session.shippingAddress) {
        const taxResult = await (new TaxRepo()).calculateTaxForBasket(
          session.basketId, 
          session.shippingAddress,
          session.customerId
        );
        taxAmount = taxResult.taxAmount;
      }
    } catch (error) {
      console.error('Failed to calculate taxes:', error);
    }
    
    // Calculate total
    const total = subtotal + taxAmount + (session.shippingAmount || 0) - (session.discountAmount || 0);
    
    // Update the session with calculated values
    return this.updateCheckoutSession(sessionId, {
      subtotal,
      taxAmount,
      total
    });
  }
  
  // Complete checkout and create order
  async completeCheckout(sessionId: string): Promise<OrderCreationResult> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return {
        success: false,
        errors: [{ code: 'SESSION_NOT_FOUND', message: 'Checkout session not found' }]
      };
    }
    
    // Validate checkout session before completing
    const validation = await this.validateCheckoutSession(sessionId);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    // Create order (simplified)
    const orderId = uuidv4();
    const now = unixTimestamp();
    
    try {
      // Start transaction
      await query('BEGIN', []);
      
      // Create order record
      await query(
        `INSERT INTO "public"."order" 
        (id, "customerId", "guestEmail", status, subtotal, "taxAmount", 
        "shippingAmount", "discountAmount", total, "shippingAddress", 
        "billingAddress", "shippingMethodId", "paymentMethodId", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          orderId,
          session.customerId,
          session.guestEmail,
          'pending',
          session.subtotal,
          session.taxAmount,
          session.shippingAmount,
          session.discountAmount,
          session.total,
          JSON.stringify(session.shippingAddress),
          JSON.stringify(session.billingAddress),
          session.shippingMethodId,
          session.paymentMethodId,
          String(now),
          String(now)
        ]
      );
      
      // Copy basket items to order items
      await query(
        `INSERT INTO "public"."order_item" 
        ("orderId", "productId", quantity, price, "createdAt", "updatedAt")
        SELECT $1, bi."productId", bi.quantity, p.price, $2, $2
        FROM "public"."basket_item" bi
        JOIN "public"."product" p ON bi."productId" = p.id
        WHERE bi."basketId" = $3`,
        [orderId, String(now), session.basketId]
      );
      
      // Mark checkout session as completed
      await this.updateCheckoutSession(sessionId, {
        status: 'completed',
        completedAt: String(now)
      });
      
      // Clear basket items (optional)
      await query(
        `DELETE FROM "public"."basket_item" WHERE "basketId" = $1`,
        [session.basketId]
      );
      
      // Commit transaction
      await query('COMMIT', []);
      
      return {
        success: true,
        orderId
      };
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK', []);
      
      console.error('Failed to create order:', error);
      
      return {
        success: false,
        errors: [{ code: 'ORDER_CREATION_FAILED', message: 'Failed to create order' }]
      };
    }
  }
  
  // Validate checkout session
  async validateCheckoutSession(sessionId: string): Promise<CheckoutValidationResult> {
    const session = await this.findCheckoutSessionById(sessionId);
    const errors: CheckoutError[] = [];
    
    if (!session) {
      return {
        isValid: false,
        errors: [{ code: 'SESSION_NOT_FOUND', message: 'Checkout session not found' }]
      };
    }
    
    // Check session status
    if (session.status !== 'active') {
      errors.push({
        code: 'INVALID_SESSION_STATUS',
        message: `Session status is ${session.status}, expected 'active'`
      });
    }
    
    // Check session expiry
    if (session.expiresAt && Number(session.expiresAt) < Number(unixTimestamp())) {
      errors.push({
        code: 'SESSION_EXPIRED',
        message: 'Checkout session has expired'
      });
    }
    
    // Check customer info
    if (!session.customerId && !session.guestEmail) {
      errors.push({
        code: 'MISSING_CUSTOMER_INFO',
        message: 'Either customer ID or guest email is required'
      });
    }
    
    // Check shipping address
    if (!session.shippingAddress) {
      errors.push({
        code: 'MISSING_SHIPPING_ADDRESS',
        message: 'Shipping address is required'
      });
    }
    
    // Check billing address
    if (!session.billingAddress) {
      errors.push({
        code: 'MISSING_BILLING_ADDRESS',
        message: 'Billing address is required'
      });
    }
    
    // Check shipping method
    if (!session.shippingMethodId) {
      errors.push({
        code: 'MISSING_SHIPPING_METHOD',
        message: 'Shipping method is required'
      });
    }
    
    // Check payment method
    if (!session.paymentMethodId) {
      errors.push({
        code: 'MISSING_PAYMENT_METHOD',
        message: 'Payment method is required'
      });
    }
    
    // Check basket has items
    const basketItemCount = await queryOne<{count: string}>(
      `SELECT COUNT(*) as count FROM "public"."basket_item" WHERE "basketId" = $1`,
      [session.basketId]
    );
    
    if (basketItemCount && parseInt(basketItemCount.count, 10) === 0) {
      errors.push({
        code: 'EMPTY_BASKET',
        message: 'Basket has no items'
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Abandon a checkout session
  async abandonCheckoutSession(sessionId: string): Promise<CheckoutSession | null> {
    return this.updateCheckoutSession(sessionId, {
      status: 'abandoned'
    });
  }
  
  // Clean up expired checkout sessions
  async cleanupExpiredSessions(): Promise<number> {
    const now = unixTimestamp();
    
    const result = await query<Array<{id: string}>>(
      `UPDATE "public"."checkout_session" 
      SET status = 'expired', "updatedAt" = $1
      WHERE status = 'active' AND "expiresAt" < $2
      RETURNING id`,
      [String(now), String(now)]
    ) || [];
    
    return result.length;
  }
}

export default new CheckoutRepository();
