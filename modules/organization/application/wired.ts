import organizationRepoInstance, {
  OrganizationRepo as OrganizationRepoClass,
  Organization,
} from '../infrastructure/repositories/organizationRepo';
import { ApproveOrganizationUseCase } from './useCases/ApproveOrganization';
import { SuspendOrganizationUseCase } from './useCases/SuspendOrganization';
import { CreateOrganizationUseCase } from './useCases/CreateOrganization';
import { ManageOrganizationsUseCase } from './useCases/ManageOrganizations';

export { OrganizationRepoClass as OrganizationRepo, Organization, organizationRepoInstance };

export const approveOrganizationUseCase = new ApproveOrganizationUseCase(organizationRepoInstance);
export const suspendOrganizationUseCase = new SuspendOrganizationUseCase(organizationRepoInstance);
export const createOrganizationUseCase = new CreateOrganizationUseCase(organizationRepoInstance);
export const manageOrganizationsUseCase = new ManageOrganizationsUseCase(organizationRepoInstance);
