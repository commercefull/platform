import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';
import { CreateDataRequestUseCase } from './CreateDataRequest';
import { ManageGdprRequestsUseCase } from './ManageGdpr';

const gdprDataRequestRepo = gdprDataRepository.dataRequests;

export const createDataRequestUseCase = new CreateDataRequestUseCase(gdprDataRequestRepo);
export const manageGdprRequestsUseCase = new ManageGdprRequestsUseCase();
