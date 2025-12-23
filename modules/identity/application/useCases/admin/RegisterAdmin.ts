/**
 * RegisterAdmin Use Case
 * Creates new platform administrator accounts (super admin only)
 */

import { eventBus } from '../../../../../libs/events/eventBus';

export interface RegisterAdminInput {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'support' | 'operations';
  permissions?: string[];
  createdBy: string; // Admin ID of the creator (must be super_admin)
}

export interface RegisterAdminOutput {
  adminId: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

export interface AdminRepository {
  findByEmail(email: string): Promise<any | null>;
  findById(adminId: string): Promise<any | null>;
  create(admin: { email: string; name: string; passwordHash: string; role: string; permissions: string[]; status: string }): Promise<any>;
}

export interface AuthService {
  hashPassword(password: string): Promise<string>;
}

export class RegisterAdminUseCase {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly authService: AuthService,
  ) {}

  async execute(input: RegisterAdminInput): Promise<RegisterAdminOutput> {
    // Validate input
    if (!input.email || !input.password || !input.name || !input.role) {
      throw new Error('Email, password, name, and role are required');
    }

    // Validate password strength
    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if creating admin has permission (must be super_admin)
    const creator = await this.adminRepo.findById(input.createdBy);
    if (!creator || creator.role !== 'super_admin') {
      throw new Error('Only super admins can create admin accounts');
    }

    // Check if email already exists
    const existingAdmin = await this.adminRepo.findByEmail(input.email);
    if (existingAdmin) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.authService.hashPassword(input.password);

    // Create admin
    const admin = await this.adminRepo.create({
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: input.role,
      permissions: input.permissions || [],
      status: 'active',
    });

    // Emit event
    eventBus.emit('admin.registered', {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      createdBy: input.createdBy,
    });

    return {
      adminId: admin.adminId,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      createdAt: admin.createdAt,
    };
  }
}
