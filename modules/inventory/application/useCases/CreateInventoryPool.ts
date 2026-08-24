/**
 * CreateInventoryPool Use Case
 *
 * Creates a shared inventory pool for multi-store businesses.
 */

import { generateUUID } from '../../../../libs/uuid';
import { InventoryValidationError } from '../../domain/errors/InventoryErrors';

export interface CreateInventoryPoolInput {
  ownerType: 'organization';
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

interface PoolRecord {
  poolId: string;
  name: string;
  poolType: string;
  linkedInventoryIds: string[];
  allocationStrategy: string;
  createdAt: Date;
}

interface CreatePoolRepositoryPort {
  createPool(input: {
    poolId: string;
    ownerType: 'organization';
    ownerId: string;
    name: string;
    poolType: 'shared' | 'virtual' | 'aggregated';
    linkedInventoryIds: string[];
    allocationStrategy: 'fifo' | 'nearest' | 'even_split' | 'priority';
    reservationPolicy: 'immediate' | 'deferred';
    isActive: boolean;
  }): Promise<PoolRecord>;
}

export class CreateInventoryPoolUseCase {
  constructor(private readonly inventoryRepository: CreatePoolRepositoryPort) {}

  async execute(input: CreateInventoryPoolInput): Promise<CreateInventoryPoolOutput> {
    if (!input.ownerId || !input.name || !input.poolType) {
      throw new InventoryValidationError('Owner ID, name, and pool type are required');
    }

    const poolId = generateUUID();

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
