/**
 * ProvisionAdminUser Use Case
 *
 * Creates a platform admin user (used by the `job:new:admin` CLI): validates
 * the role, derives default permissions, rejects duplicate emails, and
 * persists the record.
 */

import { AppError } from '../../../../libs/errors';
import type { AdminUser } from '../../domain/repositories/AdminIdentityPorts';

export type AdminRole = 'super_admin' | 'admin' | 'support' | 'operations';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'admin', 'support', 'operations'];

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  admin: [
    'users:read',
    'users:write',
    'users:delete',
    'orders:read',
    'orders:write',
    'products:read',
    'products:write',
    'analytics:read',
  ],
  support: ['users:read', 'orders:read', 'orders:write', 'support:read', 'support:write'],
  operations: ['orders:read', 'orders:write', 'inventory:read', 'inventory:write', 'fulfillment:read', 'fulfillment:write'],
};

export class AdminAlreadyExistsError extends AppError {
  constructor(email: string) {
    super(`Admin user with email "${email}" already exists`, 409, { code: 'identity.admin_exists' });
  }
}

export class InvalidAdminRoleError extends AppError {
  constructor(role: string) {
    super(`Invalid role "${role}". Valid roles: ${ADMIN_ROLES.join(', ')}`, 400, {
      code: 'identity.invalid_admin_role',
    });
  }
}

interface AdminProvisioningPort {
  findAdminByEmail(email: string): Promise<AdminUser | null>;
  createAdmin(input: {
    email: string;
    name: string;
    passwordHash: string;
    role: string;
    permissions: string[];
    status: string;
  }): Promise<AdminUser>;
}

export class ProvisionAdminUserUseCase {
  constructor(private readonly adminRepo: AdminProvisioningPort) {}

  async execute(input: {
    email: string;
    name: string;
    passwordHash: string;
    role: string;
  }): Promise<AdminUser> {
    if (!ADMIN_ROLES.includes(input.role as AdminRole)) {
      throw new InvalidAdminRoleError(input.role);
    }
    const role = input.role as AdminRole;

    const existing = await this.adminRepo.findAdminByEmail(input.email);
    if (existing) {
      throw new AdminAlreadyExistsError(input.email);
    }

    return this.adminRepo.createAdmin({
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role,
      permissions: ROLE_PERMISSIONS[role],
      status: 'active',
    });
  }
}
