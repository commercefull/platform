import type { CustomerProfile } from '../../domain/entities/CustomerProfile';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';

export class ListCustomerProfilesUseCase {
  constructor(private profileRepo: CustomerProfileRepository) {}

  async execute(limit?: number, offset?: number): Promise<CustomerProfile[]> {
    return this.profileRepo.findAll(limit, offset);
  }
}

