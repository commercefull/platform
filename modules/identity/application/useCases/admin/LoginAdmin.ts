/**
 * LoginAdmin Use Case
 * Authenticates platform administrators (separate from merchants)
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface LoginAdminInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginAdminOutput {
  adminId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  sessionId: string;
}

export interface AdminRepository {
  findByEmail(email: string): Promise<AdminUser | null>;
  updateLastLogin(adminId: string): Promise<void>;
}

export interface AdminUser {
  adminId: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'support' | 'operations';
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthService {
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export interface SessionService {
  createSession(data: { userId: string; userType: string; email: string; role: string; permissions: string[] }): Promise<string>;
}

export class LoginAdminUseCase {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(input: LoginAdminInput): Promise<LoginAdminOutput> {
    if (!input.email || !input.password) {
      throw new Error('Email and password are required');
    }

    // Find admin by email
    const admin = await this.adminRepo.findByEmail(input.email);
    if (!admin) {
      eventBus.emit('admin.login_failed', {
        email: input.email,
        reason: 'user_not_found',
      });
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.authService.verifyPassword(input.password, admin.passwordHash);
    if (!isValidPassword) {
      eventBus.emit('admin.login_failed', {
        email: input.email,
        reason: 'invalid_password',
      });
      throw new Error('Invalid credentials');
    }

    // Check if account is active
    if (admin.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Create session
    const sessionId = await this.sessionService.createSession({
      userId: admin.adminId,
      userType: 'admin',
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    });

    // Update last login
    await this.adminRepo.updateLastLogin(admin.adminId);

    // Emit success event
    eventBus.emit('admin.logged_in', {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
    });

    return {
      adminId: admin.adminId,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions || [],
      sessionId,
    };
  }
}
