export type B2BUserStatus = 'active' | 'invited' | 'suspended' | 'removed';
export type B2BUserRole = 'admin' | 'buyer' | 'approver' | 'viewer';

import { B2BUserStatusError } from '../errors/B2BErrors';

export interface SpendingLimit {
  perOrderLimit?: number;
  monthlyLimit?: number;
  quarterlyLimit?: number;
  annualLimit?: number;
}

export interface SpendingPeriod {
  period: 'monthly' | 'quarterly' | 'annual';
  spent: number;
  startDate: Date;
  endDate: Date;
}

export interface B2BUserProps {
  userId: string;
  companyId: string;
  organizationId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: B2BUserRole;
  status: B2BUserStatus;
  spendingLimits: SpendingLimit;
  department?: string;
  costCenter?: string;
  invitedAt: Date;
  activatedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class B2BUser {
  private props: B2BUserProps;

  private constructor(props: B2BUserProps) {
    this.props = { ...props };
  }

  static create(input: {
    companyId: string;
    organizationId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: B2BUserRole;
    spendingLimits?: SpendingLimit;
    department?: string;
    costCenter?: string;
  }): B2BUser {
    const now = new Date();
    return new B2BUser({
      userId: crypto.randomUUID(),
      companyId: input.companyId,
      organizationId: input.organizationId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? 'buyer',
      status: 'invited',
      spendingLimits: input.spendingLimits ?? {},
      department: input.department,
      costCenter: input.costCenter,
      invitedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: B2BUserProps): B2BUser {
    return new B2BUser(props);
  }

  get userId(): string { return this.props.userId; }
  get companyId(): string { return this.props.companyId; }
  get organizationId(): string { return this.props.organizationId; }
  get email(): string { return this.props.email; }
  get firstName(): string | undefined { return this.props.firstName; }
  get lastName(): string | undefined { return this.props.lastName; }
  get role(): B2BUserRole { return this.props.role; }
  get status(): B2BUserStatus { return this.props.status; }
  get spendingLimits(): SpendingLimit { return this.props.spendingLimits; }
  get department(): string | undefined { return this.props.department; }
  get costCenter(): string | undefined { return this.props.costCenter; }
  get invitedAt(): Date { return this.props.invitedAt; }
  get activatedAt(): Date | undefined { return this.props.activatedAt; }
  get lastLoginAt(): Date | undefined { return this.props.lastLoginAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  activate(): void {
    if (this.props.status !== 'invited') {
      throw new B2BUserStatusError(this.props.userId, 'activate', this.props.status);
    }
    this.props.status = 'active';
    this.props.activatedAt = new Date();
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    if (this.props.status === 'removed') {
      throw new B2BUserStatusError(this.props.userId, 'suspend', this.props.status);
    }
    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.props.status !== 'suspended') {
      throw new B2BUserStatusError(this.props.userId, 'reactivate', this.props.status);
    }
    this.props.status = 'active';
    this.props.updatedAt = new Date();
  }

  remove(): void {
    this.props.status = 'removed';
    this.props.updatedAt = new Date();
  }

  setRole(role: B2BUserRole): void {
    this.props.role = role;
    this.props.updatedAt = new Date();
  }

  setSpendingLimits(limits: SpendingLimit): void {
    this.props.spendingLimits = limits;
    this.props.updatedAt = new Date();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }

  canPlaceOrder(amount: number, currentPeriodSpent: number, period: keyof SpendingLimit): boolean {
    const limit = this.props.spendingLimits[period];
    if (limit === undefined) return true;
    if (period === 'perOrderLimit') return amount <= limit;
    return currentPeriodSpent + amount <= limit;
  }

  updateProfile(input: {
    firstName?: string;
    lastName?: string;
    department?: string;
    costCenter?: string;
  }): void {
    if (input.firstName !== undefined) this.props.firstName = input.firstName;
    if (input.lastName !== undefined) this.props.lastName = input.lastName;
    if (input.department !== undefined) this.props.department = input.department;
    if (input.costCenter !== undefined) this.props.costCenter = input.costCenter;
    this.props.updatedAt = new Date();
  }

  get fullName(): string {
    return [this.props.firstName, this.props.lastName].filter(Boolean).join(' ') || this.props.email;
  }

  get isActive(): boolean {
    return this.props.status === 'active';
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
