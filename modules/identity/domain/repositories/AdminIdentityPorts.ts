/**
 * Admin Identity Repository Ports
 *
 * Domain-facing ports for admin user/role management and admin auth lookups.
 * Concrete implementations live in infrastructure/repositories (IdentityRepository)
 * and are injected via application/wired.ts.
 */

import type { IdentityAdminUser, Role } from '../../../../libs/db/types';
import type { UserStoreAssignment } from '../entities/UserStoreAssignment';

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

export type AdminUserRecord = IdentityAdminUser & { roleId?: string; roleName?: string };
export type RoleRecord = Role & { userCount?: number };

export interface CreateAdminUserParams {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface AdminUserManagementPort {
  listManagedAdminUsers(filters: { status?: string; limit?: number; offset?: number }): Promise<{
    users: AdminUserRecord[];
    total: number;
  }>;
  findManagedAdminUserById(userId: string): Promise<AdminUserRecord | null>;
  findManagedAdminUserByEmail(email: string): Promise<{ userId: string } | null>;
  createManagedAdminUser(params: CreateAdminUserParams): Promise<string>;
  updateManagedAdminUser(
    userId: string,
    updates: { firstName?: string; lastName?: string; status?: string; roleId?: string },
  ): Promise<void>;
  deleteManagedAdminUser(userId: string): Promise<void>;
  listRoles(): Promise<(RoleRecord & { userCount: number })[]>;
  findRoleById(roleId: string): Promise<RoleRecord | null>;
  createRole(params: { name: string; description?: string; permissions: string[] }): Promise<string>;
  updateRole(roleId: string, updates: { name?: string; description?: string; permissions?: string[] }): Promise<void>;
  deleteRole(roleId: string): Promise<void>;
  countRoleAssignments(roleId: string): Promise<number>;
}

export interface AdminAuthPort {
  findAdminByEmail(email: string): Promise<AdminUser | null>;
  updateAdminLastLogin(adminId: string): Promise<void>;
  findStoreUsersByUserId(userId: string): Promise<UserStoreAssignment[]>;
}
