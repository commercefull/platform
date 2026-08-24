import { OrderDataRepository } from '../../infrastructure';

const orderRepo = OrderDataRepository.commands;
import { ListOrdersUseCase } from './ListOrders';
import { GetOrderUseCase } from './GetOrder';
import { UpdateOrderStatusUseCase } from './UpdateOrderStatus';
import { CancelOrderUseCase } from './CancelOrder';
import { ProcessRefundUseCase } from './ProcessRefund';
import { AddOrderNoteUseCase } from './AddOrderNote';
import { CreateOrderUseCase } from './CreateOrder';

export const listOrdersUseCase = new ListOrdersUseCase(orderRepo);
export const getOrderUseCase = new GetOrderUseCase(orderRepo);
export const updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepo);
export const cancelOrderUseCase = new CancelOrderUseCase(orderRepo);
export const processRefundUseCase = new ProcessRefundUseCase(orderRepo);
export const addOrderNoteUseCase = new AddOrderNoteUseCase();
export const createOrderUseCase = new CreateOrderUseCase(orderRepo);
