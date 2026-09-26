import {
  FulfillmentLocationNotFoundError,
  FulfillmentPartnerNotFoundError,
  FulfillmentValidationError,
} from '../../domain/errors/FulfillmentErrors';

export interface CreateFulfillmentLocationInput {
  organizationId?: string;
  type?: string;
  name?: string;
  code?: string;
  addressId?: string;
  timezone?: string;
  sellerId?: string;
  capabilities?: {
    canShip?: boolean;
    canPickup?: boolean;
    canLocalDeliver?: boolean;
  };
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
}

interface FulfillmentLocationCreateParams {
  organizationId: string;
  type: 'warehouse' | 'store' | 'dropship_vendor' | '3pl' | 'dark_store';
  name: string;
  code?: string;
  addressId?: string;
  timezone?: string;
  sellerId?: string;
  capabilities?: {
    canShip?: boolean;
    canPickup?: boolean;
    canLocalDeliver?: boolean;
  };
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
}

interface FulfillmentLocationUpdateParams {
  name?: string;
  code?: string;
  addressId?: string;
  timezone?: string;
  isActive?: boolean;
  capabilities?: Record<string, boolean>;
  operatingHours?: Record<string, { open: string; close: string }>;
  latitude?: number;
  longitude?: number;
}

export interface FulfillmentLocationFilters {
  type?: string;
  isActive?: boolean;
}

export interface NearestLocationOptions {
  limit?: number;
  type?: string;
  organizationId?: string;
}

interface FulfillmentLocationPort {
  create(params: FulfillmentLocationCreateParams): Promise<Record<string, unknown>>;
  findById(locationId: string): Promise<Record<string, unknown> | null>;
  findByOrganization(organizationId: string, filters?: FulfillmentLocationFilters): Promise<Record<string, unknown>[]>;
  update(locationId: string, params: FulfillmentLocationUpdateParams): Promise<Record<string, unknown> | null>;
  activate(locationId: string): Promise<boolean>;
  deactivate(locationId: string): Promise<boolean>;
  deleteLocation(locationId: string): Promise<boolean>;
  findNearestLocations(latitude: number, longitude: number, options?: NearestLocationOptions): Promise<Record<string, unknown>[]>;
}

interface FulfillmentPartnerCreateParams {
  name: string;
  code: string;
  type: string | null;
  apiConfig: unknown | null;
  address: unknown | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean | null;
}

export interface FulfillmentPartnerUpdateParams {
  name?: string;
  type?: string | null;
  apiConfig?: unknown | null;
  address?: unknown | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isActive?: boolean | null;
}

interface FulfillmentPartnerPort {
  findAll(activeOnly?: boolean): Promise<Record<string, unknown>[]>;
  findById(partnerId: string): Promise<Record<string, unknown> | null>;
  create(params: FulfillmentPartnerCreateParams): Promise<Record<string, unknown> | null>;
  update(partnerId: string, params: FulfillmentPartnerUpdateParams): Promise<Record<string, unknown> | null>;
  remove(partnerId: string): Promise<boolean>;
}

export class ManageFulfillmentLocationsUseCase {
  constructor(
    private readonly locationRepo: FulfillmentLocationPort,
    private readonly partnerRepo: FulfillmentPartnerPort,
  ) {}

  async createLocation(params: CreateFulfillmentLocationInput) {
    if (!params.organizationId?.trim()) {
      throw new FulfillmentValidationError('organizationId is required');
    }
    if (!params.type?.trim()) {
      throw new FulfillmentValidationError('type is required');
    }
    if (!params.name?.trim()) {
      throw new FulfillmentValidationError('name is required');
    }
    return this.locationRepo.create(params as FulfillmentLocationCreateParams);
  }

  async getLocation(locationId: string) {
    const location = await this.locationRepo.findById(locationId);
    if (!location) {
      throw new FulfillmentLocationNotFoundError(locationId);
    }
    return location;
  }

  async listLocations(organizationId: string, filters?: FulfillmentLocationFilters) {
    return this.locationRepo.findByOrganization(organizationId, filters);
  }

  async updateLocation(locationId: string, params: FulfillmentLocationUpdateParams) {
    const location = await this.locationRepo.update(locationId, params);
    if (!location) {
      throw new FulfillmentLocationNotFoundError(locationId);
    }
    return location;
  }

  async activateLocation(locationId: string) {
    return this.locationRepo.activate(locationId);
  }

  async deactivateLocation(locationId: string) {
    return this.locationRepo.deactivate(locationId);
  }

  async deleteLocation(locationId: string) {
    await this.locationRepo.deleteLocation(locationId);
  }

  async findNearestLocations(latitude: number | undefined, longitude: number | undefined, options?: NearestLocationOptions) {
    if (latitude === undefined || longitude === undefined || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new FulfillmentValidationError('latitude and longitude query params are required');
    }
    return this.locationRepo.findNearestLocations(latitude, longitude, options);
  }

  async listPartners(activeOnly?: boolean) {
    return this.partnerRepo.findAll(activeOnly);
  }

  async getPartner(partnerId: string) {
    const partner = await this.partnerRepo.findById(partnerId);
    if (!partner) {
      throw new FulfillmentPartnerNotFoundError(partnerId);
    }
    return partner;
  }

  async createPartner(params: { name?: string; code?: string; type?: string | null; apiConfig?: unknown; address?: unknown; contactEmail?: string | null; contactPhone?: string | null; isActive?: boolean | null }) {
    if (!params.name?.trim()) {
      throw new FulfillmentValidationError('name is required');
    }
    if (!params.code?.trim()) {
      throw new FulfillmentValidationError('code is required');
    }
    return this.partnerRepo.create(params as FulfillmentPartnerCreateParams);
  }

  async updatePartner(partnerId: string, params: FulfillmentPartnerUpdateParams) {
    const partner = await this.partnerRepo.update(partnerId, params);
    if (!partner) {
      throw new FulfillmentPartnerNotFoundError(partnerId);
    }
    return partner;
  }

  async deletePartner(partnerId: string) {
    await this.partnerRepo.remove(partnerId);
  }
}
