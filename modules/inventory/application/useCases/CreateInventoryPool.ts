/**
 * CreateInventoryPool Use Case
 *
 * Creates a shared inventory pool for multi-store businesses.
 */

export interface CreateInventoryPoolInput {
  ownerType: 'business' | 'merchant';
  ownerId: string;
  name: string;
  poolType: 'shared' | 'virtual' | 'aggregated';
  linkedInventoryIds?: string[];
  allocationStrategy?: 'fifo' | 'nearest' | 'even_split' | 'priority';
  reservationPolicy?: 'immediate' | 'deferred';
}

export interface CreateInventoryPoolOutput {
  poolId: string;
  name: string;
  poolType: string;
  linkedInventoryCount: number;
  allocationStrategy: string;
  createdAt: string;
}

export class CreateInventoryPoolUseCase {
  constructor(private readonly inventoryRepository: any) {}

  async execute(input: CreateInventoryPoolInput): Promise<CreateInventoryPoolOutput> {
    if (!input.ownerId || !input.name || !input.poolType) {
      throw new Error('Owner ID, name, and pool type are required');
    }

    const poolId = `pool_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

    const pool = await this.inventoryRepository.createPool({
      poolId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      name: input.name,
      poolType: input.poolType,
      linkedInventoryIds: input.linkedInventoryIds || [],
      allocationStrategy: input.allocationStrategy || 'fifo',
      reservationPolicy: input.reservationPolicy || 'immediate',
      isActive: true,
    });

    return {
      poolId: pool.poolId,
      name: pool.name,
      poolType: pool.poolType,
      linkedInventoryCount: pool.linkedInventoryIds.length,
      allocationStrategy: pool.allocationStrategy,
      createdAt: pool.createdAt.toISOString(),
    };
  }
}
