/**
 * Identity Social Login Controller
 *
 * Handles OAuth/social login authentication endpoints.
 */

import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { CustomerRepo } from '../../../customer/infrastructure/repositories/customerRepo';
import { OrganizationRepo } from '../../../organization/infrastructure/repositories/organizationRepo';
import { SocialAccountRepo } from '../../infrastructure/repositories/socialAccountRepo';
import { SocialProvider, SocialProfileData } from '../../domain/entities/SocialAccount';
import {
  SocialLoginUseCase,
  LinkSocialAccountUseCase,
  UnlinkSocialAccountUseCase,
  GetLinkedAccountsUseCase,
} from '../../application/useCases/SocialLogin';
import { generateAccessToken } from '../../utils/jwtHelpers';
import { eventBus } from '../../../../libs/events/eventBus';

// Environment configuration
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const ORGANIZATION_JWT_SECRET = process.env.ORGANIZATION_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

// Repositories
const customerRepo = new CustomerRepo();
const organizationRepo = new OrganizationRepo();
const socialAccountRepo = new SocialAccountRepo();

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
export async function getOAuthConfig(req: TypedRequest, res: Response): Promise<void> {
  try {
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
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get OAuth configuration',
    });
  }
}

/**
 * Handle social login callback for customers
 */
export async function customerSocialLogin(req: TypedRequest<Record<string, string>, unknown, SocialLoginBody>, res: Response): Promise<void> {
  try {
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

    // Create use case with customer finder/creator
    const socialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData, _userType) => {
      // Try to find existing customer
      let customer = await customerRepo.findCustomerByEmail(email);

      if (customer) {
        return { userId: customer.customerId, isNew: false };
      }

      // Create new customer
      customer = await customerRepo.createCustomerWithPassword({
        email,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        password: '', // No password for social-only accounts
        isActive: true,
        isVerified: true, // Social login implies verified email
      });

      return { userId: customer.customerId, isNew: true };
    });

    const result = await socialLoginUseCase.execute({
      provider,
      profile,
      userType: 'customer',
      ip: req.ip,
    });

    // Generate JWT token
    const jwtToken = generateAccessToken(result.userId, result.email, 'customer', CUSTOMER_JWT_SECRET, ACCESS_TOKEN_DURATION);

    // Emit social login event
    eventBus.emit('identity.customer.social_login', {
      userId: result.userId,
      userType: 'customer',
      email: result.email,
      provider,
      providerUserId: profile.providerUserId,
      isNewUser: result.isNewUser,
      ipAddress: req.ip,
      timestamp: new Date(),
    });

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
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? (error as Error).message : 'Social login failed',
    });
  }
}

/**
 * Handle social login callback for merchants
 */
export async function merchantSocialLogin(req: TypedRequest<Record<string, string>, unknown, SocialLoginBody>, res: Response): Promise<void> {
  try {
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

    // Create use case with merchant finder/creator
    const socialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData, _userType) => {
      // Try to find existing merchant
      let merchant = await organizationRepo.findByEmail(email);

      if (merchant) {
        // Check if merchant is active
        if (merchant.status !== 'active') {
          throw new Error(`Your account is ${merchant.status}. Please contact support.`);
        }
        return { userId: merchant.organizationId, isNew: false };
      }

      // Create new merchant (pending approval)
      merchant = await organizationRepo.createWithPassword({
        name: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`.trim() || email.split('@')[0],
        email,
        password: '', // No password for social-only accounts
        status: 'pending',
      });

      return { userId: merchant.organizationId, isNew: true };
    });

    const result = await socialLoginUseCase.execute({
      provider,
      profile,
      userType: 'organization',
      ip: req.ip,
    });

    // Generate JWT token
    const jwtToken = generateAccessToken(result.userId, result.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

    // Emit social login event
    eventBus.emit('identity.organization.social_login', {
      userId: result.userId,
      userType: 'organization',
      email: result.email,
      provider,
      providerUserId: profile.providerUserId,
      isNewUser: result.isNewUser,
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      isNewUser: result.isNewUser,
      accessToken: jwtToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION,
      merchant: {
        id: result.userId,
        email: result.email,
        name: result.profile.displayName,
        avatarUrl: result.profile.avatarUrl,
      },
      provider: result.provider,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? (error as Error).message : 'Social login failed',
    });
  }
}

/**
 * Link a social account to an existing customer
 */
export async function linkCustomerSocialAccount(req: TypedRequest<Record<string, string>, unknown, LinkAccountBody>, res: Response): Promise<void> {
  try {
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

    const linkUseCase = new LinkSocialAccountUseCase(socialAccountRepo);
    const linkedAccount = await linkUseCase.execute({
      userId: customerId,
      userType: 'customer',
      provider,
      profile,
    });

    // Emit event
    eventBus.emit('identity.customer.social_account_linked', {
      userId: customerId,
      userType: 'customer',
      provider,
      providerUserId: clientProfile.id,
      providerEmail: clientProfile.email,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `${provider} account linked successfully`,
      linkedAccount,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? (error as Error).message : 'Failed to link social account',
    });
  }
}

/**
 * Unlink a social account from a customer
 */
export async function unlinkCustomerSocialAccount(req: TypedRequest, res: Response): Promise<void> {
  try {
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

    const unlinkUseCase = new UnlinkSocialAccountUseCase(socialAccountRepo);
    await unlinkUseCase.execute({
      userId: customerId,
      userType: 'customer',
      provider,
    });

    // Emit event
    eventBus.emit('identity.customer.social_account_unlinked', {
      userId: customerId,
      userType: 'customer',
      provider,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `${provider} account unlinked successfully`,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: error instanceof Error ? (error as Error).message : 'Failed to unlink social account',
    });
  }
}

/**
 * Get linked social accounts for a customer
 */
export async function getCustomerLinkedAccounts(req: TypedRequest, res: Response): Promise<void> {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const getLinkedUseCase = new GetLinkedAccountsUseCase(socialAccountRepo);
    const linkedAccounts = await getLinkedUseCase.execute(customerId, 'customer');

    res.json({
      success: true,
      linkedAccounts,
      supportedProviders: SUPPORTED_PROVIDERS,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get linked accounts',
    });
  }
}

/**
 * Get linked social accounts for a merchant
 */
export async function getOrganizationLinkedAccounts(req: TypedRequest, res: Response): Promise<void> {
  try {
    const organizationId = req.user?.id;

    if (!organizationId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const getLinkedUseCase = new GetLinkedAccountsUseCase(socialAccountRepo);
    const linkedAccounts = await getLinkedUseCase.execute(organizationId, 'organization');

    res.json({
      success: true,
      linkedAccounts,
      supportedProviders: SUPPORTED_PROVIDERS,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get linked accounts',
    });
  }
}
