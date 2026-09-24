import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';

export class RecomputeAllProfilesUseCase {
  constructor(private profileRepo: CustomerProfileRepository) {}

  async execute(): Promise<number> {
    return this.profileRepo.recomputeAll();
  }
}

