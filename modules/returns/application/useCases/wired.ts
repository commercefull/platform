import { ReturnRequestRepositoryImpl, ReturnItemRepositoryImpl, StoreCreditRepositoryImpl } from '../../infrastructure';
import {
  CreateReturnRequestUseCase,
  ApproveReturnRequestUseCase,
  DenyReturnRequestUseCase,
  MarkReturnInTransitUseCase,
  MarkReturnReceivedUseCase,
  CompleteReturnInspectionUseCase,
  CompleteReturnRequestUseCase,
  CancelReturnRequestUseCase,
  GetReturnRequestUseCase,
  ListReturnRequestsUseCase,
  GetStoreCreditBalanceUseCase,
  GetStoreCreditLedgerUseCase,
  DebitStoreCreditUseCase,
} from './ReturnUseCases';

const returnRepo = new ReturnRequestRepositoryImpl();
const itemRepo = new ReturnItemRepositoryImpl();
const storeCreditRepo = new StoreCreditRepositoryImpl();

export const createReturnRequestUseCase = new CreateReturnRequestUseCase(returnRepo);
export const approveReturnRequestUseCase = new ApproveReturnRequestUseCase(returnRepo);
export const denyReturnRequestUseCase = new DenyReturnRequestUseCase(returnRepo);
export const markReturnInTransitUseCase = new MarkReturnInTransitUseCase(returnRepo);
export const markReturnReceivedUseCase = new MarkReturnReceivedUseCase(returnRepo);
export const completeReturnInspectionUseCase = new CompleteReturnInspectionUseCase(returnRepo);
export const completeReturnRequestUseCase = new CompleteReturnRequestUseCase(returnRepo, storeCreditRepo);
export const cancelReturnRequestUseCase = new CancelReturnRequestUseCase(returnRepo);
export const getReturnRequestUseCase = new GetReturnRequestUseCase(returnRepo);
export const listReturnRequestsUseCase = new ListReturnRequestsUseCase(returnRepo);
export const getStoreCreditBalanceUseCase = new GetStoreCreditBalanceUseCase(storeCreditRepo);
export const getStoreCreditLedgerUseCase = new GetStoreCreditLedgerUseCase(storeCreditRepo);
export const debitStoreCreditUseCase = new DebitStoreCreditUseCase(storeCreditRepo);

export { itemRepo, storeCreditRepo };
