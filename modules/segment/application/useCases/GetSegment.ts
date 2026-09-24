import type { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';

export class GetSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(segmentId: string): Promise<SegmentDefinition> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);
    return segment;
  }
}

