/**
 * GetCustomerSegments Use Case
 * 
 * Gets all segments a customer belongs to.
 */

import { Segment } from '../../domain/entities/Segment';
import { ISegmentRepository } from '../../domain/repositories/SegmentRepository';

export interface GetCustomerSegmentsInput {
  customerId: string;
}

export interface GetCustomerSegmentsOutput {
  customerId: string;
  segments: Array<{
    segmentId: string;
    name: string;
    type: string;
  }>;
}

export class GetCustomerSegmentsUseCase {
  constructor(private readonly segmentRepository: ISegmentRepository) {}

  async execute(input: GetCustomerSegmentsInput): Promise<GetCustomerSegmentsOutput> {
    const segments = await this.segmentRepository.findByCustomerId(input.customerId);

    return {
      customerId: input.customerId,
      segments: segments.map(s => ({
        segmentId: s.segmentId,
        name: s.name,
        type: s.type,
      })),
    };
  }
}
