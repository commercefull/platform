import promotionRuleRepository from '../../infrastructure/repositories/PromotionRuleRepository';
import { ListPromotionsUseCase } from './ListPromotions';
import { CreatePromotionUseCase } from './CreatePromotion';
import { UpdatePromotionUseCase } from './UpdatePromotion';
import { DeletePromotionUseCase } from './DeletePromotion';

const promotionRepo = promotionRuleRepository.promotions;

export const listPromotionsUseCase = new ListPromotionsUseCase(promotionRepo);
export const createPromotionUseCase = new CreatePromotionUseCase(promotionRepo);
export const updatePromotionUseCase = new UpdatePromotionUseCase(promotionRepo);
export const deletePromotionUseCase = new DeletePromotionUseCase(promotionRepo);
