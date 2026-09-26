/**
 * Identity Social Login Controller
 *
 * Handles OAuth/social login authentication endpoints.
 */

import type { HttpRequest, HttpResponse } from 'libs/http';

import { SocialProvider, SocialProfileData } from '../../domain/entities/SocialAccount';
import { generateAccessToken } from '../../utils/jwtHelpers';
import {
  customerSocialLoginUseCase,
  organizationSocialLoginUseCase,
  linkSocialAccountUseCase,
  unlinkSocialAccountUseCase,
  getLinkedAccountsUseCase,
} from '../../application/wired';
import { getSecret } from '../../../../libs/secrets';

// Environment configuration
const CUSTOMER_JWT_SECRET = getSecret('CUSTOMER_JWT_SECRET');
const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

// Supported providers
const SUPPORTED_PROVIDERS: SocialProvider[] = ['google', 'facebook', 'apple', 'github', 'twitter', 'linkedin', 'microsoft'];

interface SocialLoginBody {
  accessToken?: string;
  idToken?: string;
  profile?: {
    id: string;
    email: string;
    name?: string;
    displayName?: string;
    firstName?: string;
    given_name?: string;
    lastName?: string;
    family_name?: string;
    picture?: string;
    avatar?: string;
    profileUrl?: string;
    [key: string]: unknown;
  };
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string;
}

interface LinkAccountBody {
  accessToken?: string;
  profile?: {
    id: string;
    email?: string;
    name?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    avatar?: string;
    [key: string]: unknown;
  };
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string;
}

/**
 * Validate provider
 */
function isValidProvider(provider: string): provider is SocialProvider {
  return SUPPORTED_PROVIDERS.includes(provider as SocialProvider);
}

/**
 * Get OAuth configuration for a provider
 */
export async function getOAuthConfig(req: HttpRequest, res: HttpResponse): Promise<void> {
  const { provider } = req.params;

  if (!isValidProvider(provider)) {
    res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`,
    });
    return;
  }

  // Return OAuth configuration (client IDs are public, secrets are not)
  const config: Record<string, { clientId: string; authUrl: string; scopes: string[] }> = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      scopes: ['openid', 'email', 'profile'],
    },
    facebook: {
      clientId: process.env.FACEBOOK_APP_ID || '',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      scopes: ['email', 'public_profile'],
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      authUrl: 'https://appleid.apple.com/auth/authorize',
      scopes: ['name', 'email'],
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      authUrl: 'https://github.com/login/oauth/authorize',
      scopes: ['read:user', 'user:email'],
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID || '',
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      scopes: ['tweet.read', 'users.read'],
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      scopes: ['openid', 'profile', 'email'],
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      scopes: ['openid', 'email', 'profile'],
    },
  };

  res.json({
    success: true,
    provider,
    config: config[provider],
  });
}

/**
 * Handle social login callback for customers
 */
export async function customerSocialLogin(
  req: HttpRequest<Record<string, string>, unknown, SocialLoginBody>,
  res: HttpResponse,
): Promise<void> {
  const { provider } = req.params;
  const { accessToken, idToken, profile: clientProfile } = req.body;

  if (!isValidProvider(provider)) {
    res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`,
    });
    return;
  }

  if (!accessToken && !idToken) {
    res.status(400).json({
      success: false,
      message: 'Access token or ID token is required',
    });
    return;
  }

  // In a real implementation, you would:
  // 1. Verify the token with the provider
  // 2. Extract user profile from the verified token
  // For now, we'll use the profile sent by the client (after frontend verification)

  if (!clientProfile || !clientProfile.id || !clientProfile.email) {
    res.status(400).json({
      success: false,
      message: 'Profile with id and email is required',
    });
    return;
  }

  const profile: SocialProfileData = {
    providerUserId: clientProfile.id,
    email: clientProfile.email,
    displayName: clientProfile.name || clientProfile.displayName,
    firstName: clientProfile.firstName || clientProfile.given_name,
    lastName: clientProfile.lastName || clientProfile.family_name,
    avatarUrl: clientProfile.picture || clientProfile.avatar,
    profileUrl: clientProfile.profileUrl,
    accessToken: accessToken || '',
    refreshToken: req.body.refreshToken,
    tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    scopes: req.body.scopes ? req.body.scopes.split(',') : undefined,
    rawData: clientProfile,
  };

  const result = await customerSocialLoginUseCase.execute({
    provider,
    profile,
    userType: 'customer',
    ip: req.ip,
  });

  // Generate JWT token
  const jwtToken = generateAccessToken(result.userId, result.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

  res.json({
    success: true,
    isNewUser: result.isNewUser,
    accessToken: jwtToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_DURATION,
    customer: {
      id: result.userId,
      email: result.email,
      firstName: result.profile.firstName,
      lastName: result.profile.lastName,
      avatarUrl: result.profile.avatarUrl,
    },
    provider: result.provider,
  });
}

/**
 * Handle social login callback for merchants
 */
export async function merchantSocialLogin(
  req: HttpRequest<Record<string, string>, unknown, SocialLoginBody>,
  res: HttpResponse,
): Promise<void> {
  const { provider } = req.params;
  const { accessToken, idToken, profile: clientProfile } = req.body;

  if (!isValidProvider(provider)) {
    res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`,
    });
    return;
  }

  if (!accessToken && !idToken) {
    res.status(400).json({
      success: false,
      message: 'Access token or ID token is required',
    });
    return;
  }

  if (!clientProfile || !clientProfile.id || !clientProfile.email) {
    res.status(400).json({
      success: false,
      message: 'Profile with id and email is required',
    });
    return;
  }

  const profile: SocialProfileData = {
    providerUserId: clientProfile.id,
    email: clientProfile.email,
    displayName: clientProfile.name || clientProfile.displayName,
    firstName: clientProfile.firstName || clientProfile.given_name,
    lastName: clientProfile.lastName || clientProfile.family_name,
    avatarUrl: clientProfile.picture || clientProfile.avatar,
    profileUrl: clientProfile.profileUrl,
    accessToken: accessToken || '',
    refreshToken: req.body.refreshToken,
    tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    scopes: req.body.scopes ? req.body.scopes.split(',') : undefined,
    rawData: clientProfile,
  };

  const result = await organizationSocialLoginUseCase.execute({
    provider,
    profile,
    userType: 'organization',
    ip: req.ip,
  });

  // Generate JWT token
  const jwtToken = generateAccessToken(result.userId, result.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

  res.json({
    success: true,
    isNewUser: result.isNewUser,
    accessToken: jwtToken,
    tokenType: 'Bearer',
    expiresIn: ACCESS_TOKEN_DURATION,
    organization: {
      id: result.userId,
      email: result.email,
      name: result.profile.displayName,
      avatarUrl: result.profile.avatarUrl,
    },
    provider: result.provider,
  });
}

/**
 * Link a social account to an existing customer
 */
export async function linkCustomerSocialAccount(
  req: HttpRequest<Record<string, string>, unknown, LinkAccountBody>,
  res: HttpResponse,
): Promise<void> {
  const { provider } = req.params;
  const customerId = req.user?.id;

  if (!customerId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!isValidProvider(provider)) {
    res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`,
    });
    return;
  }

  const { accessToken, profile: clientProfile } = req.body;

  if (!clientProfile || !clientProfile.id) {
    res.status(400).json({
      success: false,
      message: 'Profile with id is required',
    });
    return;
  }

  const profile: SocialProfileData = {
    providerUserId: clientProfile.id,
    email: clientProfile.email,
    displayName: clientProfile.name || clientProfile.displayName,
    firstName: clientProfile.firstName,
    lastName: clientProfile.lastName,
    avatarUrl: clientProfile.picture || clientProfile.avatar,
    accessToken: accessToken || '',
    refreshToken: req.body.refreshToken,
    tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
    scopes: req.body.scopes ? req.body.scopes.split(',') : undefined,
    rawData: clientProfile,
  };

  const linkedAccount = await linkSocialAccountUseCase.execute({
    userId: customerId,
    userType: 'customer',
    provider,
    profile,
  });

  res.json({
    success: true,
    message: `${provider} account linked successfully`,
    linkedAccount,
  });
}

/**
 * Unlink a social account from a customer
 */
export async function unlinkCustomerSocialAccount(req: HttpRequest, res: HttpResponse): Promise<void> {
  const { provider } = req.params;
  const customerId = req.user?.id;

  if (!customerId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (!isValidProvider(provider)) {
    res.status(400).json({
      success: false,
      message: `Unsupported provider: ${provider}`,
    });
    return;
  }

  await unlinkSocialAccountUseCase.execute({
    userId: customerId,
    userType: 'customer',
    provider,
  });

  res.json({
    success: true,
    message: `${provider} account unlinked successfully`,
  });
}

/**
 * Get linked social accounts for a customer
 */
export async function getCustomerLinkedAccounts(req: HttpRequest, res: HttpResponse): Promise<void> {
  const customerId = req.user?.id;

  if (!customerId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const linkedAccounts = await getLinkedAccountsUseCase.execute(customerId, 'customer');

  res.json({
    success: true,
    linkedAccounts,
    supportedProviders: SUPPORTED_PROVIDERS,
  });
}

/**
 * Get linked social accounts for a merchant
 */
export async function getOrganizationLinkedAccounts(req: HttpRequest, res: HttpResponse): Promise<void> {
  const organizationId = req.user?.id;

  if (!organizationId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  const linkedAccounts = await getLinkedAccountsUseCase.execute(organizationId, 'organization');

  res.json({
    success: true,
    linkedAccounts,
    supportedProviders: SUPPORTED_PROVIDERS,
  });
}
