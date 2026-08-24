export type StoreCreditEntryType = 'credit' | 'debit' | 'adjustment' | 'expiry';

export interface StoreCreditLedgerEntryProps {
  storeCreditLedgerId: string;
  customerId: string;
  entryType: StoreCreditEntryType;
  referenceType?: string;
  referenceId?: string;
  amount: number;
  balanceAfter: number;
  currency: string;
  reason?: string;
  notes?: string;
  createdBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class StoreCreditLedgerEntry {
  private props: StoreCreditLedgerEntryProps;

  private constructor(props: StoreCreditLedgerEntryProps) {
    this.props = props;
  }

  static create(params: {
    customerId: string;
    entryType: StoreCreditEntryType;
    referenceType?: string;
    referenceId?: string;
    amount: number;
    balanceAfter: number;
    currency?: string;
    reason?: string;
    notes?: string;
    createdBy?: string;
    expiresAt?: Date;
  }): StoreCreditLedgerEntry {
    const now = new Date();
    return new StoreCreditLedgerEntry({
      storeCreditLedgerId: '',
      customerId: params.customerId,
      entryType: params.entryType,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      amount: params.amount,
      balanceAfter: params.balanceAfter,
      currency: params.currency ?? 'USD',
      reason: params.reason,
      notes: params.notes,
      createdBy: params.createdBy,
      expiresAt: params.expiresAt,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: StoreCreditLedgerEntryProps): StoreCreditLedgerEntry {
    return new StoreCreditLedgerEntry(props);
  }

  get storeCreditLedgerId(): string { return this.props.storeCreditLedgerId; }
  get customerId(): string { return this.props.customerId; }
  get entryType(): StoreCreditEntryType { return this.props.entryType; }
  get referenceType(): string | undefined { return this.props.referenceType; }
  get referenceId(): string | undefined { return this.props.referenceId; }
  get amount(): number { return this.props.amount; }
  get balanceAfter(): number { return this.props.balanceAfter; }
  get currency(): string { return this.props.currency; }
  get reason(): string | undefined { return this.props.reason; }
  get notes(): string | undefined { return this.props.notes; }
  get createdBy(): string | undefined { return this.props.createdBy; }
  get expiresAt(): Date | undefined { return this.props.expiresAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isCredit(): boolean { return this.props.entryType === 'credit'; }
  get isDebit(): boolean { return this.props.entryType === 'debit'; }
  get isExpired(): boolean {
    return this.props.expiresAt !== undefined && this.props.expiresAt < new Date();
  }

  toJSON(): StoreCreditLedgerEntryProps {
    return { ...this.props };
  }
}

export interface CustomerStoreCreditBalance {
  customerId: string;
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  pendingExpiry: number;
  lastEntryAt: Date | null;
}
