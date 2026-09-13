import supportDataRepository from '../infrastructure/repositories/SupportDataRepository';
import supportInfoRepository from '../infrastructure/repositories/SupportInfoRepository';
import type { TicketStatus, TicketPriority, TicketCategory, SupportTicket, SenderType } from '../domain/entities/SupportTicket';
import type { SupportAgent } from '../domain/repositories/SupportRepository';
import type { AlertStatus, NotificationChannel, PriceAlertType, FaqCategory, FaqArticle } from '../infrastructure/repositories/SupportInfoRepository';

export { supportDataRepository, supportInfoRepository, TicketPriority, TicketCategory, SenderType, SupportTicket, TicketStatus, SupportAgent, FaqArticle, AlertStatus, NotificationChannel, PriceAlertType, FaqCategory };
