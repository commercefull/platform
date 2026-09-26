import gdprDataRepository from '../../infrastructure/repositories/GdprDataRepository';
import { createGdprService } from '../wired';
import { CreateDataRequestUseCase } from './CreateDataRequest';
import { ManageGdprRequestsUseCase } from './ManageGdprRequests';
import { ManageAdminGdprUseCase } from './ManageAdminGdpr';
import { ManageCookieConsentUseCase } from './ManageCookieConsent';
import { ProcessDataRequestUseCase } from './ProcessDataRequest';

const gdprDataRequestRepo = gdprDataRepository.dataRequests;
const gdprCookieConsentRepo = gdprDataRepository.cookieConsent;
const adminGdprRepo = gdprDataRepository.admin;

export const createDataRequestUseCase = new CreateDataRequestUseCase(gdprDataRequestRepo);
export const manageGdprRequestsUseCase = new ManageGdprRequestsUseCase(gdprDataRequestRepo);
export const manageAdminGdprUseCase = new ManageAdminGdprUseCase(adminGdprRepo);
export const manageCookieConsentUseCase = new ManageCookieConsentUseCase(gdprCookieConsentRepo);
export const processDataRequestUseCase = new ProcessDataRequestUseCase(gdprDataRequestRepo, createGdprService());
