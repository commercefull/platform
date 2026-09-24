/**
 * Fulfillment Source Port
 *
 * Query port for the data needed to plan fulfillment: the stores that can
 * fulfill online orders and the fallback warehouse. Record types match the
 * shapes consumed by the planning logic; infrastructure adapters map module
 * entities (store/warehouse) onto them.
 */

export interface FulfillableStore {
  storeId: string;
  name: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  settings?: {
    allowOnlineOrdering?: boolean;
    pickup?: { enabled?: boolean };
    localDelivery?: { enabled?: boolean };
  };
  priority?: number;
}

export interface FulfillmentWarehouse {
  distributionWarehouseId: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export interface FulfillmentSourcePort {
  findFulfillableStores(): Promise<FulfillableStore[]>;
  findDefaultWarehouse(): Promise<FulfillmentWarehouse | null>;
}
