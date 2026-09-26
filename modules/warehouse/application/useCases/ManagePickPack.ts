/**
 * ManagePickPack Use Case
 *
 * Pick/pack lifecycle within a warehouse: create (validated), assignment, and
 * the picking → packing state transitions, emitting the corresponding domain
 * events. Transition failures (missing record or wrong status) surface as a
 * not-found error.
 */

import { eventBus } from '../../../../libs/events/eventBus';
import { PickPackRecordNotFoundError, WarehouseValidationError } from '../../domain/errors/WarehouseErrors';
import type { CreatePickPackInput, WarehousePickPack } from '../../domain/repositories/WarehouseRepository';

interface PickPackRepositoryPort {
  create(input: CreatePickPackInput): Promise<WarehousePickPack>;
  startPicking(id: string): Promise<WarehousePickPack | null>;
  completePicking(id: string): Promise<WarehousePickPack | null>;
  startPacking(id: string): Promise<WarehousePickPack | null>;
  completePacking(id: string): Promise<WarehousePickPack | null>;
  assignTo(id: string, assignedTo: string): Promise<WarehousePickPack | null>;
  findById(id: string): Promise<WarehousePickPack | null>;
  findByWarehouse(warehouseId: string, status?: string): Promise<WarehousePickPack[]>;
}

export class ManagePickPackUseCase {
  constructor(private readonly pickPack: PickPackRepositoryPort) {}

  async create(warehouseId: string, input: Omit<CreatePickPackInput, 'distributionWarehouseId'>): Promise<WarehousePickPack> {
    if (!input.pickPackNumber) {
      throw new WarehouseValidationError('pickPackNumber is required');
    }

    const record = await this.pickPack.create({ ...input, distributionWarehouseId: warehouseId });

    eventBus.emit('warehouse.pick.created', {
      pickPackId: record.warehousePickPackId,
      warehouseId,
      pickPackNumber: input.pickPackNumber,
    });

    return record;
  }

  async startPicking(pickPackId: string): Promise<WarehousePickPack> {
    const record = await this.pickPack.startPicking(pickPackId);

    if (!record) {
      throw new PickPackRecordNotFoundError(pickPackId);
    }

    eventBus.emit('warehouse.pick.created', { pickPackId, warehouseId: record.distributionWarehouseId });

    return record;
  }

  async completePicking(pickPackId: string): Promise<WarehousePickPack> {
    const record = await this.pickPack.completePicking(pickPackId);

    if (!record) {
      throw new PickPackRecordNotFoundError(pickPackId);
    }

    eventBus.emit('warehouse.pick.completed', { pickPackId, warehouseId: record.distributionWarehouseId });

    return record;
  }

  async startPacking(pickPackId: string): Promise<WarehousePickPack> {
    const record = await this.pickPack.startPacking(pickPackId);

    if (!record) {
      throw new PickPackRecordNotFoundError(pickPackId);
    }

    return record;
  }

  async completePacking(pickPackId: string): Promise<WarehousePickPack> {
    const record = await this.pickPack.completePacking(pickPackId);

    if (!record) {
      throw new PickPackRecordNotFoundError(pickPackId);
    }

    eventBus.emit('warehouse.pack.completed', { pickPackId, warehouseId: record.distributionWarehouseId });

    return record;
  }

  async assign(pickPackId: string, assignedTo: string): Promise<WarehousePickPack> {
    if (!assignedTo) {
      throw new WarehouseValidationError('assignedTo is required');
    }

    const record = await this.pickPack.assignTo(pickPackId, assignedTo);

    if (!record) {
      throw new PickPackRecordNotFoundError(pickPackId);
    }

    return record;
  }

  async findById(id: string): Promise<WarehousePickPack | null> {
    return this.pickPack.findById(id);
  }

  async findByWarehouse(warehouseId: string, status?: string): Promise<WarehousePickPack[]> {
    return this.pickPack.findByWarehouse(warehouseId, status);
  }
}
