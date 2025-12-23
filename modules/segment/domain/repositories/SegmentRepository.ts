/**
 * Segment Repository Interface
 */

import { Segment, SegmentType } from '../entities/Segment';

export interface SegmentFilters {
  type?: SegmentType;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISegmentRepository {
  save(segment: Segment): Promise<Segment>;
  findById(segmentId: string): Promise<Segment | null>;
  findAll(filters?: SegmentFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Segment>>;
  findByCustomerId(customerId: string): Promise<Segment[]>;
  delete(segmentId: string): Promise<boolean>;

  // Membership operations
  addMember(segmentId: string, customerId: string): Promise<void>;
  removeMember(segmentId: string, customerId: string): Promise<void>;
  getMembers(segmentId: string, pagination?: PaginationOptions): Promise<PaginatedResult<string>>;
  isMember(segmentId: string, customerId: string): Promise<boolean>;

  // Evaluation
  evaluateSegment(segmentId: string): Promise<string[]>;
  updateMemberCount(segmentId: string, count: number): Promise<void>;
}
