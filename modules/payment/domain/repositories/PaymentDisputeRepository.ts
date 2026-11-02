export interface PaymentDispute {
  paymentDisputeId: string;
  paymentId: string;
  organizationId: string;
  externalDisputeId?: string;
  status: string;
  reason?: string;
  amountCents: number;
  currency: string;
  evidence?: Record<string, unknown>;
  dueBy?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}



