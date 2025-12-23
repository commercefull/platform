/**
 * CreateSegment Use Case
 */

import { Segment, SegmentType, SegmentRule, EvaluationFrequency } from '../../domain/entities/Segment';
import { ISegmentRepository } from '../../domain/repositories/SegmentRepository';

export interface CreateSegmentInput {
  name: string;
  description?: string;
  type: SegmentType;
  rules?: SegmentRule[];
  staticMemberIds?: string[];
  evaluationFrequency?: EvaluationFrequency;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateSegmentOutput {
  segment: Segment;
}

export class CreateSegmentUseCase {
  constructor(private readonly segmentRepository: ISegmentRepository) {}

  async execute(input: CreateSegmentInput): Promise<CreateSegmentOutput> {
    const segment = Segment.create({
      name: input.name,
      description: input.description,
      type: input.type,
      rules: input.rules || [],
      staticMemberIds: input.staticMemberIds || [],
      evaluationFrequency: input.evaluationFrequency || 'daily',
      isActive: input.isActive ?? true,
      metadata: input.metadata,
    });

    const saved = await this.segmentRepository.save(segment);
    return { segment: saved };
  }
}
