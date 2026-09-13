import organizationRepoInstance, {
  OrganizationRepo as OrganizationRepoClass,
  Organization,
} from '../infrastructure/repositories/organizationRepo';

export { OrganizationRepoClass as OrganizationRepo, Organization, organizationRepoInstance };
