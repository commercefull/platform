import contentDataRepository from '../../infrastructure/repositories/ContentDataRepository';
import { CreatePageUseCase } from './CreatePage';
import { UpdatePageUseCase } from './UpdatePage';
import { PublishPageUseCase } from './PublishPage';
import { ManageContentUseCase } from './ManageContent';

const contentRepo = contentDataRepository.pages;

export const createPageUseCase = new CreatePageUseCase(contentRepo);
export const updatePageUseCase = new UpdatePageUseCase(contentRepo);
export const publishPageUseCase = new PublishPageUseCase(contentRepo);
export const manageContentUseCase = new ManageContentUseCase(contentRepo);
