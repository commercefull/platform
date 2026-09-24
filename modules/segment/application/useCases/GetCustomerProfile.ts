import type { CustomerProfile } from '../../domain/entities/CustomerProfile';
import type { CustomerProfileRepository } from '../../domain/repositories/SegmentRepository';

export class GetCustomerProfileUseCase {
  constructor(private profileRepo: CustomerProfileRepository) {}

  async execute(customerId: string): Promise<CustomerProfile | null> {
    return this.profileRepo.findByCustomerId(customerId);
  }
}

