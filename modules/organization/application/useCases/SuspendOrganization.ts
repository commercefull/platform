/**
 * SuspendOrganization Use Case
 *
 * Transitions an organization to 'suspended' status and emits
 * organization.suspended so subscribers can react to the suspension.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { OrganizationRecord } from '../../domain/entities/OrganizationModel';
import type { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';

export interface SuspendOrganizationOutput {
  organizationId: string;
  name: string;
}

export class SuspendOrganizationUseCase {
  constructor(private readonly repository: Pick<OrganizationRepository, 'update'>) {}

  async execute(organizationId: string): Promise<SuspendOrganizationOutput> {
    const organization: OrganizationRecord = await this.repository.update(organizationId, { status: 'suspended' });

    await eventBus.emit('organization.suspended', {
      organizationId: organization.organizationId,
      businessName: organization.name,
    });

    return { organizationId: organization.organizationId, name: organization.name };
  }
}
