export interface PaymentReport {
  paymentReportId: string;
  organizationId: string;
  type: string;
  currency: string;
  totalAmountCents: number;
  transactionCount: number;
  data?: Record<string, unknown>;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}



