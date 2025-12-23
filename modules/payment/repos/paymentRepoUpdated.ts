import { query, queryOne } from '../../../libs/db';

// Data models for payment
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  provider: string;
  is_active: boolean;
  requires_customer_saved: boolean;
  config: Record<string, any>;
  test_mode: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface PaymentGateway {
  id: string;
  name: string;
  code: string;
  api_key?: string;
  secret_key?: string;
  webhook_secret?: string;
  api_endpoint?: string;
  is_active: boolean;
  supported_currencies: string[];
  supported_payment_methods: string[];
  test_mode: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CustomerPaymentMethod {
  id: string;
  customer_id: string;
  payment_method_id: string;
  gateway_id: string;
  token: string;
  last4?: string;
  expiry_month?: number;
  expiry_year?: number;
  card_type?: string;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  payment_method_id: string;
  gateway_id: string;
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  error_message?: string;
  refunded_amount?: number;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Refund {
  id: string;
  payment_id: string;
  amount: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_id?: string;
  gateway_response?: Record<string, any>;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export class PaymentRepo {
  // Payment Method methods
  async findAllPaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<PaymentMethod[]>('SELECT * FROM "public"."payment_method" WHERE "deleted_at" IS NULL ORDER BY "name" ASC');
    return methods || [];
  }

  async findPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    const method = await queryOne<PaymentMethod>('SELECT * FROM "public"."payment_method" WHERE "id" = $1 AND "deleted_at" IS NULL', [id]);
    return method || null;
  }

  async findPaymentMethodByCode(code: string): Promise<PaymentMethod | null> {
    const method = await queryOne<PaymentMethod>('SELECT * FROM "public"."payment_method" WHERE "code" = $1 AND "deleted_at" IS NULL', [
      code,
    ]);
    return method || null;
  }

  async findActivePaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await query<PaymentMethod[]>(
      'SELECT * FROM "public"."payment_method" WHERE "is_active" = true AND "deleted_at" IS NULL ORDER BY "name" ASC',
    );
    return methods || [];
  }

  async createPaymentMethod(method: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<PaymentMethod> {
    const now = new Date();
    const result = await queryOne<PaymentMethod>(
      `INSERT INTO "public"."payment_method" 
      ("name", "code", "provider", "is_active", "requires_customer_saved", "config", "test_mode", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        method.name,
        method.code,
        method.provider,
        method.is_active,
        method.requires_customer_saved,
        method.config,
        method.test_mode,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create payment method');
    }

    return result;
  }

  async updatePaymentMethod(
    id: string,
    method: Partial<Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>,
  ): Promise<PaymentMethod> {
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

    updates.push(`"updated_at" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<PaymentMethod>(
      `UPDATE "public"."payment_method" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} AND "deleted_at" IS NULL
      RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update payment method with ID ${id}`);
    }

    return result;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const now = new Date();

    // Use soft deletion instead of hard deletion
    const result = await queryOne<{ count: string }>(
      `UPDATE "public"."payment_method"
      SET "deleted_at" = $1, "updated_at" = $1
      WHERE "id" = $2 AND "deleted_at" IS NULL
      RETURNING id`,
      [now, id],
    );

    return !!result;
  }

  // Payment Gateway methods
  async findAllPaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await query<PaymentGateway[]>(
      'SELECT * FROM "public"."payment_gateway" WHERE "deleted_at" IS NULL ORDER BY "name" ASC',
    );
    return gateways || [];
  }

  async findPaymentGatewayById(id: string): Promise<PaymentGateway | null> {
    const gateway = await queryOne<PaymentGateway>('SELECT * FROM "public"."payment_gateway" WHERE "id" = $1 AND "deleted_at" IS NULL', [
      id,
    ]);
    return gateway || null;
  }

  async findPaymentGatewayByCode(code: string): Promise<PaymentGateway | null> {
    const gateway = await queryOne<PaymentGateway>('SELECT * FROM "public"."payment_gateway" WHERE "code" = $1 AND "deleted_at" IS NULL', [
      code,
    ]);
    return gateway || null;
  }

  async findActivePaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await query<PaymentGateway[]>(
      'SELECT * FROM "public"."payment_gateway" WHERE "is_active" = true AND "deleted_at" IS NULL ORDER BY "name" ASC',
    );
    return gateways || [];
  }

  async createPaymentGateway(gateway: Omit<PaymentGateway, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<PaymentGateway> {
    const now = new Date();
    const result = await queryOne<PaymentGateway>(
      `INSERT INTO "public"."payment_gateway" 
      ("name", "code", "api_key", "secret_key", "webhook_secret", "api_endpoint", "is_active", 
       "supported_currencies", "supported_payment_methods", "test_mode", "created_at", "updated_at") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        gateway.name,
        gateway.code,
        gateway.api_key || null,
        gateway.secret_key || null,
        gateway.webhook_secret || null,
        gateway.api_endpoint || null,
        gateway.is_active,
        gateway.supported_currencies,
        gateway.supported_payment_methods,
        gateway.test_mode,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create payment gateway');
    }

    return result;
  }

  async updatePaymentGateway(
    id: string,
    gateway: Partial<Omit<PaymentGateway, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>,
  ): Promise<PaymentGateway> {
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

    updates.push(`"updated_at" = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);

    const result = await queryOne<PaymentGateway>(
      `UPDATE "public"."payment_gateway" 
      SET ${updates.join(', ')} 
      WHERE "id" = $${paramCount - 1} AND "deleted_at" IS NULL
      RETURNING *`,
      values,
    );

    if (!result) {
      throw new Error(`Failed to update payment gateway with ID ${id}`);
    }

    return result;
  }

  async deletePaymentGateway(id: string): Promise<boolean> {
    const now = new Date();

    // Use soft deletion instead of hard deletion
    const result = await queryOne<{ count: string }>(
      `UPDATE "public"."payment_gateway"
      SET "deleted_at" = $1, "updated_at" = $1
      WHERE "id" = $2 AND "deleted_at" IS NULL
      RETURNING id`,
      [now, id],
    );

    return !!result;
  }

  // Additional methods for payment subscriptions, plans, etc. would follow the same pattern
  // of using snake_case table names and implementing soft deletion patterns
}

export default new PaymentRepo();
