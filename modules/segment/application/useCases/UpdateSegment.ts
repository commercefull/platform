import type { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import type { SegmentCondition, MatchMode } from '../../domain/entities/SegmentDefinition';
import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';

export class UpdateSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(
    segmentId: string,
    params: Partial<{
      name: string;
      description: string;
      conditions: SegmentCondition[];
      matchMode: MatchMode;
      color: string;
      icon: string;
      isActive: boolean;
    }>,
  ): Promise<SegmentDefinition> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);

    segment.update(params);
    const updated = await this.segmentRepo.update(segment);
    if (!updated) throw new SegmentNotFoundError(segmentId);
    return updated;
  }
}

