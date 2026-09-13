import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';
import { CreateDataRequestUseCase } from './CreateDataRequest';
import { ManageGdprRequestsUseCase, ManageAdminGdprUseCase } from './ManageGdpr';

const gdprDataRequestRepo = gdprDataRepository.dataRequests;
const adminGdprRepo = gdprDataRepository.admin;

export const createDataRequestUseCase = new CreateDataRequestUseCase(gdprDataRequestRepo);
export const manageGdprRequestsUseCase = new ManageGdprRequestsUseCase(gdprDataRequestRepo);
export const manageAdminGdprUseCase = new ManageAdminGdprUseCase(adminGdprRepo);
