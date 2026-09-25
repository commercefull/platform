/**
 * Identity SSO Wired Use Cases
 *
 * Pre-instantiated use cases for the SSO controller.
 * Infrastructure dependencies are resolved here — controllers import from this file only.
 */

import { ManageSamlProviderUseCase } from './useCases/ManageSamlProvider';
import { ManageOidcProviderUseCase } from './useCases/ManageOidcProvider';
import { SsoLoginUseCase } from './useCases/SsoLogin';
import { ListSsoProvidersUseCase } from './useCases/ListSsoProviders';
import { SamlProviderRepositoryImpl } from '../infrastructure/repositories/SamlProviderRepositoryImpl';
import { OidcProviderRepositoryImpl } from '../infrastructure/repositories/OidcProviderRepositoryImpl';
import { OrganizationCredentialSubjectAdapter } from '../infrastructure/acl/OrganizationCredentialSubjectAdapter';
import { ScimProvisioningRepositoryImpl } from '../infrastructure/repositories/ScimProvisioningRepositoryImpl';
import identityDataRepository from '../infrastructure/repositories/IdentityDataRepository';
import { CustomerCredentialSubjectAdapter } from '../infrastructure/acl/CustomerCredentialSubjectAdapter';
import organizationRepo from '../../organization/infrastructure/repositories/organizationRepo';
import customerDataRepository from '../../customer/infrastructure/repositories/CustomerDataRepository';
import { getSecret } from '../../../libs/secrets';

const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

const samlRepo = new SamlProviderRepositoryImpl();
const oidcRepo = new OidcProviderRepositoryImpl();
export const orgCredentialPort = new OrganizationCredentialSubjectAdapter(organizationRepo);
export const customerCredentialPort = new CustomerCredentialSubjectAdapter(customerDataRepository.legacy, customerDataRepository.customers);
const orgPort = orgCredentialPort;

export const manageSamlUseCase = new ManageSamlProviderUseCase(samlRepo);
export const manageOidcUseCase = new ManageOidcProviderUseCase(oidcRepo);
export const ssoLoginUseCase = new SsoLoginUseCase(samlRepo, oidcRepo, orgPort, ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);
export const listProvidersUseCase = new ListSsoProvidersUseCase(samlRepo, oidcRepo);

import { ManageAdminUsersUseCase } from './useCases/ManageAdminUsers';
import { ManageRolesUseCase } from './useCases/ManageRoles';
import { AdminAuthUseCase } from './useCases/AdminAuth';
import { GetDashboardDataUseCase } from './useCases/GetDashboardData';
import dashboardQueryRepository from '../../analytics/infrastructure/repositories/DashboardQueryRepository';

export const manageAdminUsersUseCase = new ManageAdminUsersUseCase(identityDataRepository.users);
export const manageRolesUseCase = new ManageRolesUseCase(identityDataRepository.users);
export const adminAuthUseCase = new AdminAuthUseCase(identityDataRepository.users);
export const getDashboardDataUseCase = new GetDashboardDataUseCase(dashboardQueryRepository);

export { ScimProvisioningRepositoryImpl, OrganizationCredentialSubjectAdapter, identityDataRepository, CustomerCredentialSubjectAdapter };
