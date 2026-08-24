export interface PaymentDispute {
  paymentDisputeId: string;
  paymentId: string;
  organizationId: string;
  externalDisputeId?: string;
  status: string;
  reason?: string;
  amount: number;
  currency: string;
  evidence?: Record<string, unknown>;
  dueBy?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDisputeCreateParams = Omit<PaymentDispute, 'paymentDisputeId' | 'createdAt' | 'updatedAt'>;

export interface PaymentDisputeRepository {
  findByPayment(paymentId: string): Promise<PaymentDispute[]>;
  findById(paymentDisputeId: string): Promise<PaymentDispute | null>;
  create(params: PaymentDisputeCreateParams): Promise<PaymentDispute | null>;
  updateStatus(paymentDisputeId: string, status: string, resolvedAt?: Date): Promise<PaymentDispute | null>;
  findAll(status?: string, limit?: number): Promise<PaymentDispute[]>;
}
