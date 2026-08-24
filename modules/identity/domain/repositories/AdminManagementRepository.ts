/**
 * Admin Management Repository Port
 *
 * Domain interface for admin user and role management.
 */

export interface AdminUserRecord {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'inactive' | 'suspended';
  roleId?: string;
  roleName?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdminUserParams {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface RoleRecord {
  roleId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  userCount?: number;
}

export interface AdminManagementRepository {
  // Admin users
  listAdminUsers(filters: { status?: string; limit?: number; offset?: number }): Promise<{ users: AdminUserRecord[]; total: number }>;
  findAdminById(userId: string): Promise<AdminUserRecord | null>;
  findAdminByEmail(email: string): Promise<AdminUserRecord | null>;
  createAdminUser(params: CreateAdminUserParams): Promise<AdminUserRecord>;
  updateAdminUser(userId: string, updates: Partial<AdminUserRecord>): Promise<AdminUserRecord | null>;
  deleteAdminUser(userId: string): Promise<void>;
  updateAdminLastLogin(userId: string): Promise<void>;

  // Roles
  listRoles(): Promise<RoleRecord[]>;
  findRoleById(roleId: string): Promise<RoleRecord | null>;
  createRole(params: { name: string; description?: string; permissions: string[] }): Promise<RoleRecord>;
  updateRole(roleId: string, updates: Partial<RoleRecord>): Promise<RoleRecord | null>;
  deleteRole(roleId: string): Promise<void>;
  assignRole(userId: string, roleId: string): Promise<void>;
  removeRole(userId: string): Promise<void>;
}
