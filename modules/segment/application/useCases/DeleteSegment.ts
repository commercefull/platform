import { SegmentNotFoundError } from '../../domain/errors/SegmentErrors';
import type { SegmentRepository } from '../../domain/repositories/SegmentRepository';

export class DeleteSegmentUseCase {
  constructor(private segmentRepo: SegmentRepository) {}

  async execute(segmentId: string): Promise<boolean> {
    const segment = await this.segmentRepo.findById(segmentId);
    if (!segment) throw new SegmentNotFoundError(segmentId);
    return this.segmentRepo.delete(segmentId);
  }
}

