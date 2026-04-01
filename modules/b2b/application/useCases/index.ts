/**
 * B2B Use Cases Index
 * Exports all B2B use cases for easy importing
 */

// Company Use Cases
export { CreateCompanyUseCase, CreateCompanyCommand, CreateCompanyResponse } from './company/CreateCompany';
export { ApproveCompanyUseCase, ApproveCompanyCommand, ApproveCompanyResponse } from './company/ApproveCompany';

// Quote Use Cases
export { CreateQuoteUseCase, CreateQuoteCommand, CreateQuoteResponse } from './quote/CreateQuote';
export { SubmitQuoteUseCase, SubmitQuoteCommand, SubmitQuoteResponse } from './quote/SubmitQuote';

// Workflow Use Cases
export * from './workflow';

// Credit & Purchase Order Use Cases
export {
  SubmitB2BPurchaseOrderUseCase,
  SubmitB2BPurchaseOrderCommand,
  SubmitB2BPurchaseOrderResponse,
} from './SubmitB2BPurchaseOrder';
export {
  RecordCreditTransactionUseCase,
  RecordCreditTransactionCommand,
  RecordCreditTransactionResponse,
} from './RecordCreditTransaction';
export {
  ManageB2BPriceListUseCase,
  ManageB2BPriceListCommand,
  ManageB2BPriceListResponse,
} from './ManageB2BPriceList';
export {
  GetCompanyCreditStatusUseCase,
  GetCompanyCreditStatusCommand,
  GetCompanyCreditStatusResponse,
} from './GetCompanyCreditStatus';
export { ManageB2BUserUseCase, ManageB2BUserCommand, ManageB2BUserResponse } from './ManageB2BUser';
