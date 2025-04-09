import { query, queryOne } from '../../../libs/db';

// Data models for payment
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  provider: string;
  isActive: boolean;
  requiresCustomerSaved: boolean;
  config: Record<string, any>;
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  apiEndpoint?: string;
  isActive: boolean;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  testMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerPaymentMethod {
  id: string;
  customerId: string;
  paymentMethodId: string;
  gatewayId: string;
  token: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardType?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  paymentMethodId: string;
  gatewayId: string;
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  errorMessage?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionId?: string;
  gatewayResponse?: Record<string, any>;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentRepo {
  // Payment Method methods
  async findAllPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<PaymentMethod[]>('SELECT * FROM "public"."payment_method" ORDER BY "name" ASC');
    return methods || [];
  }

  async findPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const method = await queryOne<PaymentMethod>('SELECT * FROM "public"."payment_method" WHERE "id" = $1', [id]);
    return method || null;
  }

  async findPaymentMethodByCode(code: string): Promise<PaymentMethod | null> {
    const method = await queryOne<PaymentMethod>('SELECT * FROM "public"."payment_method" WHERE "code" = $1', [code]);
    return method || null;
  }

  async findActivePaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<PaymentMethod[]>('SELECT * FROM "public"."payment_method" WHERE "isActive" = true ORDER BY "name" ASC');
    return methods || [];
  }

  async createPaymentMethod(method: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentMethod> {
    const now = new Date();
    const result = await queryOne<PaymentMethod>(
      `INSERT INTO "public"."payment_method" 
      ("name", "code", "provider", "isActive", "requiresCustomerSaved", "config", "testMode", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [method.name, method.code, method.provider, method.isActive, 
       method.requiresCustomerSaved, method.config, method.testMode, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create payment method');
    }
    
    return result;
  }

  async updatePaymentMethod(id: string, method: Partial<Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentMethod> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(method).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingMethod = await this.findPaymentMethodById(id);
      if (!existingMethod) {
        throw new Error(`Payment method with ID ${id} not found`);
      }
      return existingMethod;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<PaymentMethod>(
      `UPDATE "public"."payment_method" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update payment method with ID ${id}`);
    }
    
    return result;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."payment_method" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Payment Gateway methods
  async findAllPaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await query<PaymentGateway[]>('SELECT * FROM "public"."payment_gateway" ORDER BY "name" ASC');
    return gateways || [];
  }

  async findPaymentGatewayById(id: string): Promise<PaymentGateway | null> {
    const gateway = await queryOne<PaymentGateway>('SELECT * FROM "public"."payment_gateway" WHERE "id" = $1', [id]);
    return gateway || null;
  }

  async findPaymentGatewayByCode(code: string): Promise<PaymentGateway | null> {
    const gateway = await queryOne<PaymentGateway>('SELECT * FROM "public"."payment_gateway" WHERE "code" = $1', [code]);
    return gateway || null;
  }

  async findActivePaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await query<PaymentGateway[]>('SELECT * FROM "public"."payment_gateway" WHERE "isActive" = true ORDER BY "name" ASC');
    return gateways || [];
  }

  async createPaymentGateway(gateway: Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentGateway> {
    const now = new Date();
    const result = await queryOne<PaymentGateway>(
      `INSERT INTO "public"."payment_gateway" 
      ("name", "code", "apiKey", "secretKey", "webhookSecret", "apiEndpoint", "isActive", 
       "supportedCurrencies", "supportedPaymentMethods", "testMode", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [gateway.name, gateway.code, gateway.apiKey, gateway.secretKey, gateway.webhookSecret,
       gateway.apiEndpoint, gateway.isActive, gateway.supportedCurrencies, 
       gateway.supportedPaymentMethods, gateway.testMode, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create payment gateway');
    }
    
    return result;
  }

  async updatePaymentGateway(id: string, gateway: Partial<Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentGateway> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(gateway).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      const existingGateway = await this.findPaymentGatewayById(id);
      if (!existingGateway) {
        throw new Error(`Payment gateway with ID ${id} not found`);
      }
      return existingGateway;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<PaymentGateway>(
      `UPDATE "public"."payment_gateway" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update payment gateway with ID ${id}`);
    }
    
    return result;
  }

  async deletePaymentGateway(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."payment_gateway" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Customer Payment Method methods
  async findCustomerPaymentMethods(customerId: string): Promise<CustomerPaymentMethod[]> {
    const methods = await query<CustomerPaymentMethod[]>(
      'SELECT * FROM "public"."customer_payment_method" WHERE "customerId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC',
      [customerId]
    );
    return methods || [];
  }

  async findCustomerPaymentMethodById(id: string): Promise<CustomerPaymentMethod | null> {
    const method = await queryOne<CustomerPaymentMethod>('SELECT * FROM "public"."customer_payment_method" WHERE "id" = $1', [id]);
    return method || null;
  }

  async findDefaultCustomerPaymentMethod(customerId: string): Promise<CustomerPaymentMethod | null> {
    const method = await queryOne<CustomerPaymentMethod>(
      'SELECT * FROM "public"."customer_payment_method" WHERE "customerId" = $1 AND "isDefault" = true LIMIT 1',
      [customerId]
    );
    return method || null;
  }

  async createCustomerPaymentMethod(method: Omit<CustomerPaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomerPaymentMethod> {
    const now = new Date();
    
    // If this is being set as default, clear any existing defaults
    if (method.isDefault) {
      await query(
        'UPDATE "public"."customer_payment_method" SET "isDefault" = false WHERE "customerId" = $1 AND "isDefault" = true',
        [method.customerId]
      );
    }
    
    const result = await queryOne<CustomerPaymentMethod>(
      `INSERT INTO "public"."customer_payment_method" 
      ("customerId", "paymentMethodId", "gatewayId", "token", "last4", "expiryMonth", 
       "expiryYear", "cardType", "isDefault", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [method.customerId, method.paymentMethodId, method.gatewayId, method.token,
       method.last4, method.expiryMonth, method.expiryYear, method.cardType, method.isDefault, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create customer payment method');
    }
    
    return result;
  }

  async updateCustomerPaymentMethod(id: string, method: Partial<Omit<CustomerPaymentMethod, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>): Promise<CustomerPaymentMethod> {
    const existingMethod = await this.findCustomerPaymentMethodById(id);
    
    if (!existingMethod) {
      throw new Error(`Customer payment method with ID ${id} not found`);
    }
    
    // If this is being set as default, clear any existing defaults
    if (method.isDefault) {
      await query(
        'UPDATE "public"."customer_payment_method" SET "isDefault" = false WHERE "customerId" = $1 AND "isDefault" = true',
        [existingMethod.customerId]
      );
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(method).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`"${key}" = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return existingMethod;
    }

    updates.push(`"updatedAt" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<CustomerPaymentMethod>(
      `UPDATE "public"."customer_payment_method" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update customer payment method with ID ${id}`);
    }
    
    return result;
  }

  async deleteCustomerPaymentMethod(id: string): Promise<boolean> {
    const result = await queryOne<{count: string}>(
      `WITH deleted AS (
        DELETE FROM "public"."customer_payment_method" 
        WHERE "id" = $1 
        RETURNING *
      ) 
      SELECT COUNT(*) as count FROM deleted`,
      [id]
    );
    
    return result ? parseInt(result.count) > 0 : false;
  }

  // Payment methods
  async findAllPayments(): Promise<Payment[]> {
    const payments = await query<Payment[]>('SELECT * FROM "public"."payment" ORDER BY "createdAt" DESC');
    return payments || [];
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    const payment = await queryOne<Payment>('SELECT * FROM "public"."payment" WHERE "id" = $1', [id]);
    return payment || null;
  }

  async findPaymentsByOrderId(orderId: string): Promise<Payment[]> {
    const payments = await query<Payment[]>(
      'SELECT * FROM "public"."payment" WHERE "orderId" = $1 ORDER BY "createdAt" DESC',
      [orderId]
    );
    return payments || [];
  }
  
  async findPaymentsByCustomerId(customerId: string): Promise<Payment[]> {
    const payments = await query<Payment[]>(
      'SELECT * FROM "public"."payment" WHERE "customerId" = $1 ORDER BY "createdAt" DESC',
      [customerId]
    );
    return payments || [];
  }

  async findPaymentsByStatus(status: Payment['status']): Promise<Payment[]> {
    const payments = await query<Payment[]>(
      'SELECT * FROM "public"."payment" WHERE "status" = $1 ORDER BY "createdAt" DESC',
      [status]
    );
    return payments || [];
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const now = new Date();
    const result = await queryOne<Payment>(
      `INSERT INTO "public"."payment" 
      ("orderId", "customerId", "amount", "currency", "status", "paymentMethodId", 
       "gatewayId", "transactionId", "gatewayResponse", "errorMessage", "refundedAmount", "metadata", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [payment.orderId, payment.customerId, payment.amount, payment.currency, payment.status,
       payment.paymentMethodId, payment.gatewayId, payment.transactionId, payment.gatewayResponse,
       payment.errorMessage, payment.refundedAmount, payment.metadata, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create payment');
    }
    
    return result;
  }

  async updatePaymentStatus(id: string, status: Payment['status'], updates: Partial<Pick<Payment, 'transactionId' | 'gatewayResponse' | 'errorMessage' | 'refundedAmount' | 'metadata'>> = {}): Promise<Payment> {
    const updateFields: string[] = ['"status" = $1', '"updatedAt" = $2'];
    const values: any[] = [status, new Date()];
    let paramCount = 3;
    
    // Add optional fields if provided
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramCount++}`);
        values.push(value);
      }
    });
    
    values.push(id);
    
    const result = await queryOne<Payment>(
      `UPDATE "public"."payment" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update payment status for ID ${id}`);
    }
    
    return result;
  }

  // Refund methods
  async findAllRefunds(): Promise<Refund[]> {
    const refunds = await query<Refund[]>('SELECT * FROM "public"."refund" ORDER BY "createdAt" DESC');
    return refunds || [];
  }

  async findRefundById(id: string): Promise<Refund | null> {
    const refund = await queryOne<Refund>('SELECT * FROM "public"."refund" WHERE "id" = $1', [id]);
    return refund || null;
  }

  async findRefundsByPaymentId(paymentId: string): Promise<Refund[]> {
    const refunds = await query<Refund[]>(
      'SELECT * FROM "public"."refund" WHERE "paymentId" = $1 ORDER BY "createdAt" DESC',
      [paymentId]
    );
    return refunds || [];
  }

  async createRefund(refund: Omit<Refund, 'id' | 'createdAt' | 'updatedAt'>): Promise<Refund> {
    const now = new Date();
    const result = await queryOne<Refund>(
      `INSERT INTO "public"."refund" 
      ("paymentId", "amount", "reason", "status", "transactionId", "gatewayResponse", "errorMessage", "metadata", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [refund.paymentId, refund.amount, refund.reason, refund.status, refund.transactionId,
       refund.gatewayResponse, refund.errorMessage, refund.metadata, now, now]
    );
    
    if (!result) {
      throw new Error('Failed to create refund');
    }
    
    // Update the refunded amount on the payment
    const payment = await this.findPaymentById(refund.paymentId);
    if (payment) {
      const currentRefundedAmount = payment.refundedAmount || 0;
      const newRefundedAmount = currentRefundedAmount + refund.amount;
      
      // Set payment status to refunded if full amount is refunded, otherwise partially_refunded
      let newStatus: Payment['status'] = payment.status;
      if (newRefundedAmount >= payment.amount) {
        newStatus = 'refunded';
      } else if (newRefundedAmount > 0) {
        newStatus = 'partially_refunded';
      }
      
      await this.updatePaymentStatus(payment.id, newStatus, {
        refundedAmount: newRefundedAmount
      });
    }
    
    return result;
  }

  async updateRefundStatus(id: string, status: Refund['status'], updates: Partial<Pick<Refund, 'transactionId' | 'gatewayResponse' | 'errorMessage' | 'metadata'>> = {}): Promise<Refund> {
    const updateFields: string[] = ['"status" = $1', '"updatedAt" = $2'];
    const values: any[] = [status, new Date()];
    let paramCount = 3;
    
    // Add optional fields if provided
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramCount++}`);
        values.push(value);
      }
    });
    
    values.push(id);
    
    const result = await queryOne<Refund>(
      `UPDATE "public"."refund" 
      SET ${updateFields.join(', ')} 
      WHERE "id" = $${paramCount - 1} 
      RETURNING *`,
      values
    );
    
    if (!result) {
      throw new Error(`Failed to update refund status for ID ${id}`);
    }
    
    return result;
  }
}
