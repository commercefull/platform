export interface PaymentBalance {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BalanceTransaction {
  paymentBalanceId: string;
  organizationId: string;
  currency: string;
  amount: number;
  type: 'credit' | 'debit';
  referenceId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentBalanceRepository {
  findByMerchant(organizationId: string): Promise<PaymentBalance[]>;
  credit(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null>;
  debit(organizationId: string, currency: string, amount: number): Promise<PaymentBalance | null>;
  getBalance(organizationId: string, currency: string): Promise<number>;
  findAll(): Promise<PaymentBalance[]>;
}
