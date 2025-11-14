import { query, queryOne } from '../../../libs/db';
import { unixTimestamp } from '../../../libs/date';

// TypeScript interfaces with camelCase properties
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
  deletedAt?: Date;
}

export interface PaymentGateway {
  id: string;
  merchantId: string;
  name: string;
  provider: string;
  isActive: boolean;
  isDefault: boolean;
  isTestMode: boolean;
  apiKey?: string;
  apiSecret?: string;
  publicKey?: string;
  webhookSecret?: string;
  apiEndpoint?: string;
  supportedPaymentMethods: string[];
  supportedCurrencies: string[];
  processingFees?: Record<string, any>;
  checkoutSettings?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaymentMethodConfig {
  id: string;
  merchantId: string;
  paymentMethod: string;
  isEnabled: boolean;
  displayName?: string;
  description?: string;
  processingFee?: number;
  minimumAmount?: number;
  maximumAmount?: number;
  displayOrder: number;
  icon?: string;
  supportedCurrencies: string[];
  countries?: string[];
  gatewayId?: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  customerId: string;
  paymentMethodConfigId: string;
  gatewayId: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'voided' | 'failed' | 'cancelled' | 'expired';
  paymentMethodDetails?: Record<string, any>;
  gatewayResponse?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
  customerIp?: string;
  capturedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface PaymentRefund {
  id: string;
  transactionId: string;
  externalRefundId?: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gatewayResponse?: Record<string, any>;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Mapping dictionaries
const gatewayDbToTsMap: Record<string, string> = {
  'id': 'id',
  'merchant_id': 'merchantId',
  'name': 'name',
  'provider': 'provider',
  'is_active': 'isActive',
  'is_default': 'isDefault',
  'is_test_mode': 'isTestMode',
  'api_key': 'apiKey',
  'api_secret': 'apiSecret',
  'public_key': 'publicKey',
  'webhook_secret': 'webhookSecret',
  'api_endpoint': 'apiEndpoint',
  'supported_payment_methods': 'supportedPaymentMethods',
  'supported_currencies': 'supportedCurrencies',
  'processing_fees': 'processingFees',
  'checkout_settings': 'checkoutSettings',
  'metadata': 'metadata',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt'
};

const gatewayTsToDbMap: Record<string, string> = Object.entries(gatewayDbToTsMap)
  .reduce((acc, [dbCol, tsProp]) => {
    acc[tsProp] = dbCol;
    return acc;
  }, {} as Record<string, string>);

const methodConfigDbToTsMap: Record<string, string> = {
  'id': 'id',
  'merchant_id': 'merchantId',
  'payment_method': 'paymentMethod',
  'is_enabled': 'isEnabled',
  'display_name': 'displayName',
  'description': 'description',
  'processing_fee': 'processingFee',
  'minimum_amount': 'minimumAmount',
  'maximum_amount': 'maximumAmount',
  'display_order': 'displayOrder',
  'icon': 'icon',
  'supported_currencies': 'supportedCurrencies',
  'countries': 'countries',
  'gateway_id': 'gatewayId',
  'configuration': 'configuration',
  'metadata': 'metadata',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt'
};

const methodConfigTsToDbMap: Record<string, string> = Object.entries(methodConfigDbToTsMap)
  .reduce((acc, [dbCol, tsProp]) => {
    acc[tsProp] = dbCol;
    return acc;
  }, {} as Record<string, string>);

const transactionDbToTsMap: Record<string, string> = {
  'id': 'id',
  'order_id': 'orderId',
  'customer_id': 'customerId',
  'payment_method_config_id': 'paymentMethodConfigId',
  'gateway_id': 'gatewayId',
  'external_transaction_id': 'externalTransactionId',
  'amount': 'amount',
  'currency': 'currency',
  'status': 'status',
  'payment_method_details': 'paymentMethodDetails',
  'gateway_response': 'gatewayResponse',
  'error_code': 'errorCode',
  'error_message': 'errorMessage',
  'refunded_amount': 'refundedAmount',
  'metadata': 'metadata',
  'customer_ip': 'customerIp',
  'captured_at': 'capturedAt',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt'
};

const transactionTsToDbMap: Record<string, string> = Object.entries(transactionDbToTsMap)
  .reduce((acc, [dbCol, tsProp]) => {
    acc[tsProp] = dbCol;
    return acc;
  }, {} as Record<string, string>);

const refundDbToTsMap: Record<string, string> = {
  'id': 'id',
  'transaction_id': 'transactionId',
  'external_refund_id': 'externalRefundId',
  'amount': 'amount',
  'currency': 'currency',
  'reason': 'reason',
  'status': 'status',
  'gateway_response': 'gatewayResponse',
  'error_code': 'errorCode',
  'error_message': 'errorMessage',
  'metadata': 'metadata',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'deleted_at': 'deletedAt'
};

const refundTsToDbMap: Record<string, string> = Object.entries(refundDbToTsMap)
  .reduce((acc, [dbCol, tsProp]) => {
    acc[tsProp] = dbCol;
    return acc;
  }, {} as Record<string, string>);

export class PaymentRepo {
  // Helper methods for mapping
  private tsToDbGateway(propertyName: string): string {
    return gatewayTsToDbMap[propertyName] || propertyName;
  }

  private generateGatewaySelectFields(): string {
    return Object.keys(gatewayDbToTsMap).map(dbCol => 
      `"${dbCol}" AS "${gatewayDbToTsMap[dbCol]}"`
    ).join(', ');
  }

  private tsToDbMethodConfig(propertyName: string): string {
    return methodConfigTsToDbMap[propertyName] || propertyName;
  }

  private generateMethodConfigSelectFields(): string {
    return Object.keys(methodConfigDbToTsMap).map(dbCol => 
      `"${dbCol}" AS "${methodConfigDbToTsMap[dbCol]}"`
    ).join(', ');
  }

  private tsToDbTransaction(propertyName: string): string {
    return transactionTsToDbMap[propertyName] || propertyName;
  }

  private generateTransactionSelectFields(): string {
    return Object.keys(transactionDbToTsMap).map(dbCol => 
      `"${dbCol}" AS "${transactionDbToTsMap[dbCol]}"`
    ).join(', ');
  }

  private tsToDbRefund(propertyName: string): string {
    return refundTsToDbMap[propertyName] || propertyName;
  }

  private generateRefundSelectFields(): string {
    return Object.keys(refundDbToTsMap).map(dbCol => 
      `"${dbCol}" AS "${refundDbToTsMap[dbCol]}"`
    ).join(', ');
  }

  // Payment Gateway Methods
  async findAllGateways(merchantId: string): Promise<PaymentGateway[]> {
    const selectFields = this.generateGatewaySelectFields();
    const gateways = await query<PaymentGateway[]>(
      `SELECT ${selectFields} FROM "public"."payment_gateway" 
       WHERE "merchantId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "name" ASC`, 
      [merchantId]
    );
    return gateways || [];
  }

  async findGatewayById(id: string): Promise<PaymentGateway | null> {
    const selectFields = this.generateGatewaySelectFields();
    return await queryOne<PaymentGateway>(
      `SELECT ${selectFields} FROM "public"."payment_gateway" 
       WHERE "id" = $1 AND "deletedAt" IS NULL`, 
      [id]
    );
  }

  async findDefaultGateway(merchantId: string): Promise<PaymentGateway | null> {
    const selectFields = this.generateGatewaySelectFields();
    return await queryOne<PaymentGateway>(
      `SELECT ${selectFields} FROM "public"."payment_gateway" 
       WHERE "merchantId" = $1 AND "isDefault" = true AND "deletedAt" IS NULL`, 
      [merchantId]
    );
  }

  async createGateway(gateway: Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<PaymentGateway> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const columnMap: Record<string, any> = {
      'created_at': now,
      'updated_at': now
    };

    for (const [key, value] of Object.entries(gateway)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbGateway(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const selectFields = this.generateGatewaySelectFields();
    
    const result = await queryOne<PaymentGateway>(
      `INSERT INTO "public"."payment_gateway" (${columns.map(c => `"${c}"`).join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create payment gateway');
    }
    
    // If this is the default gateway, ensure it's the only default
    if (gateway.isDefault) {
      await query(
        `UPDATE "public"."payment_gateway" 
         SET "isDefault" = false 
         WHERE "merchantId" = $1 AND "id" != $2 AND "deletedAt" IS NULL`,
        [gateway.merchantId, result.id]
      );
    }
    
    return result;
  }

  async updateGateway(id: string, gateway: Partial<Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<PaymentGateway> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const updateData: Record<string, any> = { 'updated_at': now };

    for (const [key, value] of Object.entries(gateway)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbGateway(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      // No updates needed, just return the existing gateway
      const existingGateway = await this.findGatewayById(id);
      if (!existingGateway) {
        throw new Error('Payment gateway not found');
      }
      return existingGateway;
    }
    
    // Get the gateway to check if we're changing the default status and to get merchantId
    const existingGateway = await this.findGatewayById(id);
    if (!existingGateway) {
      throw new Error('Payment gateway not found');
    }
    
    // Prepare SQL statement
    const setStatements = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    const values = [...Object.values(updateData), id];
    
    const selectFields = this.generateGatewaySelectFields();
    
    const result = await queryOne<PaymentGateway>(
      `UPDATE "public"."payment_gateway" 
       SET ${setStatements.join(', ')} 
       WHERE "id" = $${values.length} AND "deletedAt" IS NULL
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to update payment gateway');
    }
    
    // If this is now the default gateway, ensure it's the only default
    if (gateway.isDefault && gateway.isDefault !== existingGateway.isDefault) {
      await query(
        `UPDATE "public"."payment_gateway" 
         SET "isDefault" = false 
         WHERE "merchantId" = $1 AND "id" != $2 AND "deletedAt" IS NULL`,
        [existingGateway.merchantId, id]
      );
    }
    
    return result;
  }

  async deleteGateway(id: string): Promise<boolean> {
    const now = unixTimestamp();
    
    // Soft delete by setting deleted_at
    const result = await query(
      `UPDATE "public"."payment_gateway" 
       SET "deletedAt" = $1 
       WHERE "id" = $2 AND "deletedAt" IS NULL`,
      [now, id]
    );
    
    return result !== null;
  }

  // Payment Method Config Methods
  async findAllMethodConfigs(merchantId: string): Promise<PaymentMethodConfig[]> {
    const selectFields = this.generateMethodConfigSelectFields();
    const configs = await query<PaymentMethodConfig[]>(
      `SELECT ${selectFields} FROM "public"."payment_method_config" 
       WHERE "merchantId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "display_order" ASC, "display_name" ASC`, 
      [merchantId]
    );
    return configs || [];
  }

  async findMethodConfigById(id: string): Promise<PaymentMethodConfig | null> {
    const selectFields = this.generateMethodConfigSelectFields();
    return await queryOne<PaymentMethodConfig>(
      `SELECT ${selectFields} FROM "public"."payment_method_config" 
       WHERE "id" = $1 AND "deletedAt" IS NULL`, 
      [id]
    );
  }

  async findEnabledMethodConfigs(merchantId: string): Promise<PaymentMethodConfig[]> {
    const selectFields = this.generateMethodConfigSelectFields();
    const configs = await query<PaymentMethodConfig[]>(
      `SELECT ${selectFields} FROM "public"."payment_method_config" 
       WHERE "merchantId" = $1 AND "isEnabled" = true AND "deletedAt" IS NULL 
       ORDER BY "display_order" ASC, "display_name" ASC`, 
      [merchantId]
    );
    return configs || [];
  }

  async createMethodConfig(config: Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<PaymentMethodConfig> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const columnMap: Record<string, any> = {
      'created_at': now,
      'updated_at': now
    };

    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbMethodConfig(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const selectFields = this.generateMethodConfigSelectFields();
    
    const result = await queryOne<PaymentMethodConfig>(
      `INSERT INTO "public"."payment_method_config" (${columns.map(c => `"${c}"`).join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create payment method configuration');
    }
    
    return result;
  }

  async updateMethodConfig(id: string, config: Partial<Omit<PaymentMethodConfig, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<PaymentMethodConfig> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const updateData: Record<string, any> = { 'updated_at': now };

    for (const [key, value] of Object.entries(config)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbMethodConfig(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      // No updates needed, just return the existing config
      const existingConfig = await this.findMethodConfigById(id);
      if (!existingConfig) {
        throw new Error('Payment method configuration not found');
      }
      return existingConfig;
    }
    
    // Prepare SQL statement
    const setStatements = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    const values = [...Object.values(updateData), id];
    
    const selectFields = this.generateMethodConfigSelectFields();
    
    const result = await queryOne<PaymentMethodConfig>(
      `UPDATE "public"."payment_method_config" 
       SET ${setStatements.join(', ')} 
       WHERE "id" = $${values.length} AND "deletedAt" IS NULL
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to update payment method configuration');
    }
    
    return result;
  }

  async deleteMethodConfig(id: string): Promise<boolean> {
    const now = unixTimestamp();
    
    // Soft delete by setting deleted_at
    const result = await query(
      `UPDATE "public"."payment_method_config" 
       SET "deletedAt" = $1 
       WHERE "id" = $2 AND "deletedAt" IS NULL`,
      [now, id]
    );
    
    return result !== null;
  }

  // Transaction methods
  async findTransactionById(id: string): Promise<PaymentTransaction | null> {
    const selectFields = this.generateTransactionSelectFields();
    return await queryOne<PaymentTransaction>(
      `SELECT ${selectFields} FROM "public"."payment_transaction" 
       WHERE "id" = $1 AND "deletedAt" IS NULL`, 
      [id]
    );
  }

  async findTransactionsByOrderId(orderId: string): Promise<PaymentTransaction[]> {
    const selectFields = this.generateTransactionSelectFields();
    const transactions = await query<PaymentTransaction[]>(
      `SELECT ${selectFields} FROM "public"."payment_transaction" 
       WHERE "orderId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC`, 
      [orderId]
    );
    return transactions || [];
  }

  async findTransactionsByCustomerId(customerId: string, limit: number = 10, offset: number = 0): Promise<PaymentTransaction[]> {
    const selectFields = this.generateTransactionSelectFields();
    const transactions = await query<PaymentTransaction[]>(
      `SELECT ${selectFields} FROM "public"."payment_transaction" 
       WHERE "customerId" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`, 
      [customerId, limit, offset]
    );
    return transactions || [];
  }

  async createTransaction(transaction: Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<PaymentTransaction> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const columnMap: Record<string, any> = {
      'created_at': now,
      'updated_at': now
    };

    for (const [key, value] of Object.entries(transaction)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbTransaction(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const selectFields = this.generateTransactionSelectFields();
    
    const result = await queryOne<PaymentTransaction>(
      `INSERT INTO "public"."payment_transaction" (${columns.map(c => `"${c}"`).join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create payment transaction');
    }
    
    return result;
  }

  async updateTransaction(id: string, transaction: Partial<Omit<PaymentTransaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<PaymentTransaction> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const updateData: Record<string, any> = { 'updated_at': now };

    for (const [key, value] of Object.entries(transaction)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbTransaction(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      // No updates needed, just return the existing transaction
      const existingTransaction = await this.findTransactionById(id);
      if (!existingTransaction) {
        throw new Error('Payment transaction not found');
      }
      return existingTransaction;
    }
    
    // Prepare SQL statement
    const setStatements = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    const values = [...Object.values(updateData), id];
    
    const selectFields = this.generateTransactionSelectFields();
    
    const result = await queryOne<PaymentTransaction>(
      `UPDATE "public"."payment_transaction" 
       SET ${setStatements.join(', ')} 
       WHERE "id" = $${values.length} AND "deletedAt" IS NULL
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to update payment transaction');
    }
    
    return result;
  }

  // Refund methods
  async findRefundById(id: string): Promise<PaymentRefund | null> {
    const selectFields = this.generateRefundSelectFields();
    return await queryOne<PaymentRefund>(
      `SELECT ${selectFields} FROM "public"."payment_refund" 
       WHERE "id" = $1 AND "deletedAt" IS NULL`, 
      [id]
    );
  }

  async findRefundsByTransactionId(transactionId: string): Promise<PaymentRefund[]> {
    const selectFields = this.generateRefundSelectFields();
    const refunds = await query<PaymentRefund[]>(
      `SELECT ${selectFields} FROM "public"."payment_refund" 
       WHERE "transaction_id" = $1 AND "deletedAt" IS NULL 
       ORDER BY "createdAt" DESC`, 
      [transactionId]
    );
    return refunds || [];
  }

  async createRefund(refund: Omit<PaymentRefund, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<PaymentRefund> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const columnMap: Record<string, any> = {
      'created_at': now,
      'updated_at': now
    };

    for (const [key, value] of Object.entries(refund)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbRefund(key);
        columnMap[dbColumn] = value;
      }
    }
    
    const columns = Object.keys(columnMap);
    const values = Object.values(columnMap);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const selectFields = this.generateRefundSelectFields();
    
    const result = await queryOne<PaymentRefund>(
      `INSERT INTO "public"."payment_refund" (${columns.map(c => `"${c}"`).join(', ')}) 
       VALUES (${placeholders}) 
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to create payment refund');
    }
    
    // Update the transaction's refunded amount
    await query(
      `UPDATE "public"."payment_transaction" 
       SET "refunded_amount" = COALESCE("refunded_amount", 0) + $1,
           "status" = CASE
             WHEN COALESCE("refunded_amount", 0) + $1 >= "amount" THEN 'refunded'::payment_status
             ELSE 'partially_refunded'::payment_status
           END,
           "updatedAt" = $2
       WHERE "id" = $3 AND "deletedAt" IS NULL`,
      [refund.amount, now, refund.transactionId]
    );
    
    return result;
  }

  async updateRefund(id: string, refund: Partial<Omit<PaymentRefund, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>): Promise<PaymentRefund> {
    const now = unixTimestamp();
    
    // Map TS properties to DB columns
    const updateData: Record<string, any> = { 'updated_at': now };

    for (const [key, value] of Object.entries(refund)) {
      if (value !== undefined) {
        const dbColumn = this.tsToDbRefund(key);
        updateData[dbColumn] = value;
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updatedAt
      // No updates needed, just return the existing refund
      const existingRefund = await this.findRefundById(id);
      if (!existingRefund) {
        throw new Error('Payment refund not found');
      }
      return existingRefund;
    }
    
    // Prepare SQL statement
    const setStatements = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 1}`);
    const values = [...Object.values(updateData), id];
    
    const selectFields = this.generateRefundSelectFields();
    
    const result = await queryOne<PaymentRefund>(
      `UPDATE "public"."payment_refund" 
       SET ${setStatements.join(', ')} 
       WHERE "id" = $${values.length} AND "deletedAt" IS NULL
       RETURNING ${selectFields}`,
      values
    );
    
    if (!result) {
      throw new Error('Failed to update payment refund');
    }
    
    return result;
  }
}

export default new PaymentRepo();
