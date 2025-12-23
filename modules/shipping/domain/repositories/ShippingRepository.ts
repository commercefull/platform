/**
 * Shipping Repository Interface
 */

import { ShippingRate } from '../entities/ShippingRate';

export interface ShippingRepository {
  findRateById(rateId: string): Promise<ShippingRate | null>;
  findRatesByCarrier(carrierId: string): Promise<ShippingRate[]>;
  findActiveRates(): Promise<ShippingRate[]>;
  findApplicableRates(params: { weight: number; subtotal: number; countryCode: string; postalCode?: string }): Promise<ShippingRate[]>;
  saveRate(rate: ShippingRate): Promise<ShippingRate>;
  deleteRate(rateId: string): Promise<void>;

  // Carriers
  getCarriers(): Promise<Array<{ carrierId: string; name: string; isActive: boolean }>>;
  getMethods(carrierId: string): Promise<Array<{ methodId: string; name: string; code: string }>>;
}
