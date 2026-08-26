import { ImportJobRepositoryImpl } from '../../infrastructure/repositories/ImportJobRepositoryImpl';
import { ImportMappingRepositoryImpl } from '../../infrastructure/repositories/ImportMappingRepositoryImpl';
import { ImportErrorRepositoryImpl } from '../../infrastructure/repositories/ImportErrorRepositoryImpl';
import { ManageImportJobsUseCase, ManageImportMappingsUseCase, ManageImportErrorsUseCase } from './Migration';

const importJobRepo = new ImportJobRepositoryImpl();
const importMappingRepo = new ImportMappingRepositoryImpl();
const importErrorRepo = new ImportErrorRepositoryImpl();

export const manageImportJobs = new ManageImportJobsUseCase(importJobRepo);
export const manageImportMappings = new ManageImportMappingsUseCase(importMappingRepo);
export const manageImportErrors = new ManageImportErrorsUseCase(importErrorRepo);
