import { TrackingConfig } from '../entities/TrackingConfig';

export interface TrackingConfigRepository {
  findById(configId: string): Promise<TrackingConfig | null>;
  findByStoreId(storeId: string): Promise<TrackingConfig | null>;
  findByOrganizationId(organizationId: string): Promise<TrackingConfig[]>;
  save(config: TrackingConfig): Promise<TrackingConfig>;
  delete(configId: string): Promise<void>;
}
