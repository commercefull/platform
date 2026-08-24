export interface PaymentFee {
  paymentFeeId: string;
  transactionId: string;
  organizationId: string;
  type: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentFeeCreateParams = Omit<PaymentFee, 'paymentFeeId' | 'createdAt' | 'updatedAt'>;

export interface PaymentFeeRepository {
  findByTransaction(transactionId: string): Promise<PaymentFee[]>;
  create(params: PaymentFeeCreateParams): Promise<PaymentFee | null>;
  sumByMerchant(organizationId: string, currency: string): Promise<number>;
  findAll(limit?: number): Promise<PaymentFee[]>;
}
