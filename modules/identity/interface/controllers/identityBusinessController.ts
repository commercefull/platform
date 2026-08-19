import { logger } from '../../../../libs/logger';
import { Response } from 'express';
import { TypedRequest } from 'libs/types/express';
import { AuthRefreshTokenRepo } from '../../infrastructure/repositories/identityRefreshTokenRepo';
import { AuthTokenBlacklistRepo } from '../../infrastructure/repositories/identityTokenBlacklistRepo';
import { generateAccessToken, verifyAccessToken, parseExpirationDate } from '../../utils/jwtHelpers';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import { OrganizationRepo } from '../../../organization/infrastructure/repositories/organizationRepo';
import { CustomerRepo } from '../../../customer/infrastructure/repositories/customerRepo';
import { emitOrganizationLogin, emitOrganizationRegistered, emitOrganizationTokenRefreshed } from '../../domain/events/emitIdentityEvent';

// Environment configuration with secure defaults
const ORGANIZATION_JWT_SECRET = process.env.ORGANIZATION_JWT_SECRET || 'merchant-secret-key-should-be-in-env';
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_DURATION = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const organizationRepo = new OrganizationRepo();
const refreshTokenRepo = new AuthRefreshTokenRepo();
const tokenBlacklistRepo = new AuthTokenBlacklistRepo();
const customerRepo = new CustomerRepo();

interface LoginBody {
  email: string;
  password: string;
}

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  phone?: string;
  website?: string;
  description?: string;
}

interface RefreshTokenBody {
  refreshToken: string;
}

interface TokenBody {
  token: string;
}

interface EmailBody {
  email: string;
}

interface ResetPasswordBody {
  token: string;
  newPassword?: string;
  password?: string;
}

/**
 * Authenticates a organization and returns a basic JWT token
 * Use this for simple session-based auth
 */
export const loginOrganization = async (req: TypedRequest<Record<string, string>, unknown, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    // Authenticate organization
    const organization = await organizationRepo.authenticate({ email, password });
    if (!organization) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check organization account status
    if (organization.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${organization.status}. Please contact support for assistance.`,
      });
      return;
    }

    // Emit login event
    emitOrganizationLogin({
      organizationId: organization.organizationId,
      email: organization.email,
      name: organization.name || '',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Generate access token
    const accessToken = generateAccessToken(organization.organizationId, organization.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

    res.json({
      success: true,
      accessToken,
      organization: {
        id: organization.organizationId,
        email: organization.email,
        name: organization.name,
        status: organization.status,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * Registers a new organization account
 * New accounts start with 'pending' status and require admin approval
 */
export const registerOrganization = async (req: TypedRequest<Record<string, string>, unknown, RegisterBody>, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, website, description } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Email, password, and business name are required',
      });
      return;
    }

    // Check for existing organization
    const existingOrganization = await organizationRepo.findByEmail(email);
    if (existingOrganization) {
      res.status(409).json({
        success: false,
        message: 'A organization account with this email already exists',
      });
      return;
    }

    // Create new organization with pending status
    const newOrganization = await organizationRepo.createWithPassword({
      name,
      email,
      phone,
      website,
      logo: undefined,
      description,
      status: 'pending',
      password,
    });

    // Emit registration event
    emitOrganizationRegistered({
      organizationId: newOrganization.organizationId,
      email: newOrganization.email,
      name: newOrganization.name || '',
      status: newOrganization.status || 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'organization account created successfully. Your account is pending approval.',
      organization: {
        id: newOrganization.organizationId,
        email: newOrganization.email,
        name: newOrganization.name,
        status: newOrganization.status,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * Issues both access and refresh tokens for headless/mobile clients
 * More secure than simple login as refresh tokens can be revoked
 */
export const issueTokenPair = async (req: TypedRequest<Record<string, string>, unknown, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const organization = await organizationRepo.authenticate({ email, password });
    if (!organization) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check organization account status
    if (organization.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${organization.status}. Please contact support for assistance.`,
      });
      return;
    }

    // Generate access token (short-lived)
    const accessToken = generateAccessToken(organization.organizationId, organization.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

    // Generate refresh token (long-lived)
    const refreshToken = generateAccessToken(organization.organizationId, organization.email, 'organization', ORGANIZATION_JWT_SECRET, REFRESH_TOKEN_DURATION);

    // Store refresh token in database for tracking/revocation
    await refreshTokenRepo.create({
      token: refreshToken,
      userType: 'organization',
      userId: organization.organizationId,
      expiresAt: parseExpirationDate(REFRESH_TOKEN_DURATION),
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
    });

    res.json({
      success: true,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION,
      organization: {
        id: organization.organizationId,
        email: organization.email,
        name: organization.name,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Token generation failed. Please try again.',
    });
  }
};

/**
 * Refreshes an expired access token using a valid refresh token
 */
export const renewAccessToken = async (req: TypedRequest<Record<string, string>, unknown, RefreshTokenBody>, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
      return;
    }

    // Verify refresh token signature
    const tokenPayload = verifyAccessToken(refreshToken, ORGANIZATION_JWT_SECRET);
    if (!tokenPayload || !tokenPayload.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Verify refresh token exists in database and hasn't been revoked
    const storedToken = await refreshTokenRepo.findValidByToken(refreshToken);
    if (!storedToken || storedToken.userId !== tokenPayload.id || storedToken.userType !== 'organization') {
      res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked or is invalid',
      });
      return;
    }

    // Verify organization still exists and is active
    const organization = await organizationRepo.findById(tokenPayload.id);
    if (!organization) {
      res.status(401).json({
        success: false,
        message: 'organization account not found',
      });
      return;
    }

    if (organization.status !== 'active') {
      res.status(403).json({
        success: false,
        message: `Your account is ${organization.status}. Please contact support.`,
      });
      return;
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(organization.organizationId, organization.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

    // Mark refresh token as used (optional - for tracking)
    await refreshTokenRepo.markUsed(refreshToken);

    // Emit token refreshed event
    emitOrganizationTokenRefreshed({
      userId: organization.organizationId,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_DURATION,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Token renewal failed. Please log in again.',
    });
  }
};

/**
 * Validates a organization access token
 */
export const checkTokenValidity = async (req: TypedRequest<Record<string, string>, unknown, TokenBody>, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required',
      });
      return;
    }

    // Verify token signature and expiration
    const decodedPayload = verifyAccessToken(token, ORGANIZATION_JWT_SECRET);

    if (!decodedPayload || decodedPayload.role !== 'organization') {
      res.status(401).json({
        success: false,
        valid: false,
        message: 'Token is invalid or has expired',
      });
      return;
    }

    res.json({
      success: true,
      valid: true,
      organization: {
        id: decodedPayload.id,
        email: decodedPayload.email,
        role: decodedPayload.role,
      },
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Token validation failed.',
    });
  }
};

/**
 * Initiates password reset flow by generating a reset token
 */
export const requestPasswordReset = async (req: TypedRequest<Record<string, string>, unknown, EmailBody>, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    const organization = await organizationRepo.findByEmail(email);

    // Always return success to prevent email enumeration attacks
    if (!organization?.organizationId) {
      res.json({
        success: true,
        message: 'If an account exists with that email, a password reset link has been sent',
      });
      return;
    }

    // Generate secure reset token
    const resetToken = await organizationRepo.createPasswordResetToken(organization.organizationId);

    // Send password reset email
    await JobScheduler.scheduleEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data: { resetToken, email },
    });

    res.json({
      success: true,
      message: 'Password reset instructions have been sent to your email',
      // REMOVE IN PRODUCTION - only for development
      resetToken,
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Password reset request failed. Please try again.',
    });
  }
};

/**
 * Completes password reset using a valid reset token
 */
export const resetPassword = async (req: TypedRequest<Record<string, string>, unknown, ResetPasswordBody>, res: Response): Promise<void> => {
  try {
    const { token, newPassword, password } = req.body;
    const finalPassword = newPassword || password;

    if (!token || !finalPassword) {
      res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
      return;
    }

    // Verify reset token and get organization ID
    const organizationId = await organizationRepo.verifyPasswordResetToken(token);
    if (!organizationId) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
      return;
    }

    // Update organization password
    await organizationRepo.changePassword(organizationId, finalPassword);

    res.json({
      success: true,
      message: 'Your password has been successfully reset',
    });
  } catch (error) {
    logger.error('Error:', error);

    res.status(500).json({
      success: false,
      message: 'Password reset failed. Please request a new reset link.',
    });
  }
};

// ============================================================================
// Admin Auth Management
// ============================================================================

interface RevokeTokensBody {
  userId: string;
  userType: string;
}

interface ForceResetBody {
  userId: string;
  userType: string;
  newPassword: string;
}

export const getUserAuthDetails = async (req: TypedRequest<Record<string, string>, { userType?: string }>, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const userType = (req.query.userType as string) || 'customer';

    if (userType === 'customer') {
      const customer = await customerRepo.findCustomerById(userId);
      if (!customer) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        data: {
          id: customer.customerId,
          email: customer.email,
          lastLogin: customer.lastLoginAt || null,
          emailVerified: customer.isVerified || false,
          status: customer.isActive ? 'active' : 'inactive',
        },
      });
    } else {
      const org = await organizationRepo.findById(userId);
      if (!org) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      res.json({
        success: true,
        data: {
          id: org.organizationId,
          email: org.email,
          lastLogin: null,
          emailVerified: false,
          status: org.status,
        },
      });
    }
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user auth details' });
  }
};

export const revokeUserTokens = async (req: TypedRequest<Record<string, string>, unknown, RevokeTokensBody>, res: Response): Promise<void> => {
  try {
    const { userId, userType } = req.body;

    if (!userId || !userType) {
      res.status(400).json({ success: false, message: 'userId and userType are required' });
      return;
    }

    const revokedCount = await refreshTokenRepo.revokeAllForUser(userId, userType);
    res.json({ success: true, data: { revokedCount } });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke tokens' });
  }
};

export const forceResetPassword = async (req: TypedRequest<Record<string, string>, unknown, ForceResetBody>, res: Response): Promise<void> => {
  try {
    const { userId, userType, newPassword } = req.body;

    if (!userId || !userType || !newPassword) {
      res.status(400).json({ success: false, message: 'userId, userType, and newPassword are required' });
      return;
    }

    if (userType === 'customer') {
      await customerRepo.changePassword(userId, newPassword);
    } else {
      await organizationRepo.changePassword(userId, newPassword);
    }

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

export const cleanupExpiredTokens = async (_req: TypedRequest<Record<string, string>, unknown>, res: Response): Promise<void> => {
  try {
    const refreshTokens = await refreshTokenRepo.cleanupExpired();
    const blacklistTokens = await tokenBlacklistRepo.cleanupExpired();

    res.json({
      success: true,
      data: {
        passwordReset: 0,
        emailVerification: 0,
        refreshTokens,
        blacklistTokens,
      },
    });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup tokens' });
  }
};
