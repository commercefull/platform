import { CompanyRepositoryImpl } from '../../infrastructure/repositories/CompanyRepositoryImpl';
import { B2BUserRepositoryImpl } from '../../infrastructure/repositories/B2BUserRepositoryImpl';
import { QuoteRepositoryImpl } from '../../infrastructure/repositories/QuoteRepositoryImpl';
import { ApprovalWorkflowRepositoryImpl } from '../../infrastructure/repositories/ApprovalWorkflowRepositoryImpl';
import { B2BController } from '../../interface/controllers/b2bController';

const companyRepo = new CompanyRepositoryImpl();
const userRepo = new B2BUserRepositoryImpl();
const quoteRepo = new QuoteRepositoryImpl();
const approvalRepo = new ApprovalWorkflowRepositoryImpl();

export const b2bController = new B2BController(companyRepo, userRepo, quoteRepo, approvalRepo);

export {
  ManageCompanyUseCase,
  ManageB2BUserUseCase,
  ManageQuoteUseCase,
  ManageApprovalWorkflowUseCase,
} from '../../application/useCases/B2B';

export {
  CompanyRepositoryImpl,
  B2BUserRepositoryImpl,
  QuoteRepositoryImpl,
  ApprovalWorkflowRepositoryImpl,
} from '../../infrastructure';
