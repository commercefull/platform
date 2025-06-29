import { query, queryOne } from '../../libs/db';
import { unixTimestamp } from '../../libs/date';
import { TaxQueryRepo } from '../tax/repos/taxQueryRepo';
import { generateUUID } from '../../libs/uuid';

// Database query result interface
interface QueryResult {
  affectedRows?: number;
  insertId?: string | number;
  changedRows?: number;
}

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

// Field mapping dictionaries for database to TypeScript conversion
const checkoutSessionFields: Record<string, string> = {
  id: 'id',
  customerId: 'customer_id',
  guestEmail: 'guest_email',
  basketId: 'basket_id',
  status: 'status',
  shippingMethodId: 'shipping_method_id',
  paymentMethodId: 'payment_method_id',
  paymentIntentId: 'payment_intent_id',
  subtotal: 'subtotal',
  taxAmount: 'tax_amount',
  shippingAmount: 'shipping_amount',
  discountAmount: 'discount_amount',
  total: 'total',
  notes: 'notes',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  completedAt: 'completed_at',
  expiresAt: 'expires_at'
};

const addressFields: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  company: 'company',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  region: 'region',
  postalCode: 'postal_code',
  country: 'country',
  phone: 'phone'
};

const paymentMethodFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  type: 'type',
  isDefault: 'is_default',
  isEnabled: 'is_enabled',
  processorId: 'processor_id',
  processorConfig: 'processor_config',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

const shippingMethodFields: Record<string, string> = {
  id: 'id',
  name: 'name',
  description: 'description',
  price: 'price',
  estimatedDeliveryTime: 'estimated_delivery_time',
  isDefault: 'is_default',
  isEnabled: 'is_enabled',
  metadata: 'metadata',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
};

/**
 * Transform a database record to a TypeScript object using field mapping
 */
function transformDbToTs<T>(dbRecord: any, fieldMap: Record<string, string>): T {
  if (!dbRecord) return null as any;
  
  const result: any = {};
  
  Object.entries(fieldMap).forEach(([tsKey, dbKey]) => {
    if (dbRecord[dbKey] !== undefined) {
      result[tsKey] = dbRecord[dbKey];
    }
  });
  
  return result as T;
}

/**
 * Transform an array of database records to TypeScript objects
 */
function transformArrayDbToTs<T>(dbRecords: any[], fieldMap: Record<string, string>): T[] {
  if (!dbRecords || !Array.isArray(dbRecords)) return [];
  return dbRecords.map(record => transformDbToTs<T>(record, fieldMap));
}

export class CheckoutRepository {
  // Create a new checkout session
  async createCheckoutSession(
    basketId: string,
    customerId?: string,
    guestEmail?: string
  ): Promise<CheckoutSession> {
    const id = generateUUID();
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
      (id, "customer_id", "guest_email", "basket_id", status, subtotal, "tax_amount", 
      "shipping_amount", "discount_amount", total, "created_at", "updated_at", "expires_at")
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
    const session = await queryOne<any>(
      `SELECT * FROM "public"."checkout_session" WHERE id = $1`,
      [id]
    );
    
    return transformDbToTs<CheckoutSession>(session, checkoutSessionFields);
  }
  
  // Find checkout session by basket ID
  async findCheckoutSessionByBasketId(basketId: string): Promise<CheckoutSession | null> {
    const session = await queryOne<any>(
      `SELECT * FROM "public"."checkout_session" 
      WHERE "basket_id" = $1 AND status = 'active'
      ORDER BY "created_at" DESC LIMIT 1`,
      [basketId]
    );
    
    return transformDbToTs<CheckoutSession>(session, checkoutSessionFields);
  }
  
  // Find checkout sessions by customer ID
  async findCheckoutSessionsByCustomerId(customerId: string): Promise<CheckoutSession[]> {
    const sessions = await query<any[]>(
      `SELECT * FROM "public"."checkout_session" 
      WHERE "customer_id" = $1
      ORDER BY "created_at" DESC`,
      [customerId]
    );
    
    return transformArrayDbToTs<CheckoutSession>(sessions || [], checkoutSessionFields);
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
    
    // Convert camelCase to snake_case for the SQL query
    const dbUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt') {
        const dbKey = checkoutSessionFields[key as keyof CheckoutSession];
        if (dbKey) {
          dbUpdates[dbKey] = value;
        }
      }
    });
    
    // Always update updated_at
    dbUpdates['updated_at'] = updatedSession.updatedAt;
    
    const updateFields = Object.keys(dbUpdates)
      .map((key, index) => `"${key}" = $${index + 2}`);
    
    if (updateFields.length > 0) {
      const updateQuery = `
        UPDATE "public"."checkout_session"
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await queryOne<any>(
        updateQuery,
        [id, ...Object.values(dbUpdates)]
      );
      
      return transformDbToTs<CheckoutSession>(result, checkoutSessionFields);
    }
    
    return updatedSession;
  }
  
  // Update the shipping address for a checkout session
  async updateShippingAddress(
    sessionId: string, 
    addressData: Address
  ): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Convert Address to database format (snake_case keys)
    const dbAddressData: Record<string, any> = {};
    Object.entries(addressData).forEach(([key, value]) => {
      const dbKey = addressFields[key as keyof Address];
      if (dbKey) {
        dbAddressData[dbKey] = value;
      }
    });
    
    // Create JSON representation of address to store in session
    const updatedSession = await this.updateCheckoutSession(sessionId, {
      shippingAddress: addressData,
      updatedAt: String(unixTimestamp())
    });
    
    return updatedSession;
  }
  
  // Update the billing address for a checkout session
  async updateBillingAddress(
    sessionId: string, 
    addressData: Address
  ): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Convert Address to database format (snake_case keys)
    const dbAddressData: Record<string, any> = {};
    Object.entries(addressData).forEach(([key, value]) => {
      const dbKey = addressFields[key as keyof Address];
      if (dbKey) {
        dbAddressData[dbKey] = value;
      }
    });
    
    // Create JSON representation of address to store in session
    const updatedSession = await this.updateCheckoutSession(sessionId, {
      billingAddress: addressData,
      updatedAt: String(unixTimestamp())
    });
    
    return updatedSession;
  }
  
  // Get available shipping methods
  async getShippingMethods(): Promise<ShippingMethod[]> {
    const methods = await query<any[]>(
      `SELECT * FROM "public"."shipping_method" WHERE "is_enabled" = true ORDER BY name ASC`
    );
    
    return transformArrayDbToTs<ShippingMethod>(methods || [], shippingMethodFields);
  }
  
  // Get a specific shipping method by ID
  async getShippingMethodById(id: string): Promise<ShippingMethod | null> {
    const method = await queryOne<any>(
      `SELECT * FROM "public"."shipping_method" WHERE id = $1`,
      [id]
    );
    
    return transformDbToTs<ShippingMethod>(method, shippingMethodFields);
  }
  
  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<any[]>(
      `SELECT * FROM "public"."payment_method" WHERE "is_enabled" = true ORDER BY name ASC`
    );
    
    return transformArrayDbToTs<PaymentMethod>(methods || [], paymentMethodFields);
  }
  
  // Get a specific payment method by ID
  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const method = await queryOne<any>(
      `SELECT * FROM "public"."payment_method" WHERE id = $1`,
      [id]
    );
    
    return transformDbToTs<PaymentMethod>(method, paymentMethodFields);
  }
  
  // Select a shipping method for the checkout
  async selectShippingMethod(
    sessionId: string, 
    shippingMethodId: string
  ): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    const shippingMethod = await this.getShippingMethodById(shippingMethodId);
    
    if (!session || !shippingMethod) {
      return null;
    }
    
    // Update the session with the selected shipping method
    const updatedSession = await this.updateCheckoutSession(sessionId, {
      shippingMethodId: shippingMethod.id,
      shippingAmount: shippingMethod.price,
      total: session.subtotal + shippingMethod.price - session.discountAmount + session.taxAmount,
      updatedAt: String(unixTimestamp())
    });
    
    return updatedSession;
  }
  
  // Select a payment method for the checkout
  async selectPaymentMethod(
    sessionId: string, 
    paymentMethodId: string
  ): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    const paymentMethod = await this.getPaymentMethodById(paymentMethodId);
    
    if (!session || !paymentMethod) {
      return null;
    }
    
    // Update the session with the selected payment method
    const updatedSession = await this.updateCheckoutSession(sessionId, {
      paymentMethodId: paymentMethod.id,
      updatedAt: String(unixTimestamp())
    });
    
    return updatedSession;
  }
  
  // Calculate taxes for the checkout
  async calculateTaxes(sessionId: string): Promise<CheckoutSession | null> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session || !session.shippingAddress) {
      return null;
    }
    
    // In a real implementation, you would call the tax service here
    // For now, we'll just apply a simple tax rate
    const taxRepo = new TaxQueryRepo();
    const taxRate = await taxRepo.getTaxRateForAddress(session.shippingAddress);
    
    const taxAmount = session.subtotal * (taxRate / 100);
    
    // Update the session with the calculated tax
    const updatedSession = await this.updateCheckoutSession(sessionId, {
      taxAmount,
      total: session.subtotal + session.shippingAmount - session.discountAmount + taxAmount,
      updatedAt: String(unixTimestamp())
    });
    
    return updatedSession;
  }
  
  // Validate the checkout session before finalizing
  async validateCheckout(sessionId: string): Promise<CheckoutValidationResult> {
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return {
        isValid: false,
        errors: [{ code: 'session_not_found', message: 'Checkout session not found' }]
      };
    }
    
    const errors: CheckoutError[] = [];
    
    // Validate required fields
    if (!session.basketId) {
      errors.push({ code: 'missing_basket', message: 'No basket associated with this checkout' });
    }
    
    if (!session.shippingAddress) {
      errors.push({ code: 'missing_shipping_address', message: 'Shipping address is required' });
    }
    
    if (!session.shippingMethodId) {
      errors.push({ code: 'missing_shipping_method', message: 'Shipping method is required' });
    }
    
    if (!session.paymentMethodId) {
      errors.push({ code: 'missing_payment_method', message: 'Payment method is required' });
    }
    
    // Validate amounts
    if (session.total <= 0) {
      errors.push({ code: 'invalid_total', message: 'Order total must be greater than zero' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Clean up expired checkout sessions
  async cleanupExpiredSessions(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    
    const result = await query(
      `UPDATE checkout_session 
       SET status = 'expired', updated_at = ? 
       WHERE status = 'active' AND expires_at < ?`,
      [now, now]
    ) as QueryResult;
    
    return result.affectedRows ? Number(result.affectedRows) : 0;
  }

  // Create an order from the checkout session
  async createOrder(sessionId: string): Promise<OrderCreationResult> {
    const validation = await this.validateCheckout(sessionId);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    const session = await this.findCheckoutSessionById(sessionId);
    
    if (!session) {
      return {
        success: false,
        errors: [{ code: 'session_not_found', message: 'Checkout session not found' }]
      };
    }
    
    // Process payment and create order
    // This would be a complex process in a real implementation
    // For now, we'll just create a placeholder
    const orderId = generateUUID();
    
    // Mark the checkout as completed
    await this.updateCheckoutSession(sessionId, {
      status: 'completed',
      completedAt: String(unixTimestamp())
    });
    
    return {
      success: true,
      orderId
    };
  }
}

export default new CheckoutRepository();
