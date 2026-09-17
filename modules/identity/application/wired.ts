/**
 * Identity SSO Wired Use Cases
 *
 * Pre-instantiated use cases for the SSO controller.
 * Infrastructure dependencies are resolved here — controllers import from this file only.
 */

import { ManageSamlProviderUseCase, ManageOidcProviderUseCase, SsoLoginUseCase, ListSsoProvidersUseCase } from './useCases/Sso';
import { SamlProviderRepositoryImpl } from '../infrastructure/repositories/SamlProviderRepositoryImpl';
import { OidcProviderRepositoryImpl } from '../infrastructure/repositories/OidcProviderRepositoryImpl';
import { OrganizationCredentialSubjectAdapter } from '../infrastructure/acl/OrganizationCredentialSubjectAdapter';
import { ScimProvisioningRepositoryImpl } from '../infrastructure/repositories/ScimProvisioningRepositoryImpl';
import identityDataRepository from '../infrastructure/repositories/IdentityDataRepository';
import { CustomerCredentialSubjectAdapter } from '../infrastructure/acl/CustomerCredentialSubjectAdapter';
import { getSecret } from '../../../libs/secrets';

const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

const samlRepo = new SamlProviderRepositoryImpl();
const oidcRepo = new OidcProviderRepositoryImpl();
const orgPort = new OrganizationCredentialSubjectAdapter();

export const manageSamlUseCase = new ManageSamlProviderUseCase(samlRepo);
export const manageOidcUseCase = new ManageOidcProviderUseCase(oidcRepo);
export const ssoLoginUseCase = new SsoLoginUseCase(samlRepo, oidcRepo, orgPort, ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);
export const listProvidersUseCase = new ListSsoProvidersUseCase(samlRepo, oidcRepo);

export { ScimProvisioningRepositoryImpl, OrganizationCredentialSubjectAdapter, identityDataRepository, CustomerCredentialSubjectAdapter };
