export interface PaymentReport {
  paymentReportId: string;
  organizationId: string;
  type: string;
  currency: string;
  totalAmount: number;
  transactionCount: number;
  data?: Record<string, unknown>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentReportCreateParams = Omit<PaymentReport, 'paymentReportId' | 'createdAt' | 'updatedAt'>;

export interface PaymentReportRepository {
  findByMerchant(organizationId: string): Promise<PaymentReport[]>;
  findByDateRange(organizationId: string, from: Date, to: Date): Promise<PaymentReport[]>;
  create(params: PaymentReportCreateParams): Promise<PaymentReport | null>;
  findAll(limit?: number): Promise<PaymentReport[]>;
  findById(paymentReportId: string): Promise<PaymentReport | null>;
}
