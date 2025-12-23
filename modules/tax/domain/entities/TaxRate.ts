/**
 * Tax Rate Entity
 */

export type TaxType = 'percentage' | 'fixed';

export interface TaxRateProps {
  taxRateId: string;
  name: string;
  code: string;
  type: TaxType;
  rate: number;
  country: string;
  state?: string;
  postalCodes?: string[];
  taxClass?: string;
  isCompound: boolean;
  isShippingTaxed: boolean;
  priority: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class TaxRate {
  private props: TaxRateProps;

  private constructor(props: TaxRateProps) {
    this.props = props;
  }

  static create(props: Omit<TaxRateProps, 'isActive' | 'createdAt' | 'updatedAt'>): TaxRate {
    const now = new Date();
    return new TaxRate({
      ...props,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TaxRateProps): TaxRate {
    return new TaxRate(props);
  }

  get taxRateId(): string {
    return this.props.taxRateId;
  }
  get name(): string {
    return this.props.name;
  }
  get rate(): number {
    return this.props.rate;
  }
  get country(): string {
    return this.props.country;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  calculateTax(amount: number): number {
    if (!this.props.isActive) return 0;
    if (this.props.type === 'fixed') return this.props.rate;
    return amount * (this.props.rate / 100);
  }

  isApplicable(country: string, state?: string, postalCode?: string): boolean {
    if (!this.props.isActive) return false;
    if (this.props.country !== country) return false;
    if (this.props.state && this.props.state !== state) return false;
    if (this.props.postalCodes?.length && postalCode && !this.props.postalCodes.includes(postalCode)) return false;
    return true;
  }

  toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
