import type { SegmentDefinition } from '../entities/SegmentDefinition';
import type { CustomerProfile } from '../entities/CustomerProfile';

export interface SegmentRepository {
  findById(id: string): Promise<SegmentDefinition | null>;
  findByCode(code: string): Promise<SegmentDefinition | null>;
  findAll(activeOnly?: boolean): Promise<SegmentDefinition[]>;
  findByOrganization(organizationId: string, activeOnly?: boolean): Promise<SegmentDefinition[]>;

  create(segment: SegmentDefinition): Promise<SegmentDefinition>;
  update(segment: SegmentDefinition): Promise<SegmentDefinition | null>;
  delete(id: string): Promise<boolean>;
  activate(id: string): Promise<SegmentDefinition | null>;
  deactivate(id: string): Promise<SegmentDefinition | null>;

  count(activeOnly?: boolean): Promise<number>;
}

export interface CustomerProfileRepository {
  findByCustomerId(customerId: string): Promise<CustomerProfile | null>;
  findAll(limit?: number, offset?: number): Promise<CustomerProfile[]>;
  findBySegment(segmentId: string): Promise<CustomerProfile[]>;
  findByTier(tier: string): Promise<CustomerProfile[]>;
  findByRFM(rfmSegment: string): Promise<CustomerProfile[]>;

  upsert(profile: CustomerProfile): Promise<CustomerProfile>;
  updateAggregates(customerId: string, aggregates: Partial<CustomerProfile>): Promise<CustomerProfile | null>;
  delete(customerId: string): Promise<boolean>;
  count(): Promise<number>;

  computeAggregatesFromOrder(customerId: string): Promise<CustomerProfile | null>;
  recomputeAll(): Promise<number>;
}

export interface SegmentMembershipRepository {
  findBySegment(segmentId: string): Promise<{ customerId: string; matchScore: number | null }[]>;
  findByCustomer(customerId: string): Promise<{ segmentId: string; matchScore: number | null }[]>;
  upsert(segmentId: string, customerId: string, matchScore?: number): Promise<void>;
  remove(segmentId: string, customerId: string): Promise<void>;
  removeAllForSegment(segmentId: string): Promise<void>;
  countBySegment(segmentId: string): Promise<number>;
}
