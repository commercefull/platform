/**
 * ManageCommissionProfile Use Case
 *
 * Creates a new commission profile or updates an existing one.
 *
 * Validates: Requirements 3.17
 */

import commissionProfileRepo, { CommissionProfile } from '../../infrastructure/repositories/commissionProfileRepo';

// ============================================================================
// Command
// ============================================================================

export class ManageCommissionProfileCommand {
  constructor(
    public readonly name: string,
    public readonly defaultRate: number,
    public readonly commissionProfileId?: string,
    public readonly description?: string,
    public readonly categoryRates?: object,
    public readonly isActive: boolean = true,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ManageCommissionProfileResponse {
  commissionProfileId: string;
  name: string;
  description?: string;
  defaultRate: number;
  categoryRates?: object;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageCommissionProfileUseCase {
  constructor(private readonly repo: typeof commissionProfileRepo = commissionProfileRepo) {}

  async execute(command: ManageCommissionProfileCommand): Promise<ManageCommissionProfileResponse> {
    let profile: CommissionProfile | null;

    if (command.commissionProfileId) {
      // Update existing profile
      profile = await this.repo.update(command.commissionProfileId, {
        name: command.name,
        description: command.description,
        defaultRate: command.defaultRate,
        categoryRates: command.categoryRates,
        isActive: command.isActive,
      });

      if (!profile) {
        throw new Error(`Commission profile not found: ${command.commissionProfileId}`);
      }
    } else {
      // Create new profile
      profile = await this.repo.create({
        name: command.name,
        description: command.description,
        defaultRate: command.defaultRate,
        categoryRates: command.categoryRates,
        isActive: command.isActive,
      });

      if (!profile) {
        throw new Error('Failed to create commission profile');
      }
    }

    return this.mapToResponse(profile);
  }

  private mapToResponse(p: CommissionProfile): ManageCommissionProfileResponse {
    return {
      commissionProfileId: p.commissionProfileId,
      name: p.name,
      description: p.description,
      defaultRate: p.defaultRate,
      categoryRates: p.categoryRates as object | undefined,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
