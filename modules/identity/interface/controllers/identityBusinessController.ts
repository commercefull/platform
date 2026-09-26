import type { HttpRequest, HttpResponse } from 'libs/http';

import { generateAccessToken, verifyAccessToken } from '../../utils/jwtHelpers';
import { JobScheduler } from '../../../../libs/jobs/cronScheduler';
import type { CredentialSubjectPort } from '../../application/ports/CredentialSubjectPort';
import { emitOrganizationLogin, emitOrganizationRegistered } from '../../domain/events/emitIdentityEvent';
import {
  orgCredentialPort,
  logoutSessionUseCase,
  customerCredentialPort,
  issueOrganizationTokenPairUseCase,
  renewOrganizationAccessTokenUseCase,
  cleanupExpiredTokensUseCase,
} from '../../application/wired';
import { IssueTokenPairCommand } from '../../application/useCases/token/IssueTokenPair';
import { RenewAccessTokenCommand } from '../../application/useCases/token/RenewAccessToken';
import { getErrorStatusCode, getErrorMessage } from '../../../../libs/errors';
import { getSecret } from '../../../../libs/secrets';

// Environment configuration
const ORGANIZATION_JWT_SECRET = getSecret('ORGANIZATION_JWT_SECRET');
const ACCESS_TOKEN_DURATION = process.env.JWT_EXPIRES_IN || '7d';

const orgPort: CredentialSubjectPort = orgCredentialPort;
const customerPort: CredentialSubjectPort = customerCredentialPort;

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
export const loginOrganization = async (req: HttpRequest<Record<string, string>, unknown, LoginBody>, res: HttpResponse): Promise<void> => {
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
  const subject = await orgPort.authenticate(email, password);
  if (!subject) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Check organization account status
  if (subject.status !== 'active') {
    res.status(403).json({
      success: false,
      message: `Your account is ${subject.status}. Please contact support for assistance.`,
    });
    return;
  }

  // Emit login event
  emitOrganizationLogin({
    organizationId: subject.id,
    email: subject.email,
    name: subject.name || '',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Generate access token
  const accessToken = generateAccessToken(subject.id, subject.email, 'organization', ORGANIZATION_JWT_SECRET, ACCESS_TOKEN_DURATION);

  res.json({
    success: true,
    accessToken,
    organization: {
      id: subject.id,
      email: subject.email,
      name: subject.name,
      status: subject.status,
    },
  });
};

/**
 * Registers a new organization account
 * New accounts start with 'pending' status and require admin approval
 */
export const registerOrganization = async (
  req: HttpRequest<Record<string, string>, unknown, RegisterBody>,
  res: HttpResponse,
): Promise<void> => {
  const { email, password, name, phone, website: _website, description: _description } = req.body;

  // Validate required fields
  if (!email || !password || !name) {
    res.status(400).json({
      success: false,
      message: 'Email, password, and business name are required',
    });
    return;
  }

  // Check for existing organization
  const existing = await orgPort.findByEmail(email);
  if (existing) {
    res.status(409).json({
      success: false,
      message: 'A organization account with this email already exists',
    });
    return;
  }

  // Create new organization with pending status
  const newSubject = await orgPort.createWithPassword({
    name,
    email,
    phone,
    password,
    status: 'pending',
  });

  // Emit registration event
  emitOrganizationRegistered({
    organizationId: newSubject.id,
    email: newSubject.email,
    name: newSubject.name || '',
    status: newSubject.status || 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'organization account created successfully. Your account is pending approval.',
    organization: {
      id: newSubject.id,
      email: newSubject.email,
      name: newSubject.name,
      status: newSubject.status,
    },
  });
};

/**
 * Issues both access and refresh tokens for headless/mobile clients
 * More secure than simple login as refresh tokens can be revoked
 */
export const issueTokenPair = async (req: HttpRequest<Record<string, string>, unknown, LoginBody>, res: HttpResponse): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await issueOrganizationTokenPairUseCase.execute(
      new IssueTokenPairCommand(email, password, req.headers['user-agent'] || null, req.ip || null),
    );

    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
      organization: {
        id: result.subject.id,
        email: result.subject.email,
        name: result.subject.name,
      },
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Refreshes an expired access token using a valid refresh token
 */
export const renewAccessToken = async (
  req: HttpRequest<Record<string, string>, unknown, RefreshTokenBody>,
  res: HttpResponse,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await renewOrganizationAccessTokenUseCase.execute(new RenewAccessTokenCommand(refreshToken, req.ip));

    res.json({
      success: true,
      accessToken: result.accessToken,
      tokenType: 'Bearer',
      expiresIn: result.expiresIn,
    });
  } catch (error) {
    res.status(getErrorStatusCode(error)).json({ success: false, message: getErrorMessage(error) });
  }
};

/**
 * Validates a organization access token
 */
export const checkTokenValidity = async (
  req: HttpRequest<Record<string, string>, unknown, TokenBody>,
  res: HttpResponse,
): Promise<void> => {
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
};

/**
 * Initiates password reset flow by generating a reset token
 */
export const requestPasswordReset = async (
  req: HttpRequest<Record<string, string>, unknown, EmailBody>,
  res: HttpResponse,
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const subject = await orgPort.findByEmail(email);

  // Always return success to prevent email enumeration attacks
  if (!subject?.id) {
    res.json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent',
    });
    return;
  }

  // Generate secure reset token
  const resetToken = await orgPort.createPasswordResetToken(subject.id);

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
};

/**
 * Completes password reset using a valid reset token
 */
export const resetPassword = async (
  req: HttpRequest<Record<string, string>, unknown, ResetPasswordBody>,
  res: HttpResponse,
): Promise<void> => {
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
  const organizationId = await orgPort.verifyPasswordResetToken(token);
  if (!organizationId) {
    res.status(400).json({
      success: false,
      message: 'Password reset token is invalid or has expired',
    });
    return;
  }

  // Update organization password
  await orgPort.changePassword(organizationId, finalPassword);

  res.json({
    success: true,
    message: 'Your password has been successfully reset',
  });
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

export const getUserAuthDetails = async (
  req: HttpRequest<Record<string, string>, { userType?: string }>,
  res: HttpResponse,
): Promise<void> => {
  const userId = String(req.params.userId);
  const userType = (req.query.userType as string) || 'customer';

  if (userType === 'customer') {
    const subject = await customerPort.findById(userId);
    if (!subject) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: subject.id,
        email: subject.email,
        lastLogin: subject.lastLoginAt || null,
        emailVerified: subject.isVerified || false,
        status: subject.status,
      },
    });
  } else {
    const subject = await orgPort.findById(userId);
    if (!subject) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        id: subject.id,
        email: subject.email,
        lastLogin: null,
        emailVerified: false,
        status: subject.status,
      },
    });
  }
};

export const revokeUserTokens = async (
  req: HttpRequest<Record<string, string>, unknown, RevokeTokensBody>,
  res: HttpResponse,
): Promise<void> => {
  const { userId, userType } = req.body;

  if (!userId || !userType) {
    res.status(400).json({ success: false, message: 'userId and userType are required' });
    return;
  }

  const revokedCount = await logoutSessionUseCase.revokeAllForUser(userId, userType);
  res.json({ success: true, data: { revokedCount } });
};

export const forceResetPassword = async (
  req: HttpRequest<Record<string, string>, unknown, ForceResetBody>,
  res: HttpResponse,
): Promise<void> => {
  const { userId, userType, newPassword } = req.body;

  if (!userId || !userType || !newPassword) {
    res.status(400).json({ success: false, message: 'userId, userType, and newPassword are required' });
    return;
  }

  if (userType === 'customer') {
    await customerPort.changePassword(userId, newPassword);
  } else {
    await orgPort.changePassword(userId, newPassword);
  }

  res.json({ success: true, message: 'Password has been reset successfully' });
};

export const cleanupExpiredTokens = async (_req: HttpRequest<Record<string, string>, unknown>, res: HttpResponse): Promise<void> => {
  const { refreshTokens, blacklistTokens } = await cleanupExpiredTokensUseCase.execute();

  res.json({
    success: true,
    data: {
      passwordReset: 0,
      emailVerification: 0,
      refreshTokens,
      blacklistTokens,
    },
  });
};
