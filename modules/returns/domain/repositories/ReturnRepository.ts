import type { ReturnRequest, ReturnStatus, ReturnType, ReturnItem } from '../entities/ReturnRequest';
import type { StoreCreditLedgerEntry, CustomerStoreCreditBalance } from '../entities/StoreCredit';

export interface ReturnRequestRepository {
  findById(id: string): Promise<ReturnRequest | null>;
  findByReturnNumber(returnNumber: string): Promise<ReturnRequest | null>;
  findByOrderId(orderId: string): Promise<ReturnRequest[]>;
  findByCustomerId(customerId: string, limit?: number, offset?: number): Promise<ReturnRequest[]>;
  findByStatus(status: ReturnStatus, limit?: number, offset?: number): Promise<ReturnRequest[]>;
  findPending(limit?: number): Promise<ReturnRequest[]>;
  findInTransit(limit?: number): Promise<ReturnRequest[]>;
  findNeedingInspection(limit?: number): Promise<ReturnRequest[]>;

  create(returnRequest: ReturnRequest): Promise<ReturnRequest>;
  update(returnRequest: ReturnRequest): Promise<ReturnRequest | null>;
  delete(id: string): Promise<boolean>;

  countByStatus(status: ReturnStatus): Promise<number>;
  countByCustomerId(customerId: string): Promise<number>;
  getStatistics(): Promise<Record<ReturnStatus, number>>;
  getStatisticsByType(): Promise<Record<ReturnType, number>>;
}

export interface ReturnItemRepository {
  findByReturnId(returnId: string): Promise<ReturnItem[]>;
  findById(itemId: string): Promise<ReturnItem | null>;
  createMany(returnId: string, items: ReturnItem[]): Promise<ReturnItem[]>;
  updateInspection(itemId: string, inspectionNotes: string, condition: string, restockItem: boolean): Promise<ReturnItem | null>;
}

export interface StoreCreditRepository {
  getBalance(customerId: string): Promise<CustomerStoreCreditBalance>;
  addEntry(entry: StoreCreditLedgerEntry): Promise<StoreCreditLedgerEntry>;
  getLedger(customerId: string, limit?: number): Promise<StoreCreditLedgerEntry[]>;
  findByReference(referenceType: string, referenceId: string): Promise<StoreCreditLedgerEntry | null>;
  processExpiry(): Promise<number>;
}
