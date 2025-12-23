/**
 * Identity Social Login Controller
 *
 * Handles OAuth/social login authentication endpoints.
 */

import { logger } from '../../../libs/logger';
import { Request, Response } from 'express';
import { CustomerRepo } from '../../customer/repos/customerRepo';
import { MerchantRepo } from '../../merchant/repos/merchantRepo';
import { SocialAccountRepo } from '../repos/socialAccountRepo';
import { SocialProvider, UserType, SocialProfileData } from '../domain/entities/SocialAccount';
import {
  SocialLoginUseCase,
  LinkSocialAccountUseCase,
  UnlinkSocialAccountUseCase,
  GetLinkedAccountsUseCase,
} from '../application/useCases/SocialLogin';
import { generateAccessToken, parseExpirationDate } from '../utils/jwtHelpers';
import { eventBus } from '../../../libs/events/eventBus';

// Environment configuration
const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || 'customer-secret-key-should-be-in-env';
const MERCHANT_JWT_SECRET = process.env.MERCHANT_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

// Repositories
const customerRepo = new CustomerRepo();
const merchantRepo = new MerchantRepo();
const socialAccountRepo = new SocialAccountRepo();

// Supported providers
const SUPPORTED_PROVIDERS: SocialProvider[] = ['google', 'facebook', 'apple', 'github', 'twitter', 'linkedin', 'microsoft'];

/**
 * Validate provider
 */
function isValidProvider(provider: string): provider is SocialProvider {
  return SUPPORTED_PROVIDERS.includes(provider as SocialProvider);
}

/**
 * Get OAuth configuration for a provider
 */
export async function getOAuthConfig(req: Request, res: Response): Promise<void> {
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
export async function customerSocialLogin(req: Request, res: Response): Promise<void> {
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
      accessToken,
      refreshToken: req.body.refreshToken,
      tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      scopes: req.body.scopes,
      rawData: clientProfile,
    };

    // Create use case with customer finder/creator
    const socialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData, userType) => {
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
      message: error instanceof Error ? error.message : 'Social login failed',
    });
  }
}

/**
 * Handle social login callback for merchants
 */
export async function merchantSocialLogin(req: Request, res: Response): Promise<void> {
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
      accessToken,
      refreshToken: req.body.refreshToken,
      tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      scopes: req.body.scopes,
      rawData: clientProfile,
    };

    // Create use case with merchant finder/creator
    const socialLoginUseCase = new SocialLoginUseCase(socialAccountRepo, async (email, profileData, userType) => {
      // Try to find existing merchant
      let merchant = await merchantRepo.findByEmail(email);

      if (merchant) {
        // Check if merchant is active
        if (merchant.status !== 'active') {
          throw new Error(`Your account is ${merchant.status}. Please contact support.`);
        }
        return { userId: merchant.merchantId, isNew: false };
      }

      // Create new merchant (pending approval)
      merchant = await merchantRepo.createMerchantWithPassword({
        name: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`.trim() || email.split('@')[0],
        email,
        password: '', // No password for social-only accounts
        status: 'pending',
      });

      return { userId: merchant.merchantId, isNew: true };
    });

    const result = await socialLoginUseCase.execute({
      provider,
      profile,
      userType: 'merchant',
      ip: req.ip,
    });

    // Generate JWT token
    const jwtToken = generateAccessToken(result.userId, result.email, 'merchant', MERCHANT_JWT_SECRET, ACCESS_TOKEN_DURATION);

    // Emit social login event
    eventBus.emit('identity.merchant.social_login', {
      userId: result.userId,
      userType: 'merchant',
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
      message: error instanceof Error ? error.message : 'Social login failed',
    });
  }
}

/**
 * Link a social account to an existing customer
 */
export async function linkCustomerSocialAccount(req: Request, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const customerId = (req as any).user?.id;

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
      accessToken,
      refreshToken: req.body.refreshToken,
      tokenExpiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      scopes: req.body.scopes,
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
      message: error instanceof Error ? error.message : 'Failed to link social account',
    });
  }
}

/**
 * Unlink a social account from a customer
 */
export async function unlinkCustomerSocialAccount(req: Request, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const customerId = (req as any).user?.id;

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
      message: error instanceof Error ? error.message : 'Failed to unlink social account',
    });
  }
}

/**
 * Get linked social accounts for a customer
 */
export async function getCustomerLinkedAccounts(req: Request, res: Response): Promise<void> {
  try {
    const customerId = (req as any).user?.id;

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
export async function getMerchantLinkedAccounts(req: Request, res: Response): Promise<void> {
  try {
    const merchantId = (req as any).user?.id;

    if (!merchantId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const getLinkedUseCase = new GetLinkedAccountsUseCase(socialAccountRepo);
    const linkedAccounts = await getLinkedUseCase.execute(merchantId, 'merchant');

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
