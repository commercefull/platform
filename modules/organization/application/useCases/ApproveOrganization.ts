/**
 * ApproveOrganization Use Case
 *
 * Transitions an organization to 'approved' status and emits
 * organization.approved so subscribers can run post-approval steps.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import type { OrganizationRecord } from '../../domain/entities/OrganizationModel';
import type { OrganizationRepository } from '../../domain/repositories/OrganizationRepository';

export interface ApproveOrganizationOutput {
  organizationId: string;
  name: string;
}

export class ApproveOrganizationUseCase {
  constructor(private readonly repository: Pick<OrganizationRepository, 'update'>) {}

  async execute(organizationId: string): Promise<ApproveOrganizationOutput> {
    const organization: OrganizationRecord = await this.repository.update(organizationId, { status: 'approved' });

    await eventBus.emit('organization.approved', {
      organizationId: organization.organizationId,
      businessName: organization.name,
    });

    return { organizationId: organization.organizationId, name: organization.name };
  }
}
