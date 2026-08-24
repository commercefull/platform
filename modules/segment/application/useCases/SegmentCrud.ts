import { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import type { SegmentCondition, MatchMode } from '../../domain/entities/SegmentDefinition';
import { SegmentAlreadyExistsError, SegmentNotFoundError, InvalidSegmentConditionsError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';

export class CreateSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(params: {
    name: string;
    code: string;
    description?: string;
    conditions: SegmentCondition[];
    matchMode?: MatchMode;
    color?: string;
    icon?: string;
    organizationId?: string;
  }): Promise<SegmentDefinition> {
    if (!params.conditions || params.conditions.length === 0) {
      throw new InvalidSegmentConditionsError('At least one condition is required');
    }

    const existing = await this.segmentRepo.findByCode(params.code);
    if (existing) throw new SegmentAlreadyExistsError(params.code);

    const segment = SegmentDefinition.create(params);
    return this.segmentRepo.create(segment);
  }
}

export class UpdateSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(segmentId: string, params: Partial<{
    name: string;
    description: string;
    conditions: SegmentCondition[];
    matchMode: MatchMode;
    color: string;
    icon: string;
    isActive: boolean;
  }>): Promise<SegmentDefinition> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);

    segment.update(params);
    const updated = await this.segmentRepo.update(segment);
    if (!updated) throw new SegmentNotFoundError(segmentId);
    return updated;
  }
}

export class DeleteSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(segmentId: string): Promise<boolean> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);
    return this.segmentRepo.delete(segmentId);
  }
}

export class GetSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(segmentId: string): Promise<SegmentDefinition> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);
    return segment;
  }
}

export class ListSegmentsUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(activeOnly?: boolean): Promise<SegmentDefinition[]> {
    return this.segmentRepo.findAll(activeOnly);
  }
}
