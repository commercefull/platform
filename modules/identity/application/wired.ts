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

// --- Token lifecycle use cases (customer + organization flows) ---------------
import { IssueTokenPairUseCase } from './useCases/token/IssueTokenPair';
import { RenewAccessTokenUseCase } from './useCases/token/RenewAccessToken';
import { LogoutSessionUseCase } from './useCases/token/LogoutSession';
import { CleanupExpiredTokensUseCase } from './useCases/token/CleanupExpiredTokens';
import { generateAccessToken, verifyAccessToken } from '../utils/jwtHelpers';

const CUSTOMER_JWT_SECRET = getSecret('CUSTOMER_JWT_SECRET');
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const jwtTokenPort = { sign: generateAccessToken, verify: verifyAccessToken };
const tokenRepo = identityDataRepository.tokens;

export const issueCustomerTokenPairUseCase = new IssueTokenPairUseCase(customerCredentialPort, tokenRepo, jwtTokenPort, {
  userType: 'customer',
  jwtSecret: CUSTOMER_JWT_SECRET,
  accessTokenDuration: ACCESS_TOKEN_DURATION,
  refreshTokenDuration: REFRESH_TOKEN_DURATION,
  requireActiveStatus: false,
  trackLoginTimestamp: true,
});
export const issueOrganizationTokenPairUseCase = new IssueTokenPairUseCase(orgCredentialPort, tokenRepo, jwtTokenPort, {
  userType: 'organization',
  jwtSecret: ORGANIZATION_JWT_SECRET,
  accessTokenDuration: ACCESS_TOKEN_DURATION,
  refreshTokenDuration: REFRESH_TOKEN_DURATION,
  requireActiveStatus: true,
  trackLoginTimestamp: false,
});
export const renewCustomerAccessTokenUseCase = new RenewAccessTokenUseCase(customerCredentialPort, tokenRepo, jwtTokenPort, {
  userType: 'customer',
  jwtSecret: CUSTOMER_JWT_SECRET,
  accessTokenDuration: ACCESS_TOKEN_DURATION,
  requireActiveStatus: false,
});
export const renewOrganizationAccessTokenUseCase = new RenewAccessTokenUseCase(orgCredentialPort, tokenRepo, jwtTokenPort, {
  userType: 'organization',
  jwtSecret: ORGANIZATION_JWT_SECRET,
  accessTokenDuration: ACCESS_TOKEN_DURATION,
  requireActiveStatus: true,
});
export const logoutSessionUseCase = new LogoutSessionUseCase(tokenRepo);
export const cleanupExpiredTokensUseCase = new CleanupExpiredTokensUseCase(tokenRepo);

// --- SCIM provisioning -------------------------------------------------------
import { ManageScimProvisioningUseCase } from './useCases/ManageScimProvisioning';

const scimProvisioningRepo = new ScimProvisioningRepositoryImpl();
export const manageScimProvisioningUseCase = new ManageScimProvisioningUseCase(scimProvisioningRepo, orgCredentialPort);

import { ProvisionAdminUserUseCase } from './useCases/ProvisionAdminUser';

export const provisionAdminUserUseCase = new ProvisionAdminUserUseCase(identityDataRepository.users);

// --- Store-user assignment (UserStoreController) ------------------------------
import { AssignUserToStoreUseCase } from './useCases/store/AssignUserToStore';
import { GetUserStoresUseCase } from './useCases/store/GetUserStores';
import { ListStoreUsersUseCase } from './useCases/store/ListStoreUsers';
import { RemoveUserFromStoreUseCase } from './useCases/store/RemoveUserFromStore';
import type { UserRepository } from '../domain/repositories/UserRepository';
import type { StoreLookupPort } from './ports/StoreLookupPort';

const userStoreFallbackUserRepository: Pick<UserRepository, 'findById'> = {
  async findById(userId: string) {
    return { userId } as Awaited<ReturnType<UserRepository['findById']>>;
  },
};

const userStoreFallbackStoreLookup: StoreLookupPort = {
  async findById(storeId: string) {
    return { storeId } as Awaited<ReturnType<StoreLookupPort['findById']>>;
  },
};

export const assignUserToStoreUseCase = new AssignUserToStoreUseCase(
  identityDataRepository.users,
  userStoreFallbackUserRepository as UserRepository,
  userStoreFallbackStoreLookup,
);
export const getUserStoresUseCase = new GetUserStoresUseCase(identityDataRepository.users);
export const listStoreUsersUseCase = new ListStoreUsersUseCase(identityDataRepository.users);
export const removeUserFromStoreUseCase = new RemoveUserFromStoreUseCase(identityDataRepository.users);

// --- Social login ------------------------------------------------------------
import { SocialLoginUseCase } from './useCases/SocialLogin';
import { LinkSocialAccountUseCase } from './useCases/LinkSocialAccount';
import { UnlinkSocialAccountUseCase } from './useCases/UnlinkSocialAccount';
import { GetLinkedAccountsUseCase } from './useCases/GetLinkedAccounts';
import { AccountNotActiveError } from '../domain/errors/IdentityErrors';

const socialAccountRepo = identityDataRepository.social;

// Find-or-create for customer social login: existing customers sign in,
// unknown emails get a verified social-only account.
export const customerSocialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData) => {
  const existing = await customerCredentialPort.findByEmail(email);

  if (existing) {
    return { userId: existing.id, isNew: false };
  }

  const created = await customerCredentialPort.createWithPassword({
    email,
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    password: '', // No password for social-only accounts
    isActive: true,
    isVerified: true, // Social login implies verified email
  });

  return { userId: created.id, isNew: true };
});

// Find-or-create for organization social login: existing orgs must be active,
// unknown emails get a pending-approval org.
export const organizationSocialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData) => {
  const existing = await orgCredentialPort.findByEmail(email);

  if (existing) {
    if (existing.status !== 'active') {
      throw new AccountNotActiveError();
    }
    return { userId: existing.id, isNew: false };
  }

  const created = await orgCredentialPort.createWithPassword({
    name: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`.trim() || email.split('@')[0],
    email,
    password: '', // No password for social-only accounts
    status: 'pending',
  });

  return { userId: created.id, isNew: true };
});

export const linkSocialAccountUseCase = new LinkSocialAccountUseCase(socialAccountRepo);
export const unlinkSocialAccountUseCase = new UnlinkSocialAccountUseCase(socialAccountRepo);
export const getLinkedAccountsUseCase = new GetLinkedAccountsUseCase(socialAccountRepo);

export { ScimProvisioningRepositoryImpl, OrganizationCredentialSubjectAdapter, identityDataRepository, CustomerCredentialSubjectAdapter };

import { RefreshTokenUseCase } from './useCases/RefreshToken';
import { LoginUseCase } from './useCases/Login';
import { LogoutUseCase } from './useCases/Logout';

export const refreshTokenUseCase = new RefreshTokenUseCase(identityDataRepository.users as never);
export const loginUseCase = new LoginUseCase(identityDataRepository.users as never);
export const logoutUseCase = new LogoutUseCase(identityDataRepository.users as never);
