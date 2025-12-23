/**
 * Tax Repository Interface
 */

import { TaxRate } from '../entities/TaxRate';

export interface TaxRepository {
  findById(taxRateId: string): Promise<TaxRate | null>;
  findByCountry(country: string): Promise<TaxRate[]>;
  findApplicable(params: { country: string; state?: string; postalCode?: string; taxClass?: string }): Promise<TaxRate[]>;
  findActive(): Promise<TaxRate[]>;
  save(taxRate: TaxRate): Promise<TaxRate>;
  delete(taxRateId: string): Promise<void>;

  // Tax calculation
  calculateTax(params: { subtotal: number; shippingCost: number; country: string; state?: string; postalCode?: string }): Promise<{
    taxAmount: number;
    taxBreakdown: Array<{ name: string; rate: number; amount: number }>;
  }>;
}
