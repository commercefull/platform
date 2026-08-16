/**
 * CreateOrganization Use Case
 */

import { eventBus } from '../../../../libs/events/eventBus';

export interface CreateOrganizationInput {
  name: string;
  email: string;
  phone?: string;
  businessType?: string;
  taxId?: string;
  website?: string;
  description?: string;
  logo?: string;
  password?: string;
}

export interface CreateOrganizationOutput {
  organizationId: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface CreateOrganizationRepository {
  findByEmail(email: string): Promise<{ merchantId: string } | null>;
  create(params: Record<string, unknown>): Promise<{ merchantId: string; name: string; email: string; status: string; createdAt: Date }>;
}

export class CreateOrganizationUseCase {
  constructor(private readonly repository: CreateOrganizationRepository) {}

  async execute(input: CreateOrganizationInput): Promise<CreateOrganizationOutput> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new Error(`Organization with email '${input.email}' already exists`);
    }

    const org = await this.repository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      businessType: input.businessType,
      taxId: input.taxId,
      website: input.website,
      description: input.description,
      logo: input.logo,
      password: input.password,
      status: 'pending',
    });

    eventBus.emit('merchant.created', {
      organizationId: org.merchantId,
      name: org.name,
      email: org.email,
    });

    return {
      organizationId: org.merchantId,
      name: org.name,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
    };
  }
}
