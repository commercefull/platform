import type { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';

export class ListSegmentsUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(activeOnly?: boolean): Promise<SegmentDefinition[]> {
    return this.segmentRepo.findAll(activeOnly);
  }
}
