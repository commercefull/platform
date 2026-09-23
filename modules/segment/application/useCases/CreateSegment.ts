import { SegmentDefinition } from '../../domain/entities/SegmentDefinition';
import type { SegmentCondition, MatchMode } from '../../domain/entities/SegmentDefinition';
import { SegmentAlreadyExistsError, InvalidSegmentConditionsError } from '../../domain/errors/SegmentErrors';
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

