import { KeyRotationPolicy, KeyType } from '../entities/KeyRotationPolicy';
import { PaginatedResult, PaginationOptions } from '../../../../libs/types/shared';

export interface KeyRotationPolicyFilters {
  organizationId?: string;
  keyType?: KeyType;
  status?: string;
  dueForRotation?: boolean;
  overdue?: boolean;
}

export interface KeyRotationPolicyRepository {
  findById(keyRotationPolicyId: string): Promise<KeyRotationPolicy | null>;
  findByOrganization(organizationId: string, filters?: KeyRotationPolicyFilters): Promise<KeyRotationPolicy[]>;
  findByKeyIdentifier(organizationId: string, keyIdentifier: string): Promise<KeyRotationPolicy | null>;
  findDueForRotation(): Promise<KeyRotationPolicy[]>;
  findOverdue(): Promise<KeyRotationPolicy[]>;
  save(policy: KeyRotationPolicy): Promise<KeyRotationPolicy>;
  delete(keyRotationPolicyId: string): Promise<void>;
  findAll(filters?: KeyRotationPolicyFilters, pagination?: PaginationOptions): Promise<PaginatedResult<KeyRotationPolicy>>;
}
