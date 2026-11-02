export interface PaymentFee {
  paymentFeeId: string;
  transactionId: string;
  organizationId: string;
  type: string;
  amountCents: number;
  currency: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}



